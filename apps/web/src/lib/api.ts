import axios, { type AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:1961/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// ─── Request interceptor — attach access token ────────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor — auto-refresh on 401 ──────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (val: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await apiClient.post<{
          data: { accessToken: string; refreshToken: string };
        }>('/auth/refresh', { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Auth API ─────────────────────────────────────────────────────────────────

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  traceId: string;
}

export const authApi = {
  signUp: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> => {
    const response = await apiClient.post<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>>(
      '/auth/signup',
      data,
    );
    return response.data;
  },

  signIn: async (data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> => {
    const response = await apiClient.post<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>>(
      '/auth/login',
      data,
    );
    return response.data;
  },

  signOut: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};

export const usersApi = {
  me: async (): Promise<ApiResponse<AuthUser & { profile?: object }>> => {
    const response = await apiClient.get<ApiResponse<AuthUser & { profile?: object }>>('/users/me');
    return response.data;
  },
};

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  getProfile: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>('/profile/me');
    return response.data;
  },

  updateProfile: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put<ApiResponse<any>>('/profile/me', data);
    return response.data;
  },

  getHealth: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>('/profile/health');
    return response.data;
  },
};

// ─── Evidence API ─────────────────────────────────────────────────────────────

export const evidenceApi = {
  getEvidence: async (params?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<{ items: any[]; total: number; counts: Record<string, number> }>> => {
    const response = await apiClient.get<ApiResponse<any>>('/evidence', { params });
    return response.data;
  },

  createEvidence: async (data: {
    category: string;
    claim: string;
    context?: string;
    source: string;
    sourceDetail?: string;
    confidenceScore?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/evidence', data);
    return response.data;
  },

  updateEvidence: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/evidence/${id}`, data);
    return response.data;
  },

  verifyEvidence: async (
    id: string,
    data: { status: 'PENDING' | 'VERIFIED' | 'REJECTED'; verifierNotes?: string },
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/evidence/${id}/verify`, data);
    return response.data;
  },

  bulkVerify: async (data: {
    ids: string[];
    status: 'VERIFIED' | 'REJECTED';
  }): Promise<ApiResponse<{ updatedCount: number; status: string }>> => {
    const response = await apiClient.post<ApiResponse<any>>('/evidence/bulk-verify', data);
    return response.data;
  },

  deleteEvidence: async (id: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> => {
    const response = await apiClient.delete<ApiResponse<any>>(`/evidence/${id}`);
    return response.data;
  },

  uploadAttachment: async (id: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<any>>(`/evidence/${id}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ─── Role Profiles API ────────────────────────────────────────────────────────

export const roleProfilesApi = {
  getRoleProfiles: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/role-profiles');
    return response.data;
  },

  getRoleProfile: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/role-profiles/${id}`);
    return response.data;
  },

  createRoleProfile: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/role-profiles', data);
    return response.data;
  },

  updateRoleProfile: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put<ApiResponse<any>>(`/role-profiles/${id}`, data);
    return response.data;
  },

  deleteRoleProfile: async (id: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> => {
    const response = await apiClient.delete<ApiResponse<any>>(`/role-profiles/${id}`);
    return response.data;
  },

  setDefault: async (id: string): Promise<ApiResponse<{ success: boolean; defaultRoleProfileId: string }>> => {
    const response = await apiClient.post<ApiResponse<any>>(`/role-profiles/${id}/set-default`);
    return response.data;
  },
};

// ─── Resumes API ──────────────────────────────────────────────────────────────

export const resumesApi = {
  parseText: async (text: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/resumes/parse-text', { text });
    return response.data;
  },

  importResume: async (text: string, autoSeedEvidence = true): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/resumes/import', { text, autoSeedEvidence });
    return response.data;
  },

  uploadResumeFile: async (
    file: File,
    name?: string,
    autoSeedEvidence = true,
  ): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    params.append('autoSeedEvidence', String(autoSeedEvidence));

    const response = await apiClient.post<ApiResponse<any>>(`/resumes/upload?${params.toString()}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listResumes: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/resumes');
    return response.data;
  },

  getResume: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/resumes/${id}`);
    return response.data;
  },

  createResume: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/resumes', data);
    return response.data;
  },

  scoreResume: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(`/resumes/${id}/score`, data);
    return response.data;
  },

  tailorResume: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(`/resumes/${id}/tailor`, data);
    return response.data;
  },

  listVariants: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/resumes/variants');
    return response.data;
  },

  getVariant: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/resumes/variants/${id}`);
    return response.data;
  },

  getVariantDiff: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/resumes/variants/${id}/diff`);
    return response.data;
  },

  exportVariant: async (
    id: string,
    format: 'html' | 'text' | 'json' = 'html',
    template = 'MODERN',
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/resumes/variants/${id}/export`, {
      params: { format, template },
    });
    return response.data;
  },
};

// ─── Storage API (Cloudinary) ─────────────────────────────────────────────────

export const storageApi = {
  uploadFile: async (
    file: File,
    folder?: string,
  ): Promise<ApiResponse<{ url: string; publicId: string; format: string; bytes: number }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const response = await apiClient.post<ApiResponse<any>>(`/storage/upload${params}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ─── Jobs API ─────────────────────────────────────────────────────────────────

export const jobsApi = {
  searchJobs: async (params?: Record<string, any>): Promise<ApiResponse<{
    jobs: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>> => {
    const response = await apiClient.get<ApiResponse<any>>('/jobs', { params });
    return response.data;
  },

  getJobById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/jobs/${id}`);
    return response.data;
  },

  getJobSnapshot: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/jobs/${id}/snapshot`);
    return response.data;
  },

  syncConnectors: async (source?: string, limit?: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/jobs/sync', null, {
      params: { source, limit },
    });
    return response.data;
  },
};

// ─── Companies API ────────────────────────────────────────────────────────────

export const companiesApi = {
  getCompanies: async (params?: Record<string, any>): Promise<ApiResponse<{
    companies: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>> => {
    const response = await apiClient.get<ApiResponse<any>>('/companies', { params });
    return response.data;
  },

  getCompanyById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/companies/${id}`);
    return response.data;
  },

  getCompanyJobs: async (id: string, page = 1, pageSize = 20): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/companies/${id}/jobs`, {
      params: { page, pageSize },
    });
    return response.data;
  },
};



