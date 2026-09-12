'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, usersApi } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function initUser() {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          if (isMounted) setIsLoading(false);
          return;
        }
        const response = await usersApi.me();
        if (isMounted) setUser(response.data as AuthUser);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void initUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authApi.signIn({ email, password });
    const { user: authUser, tokens } = response.data;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setUser(authUser);
  };

  const signUp = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await authApi.signUp(data);
    const { user: authUser, tokens } = response.data;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setUser(authUser);
  };

  const signOut = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await authApi.signOut(refreshToken).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
