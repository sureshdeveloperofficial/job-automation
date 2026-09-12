import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const SignUpSchema = z.object({
  email: z.string().email({ message: 'Valid email address is required' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name must be at most 50 characters' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name must be at most 50 characters' }),
});

export const SignInSchema = z.object({
  email: z.string().email({ message: 'Valid email address is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Valid email address is required' }),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
});

// ─── Candidate Profile ────────────────────────────────────────────────────────

export const UpdateCandidateProfileSchema = z.object({
  title: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  phone: z.string().max(30).optional(),
  location: z.string().max(200).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  noticePeriodDays: z.number().min(0).max(365).optional(),
  currentSalary: z.number().min(0).optional(),
  expectedSalaryMin: z.number().min(0).optional(),
  expectedSalaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().length(3).optional(),
  workModes: z
    .array(z.enum(['ONSITE', 'HYBRID', 'REMOTE']))
    .min(1)
    .optional(),
});

// ─── Role Profile ─────────────────────────────────────────────────────────────

export const CreateRoleProfileSchema = z.object({
  name: z.string().min(1).max(100),
  targetTitle: z.string().min(1).max(200),
  preferredTitles: z.array(z.string().max(200)).max(10).default([]),
  seniority: z.string().max(50).optional(),
  requiredSkills: z.array(z.string().max(100)).max(50).default([]),
  preferredSkills: z.array(z.string().max(100)).max(50).default([]),
  industries: z.array(z.string().max(100)).max(20).default([]),
  excludedRoles: z.array(z.string().max(200)).max(20).default([]),
  locations: z.array(z.string().max(200)).max(20).default([]),
  workModes: z.array(z.enum(['ONSITE', 'HYBRID', 'REMOTE'])).min(1),
  employmentTypes: z
    .array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']))
    .min(1),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().length(3).optional(),
  preferredResumeId: z.string().uuid().optional(),
});

export const UpdateRoleProfileSchema = CreateRoleProfileSchema.partial();

// ─── Job Search ───────────────────────────────────────────────────────────────

export const JobSearchSchema = z.object({
  query: z.string().max(300).optional(),
  titles: z.array(z.string().max(200)).max(10).optional(),
  location: z.string().max(200).optional(),
  radiusKm: z.number().min(0).max(500).optional(),
  workModes: z.array(z.enum(['ONSITE', 'HYBRID', 'REMOTE'])).optional(),
  employmentTypes: z
    .array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']))
    .optional(),
  freshness: z
    .enum(['LAST_24H', 'LAST_3_DAYS', 'LAST_7_DAYS', 'LAST_30_DAYS'])
    .default('LAST_7_DAYS'),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

// ─── Resume ───────────────────────────────────────────────────────────────────

export const CreateResumeSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['MASTER', 'BASE', 'ROLE', 'TAILORED']),
  roleProfileId: z.string().uuid().optional(),
});

// ─── Application ──────────────────────────────────────────────────────────────

export const CreateApplicationSchema = z.object({
  jobId: z.string().uuid(),
  roleProfileId: z.string().uuid(),
  applyMode: z.enum(['MANUAL', 'ASSISTED', 'AUTO']),
  resumeVersionId: z.string().uuid().optional(),
});

// ─── Candidate Evidence ───────────────────────────────────────────────────────

export const CreateEvidenceSchema = z.object({
  category: z.string().min(1).max(100),
  claim: z.string().min(1).max(1000),
  context: z.string().max(2000).optional(),
  source: z.enum(['RESUME', 'MANUAL', 'CERTIFICATION', 'PROJECT', 'WORK_HISTORY']),
  sourceDetail: z.string().max(500).optional(),
});

export const UpdateEvidenceSchema = CreateEvidenceSchema.partial();

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignUpDto = z.infer<typeof SignUpSchema>;
export type SignInDto = z.infer<typeof SignInSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

export type UpdateCandidateProfileDto = z.infer<typeof UpdateCandidateProfileSchema>;
export type CreateRoleProfileDto = z.infer<typeof CreateRoleProfileSchema>;
export type UpdateRoleProfileDto = z.infer<typeof UpdateRoleProfileSchema>;

export type JobSearchDto = z.infer<typeof JobSearchSchema>;
export type CreateResumeDto = z.infer<typeof CreateResumeSchema>;
export type CreateApplicationDto = z.infer<typeof CreateApplicationSchema>;
export type CreateEvidenceDto = z.infer<typeof CreateEvidenceSchema>;
export type UpdateEvidenceDto = z.infer<typeof UpdateEvidenceSchema>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
