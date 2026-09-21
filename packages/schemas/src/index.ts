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

export const CandidateExperienceItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  company: z.string().min(1, 'Company is required').max(200),
  location: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  bullets: z.array(z.string().max(1000)).default([]),
});

export const CandidateEducationItemSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(1, 'Degree is required').max(200),
  institution: z.string().min(1, 'Institution is required').max(200),
  fieldOfStudy: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  grade: z.string().max(50).optional(),
});

export const CandidateProjectItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional().or(z.literal('')),
  technologies: z.array(z.string().max(100)).default([]),
});

export const UpdateCandidateProfileSchema = z.object({
  title: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  phone: z.string().max(30).optional(),
  location: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
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
  skills: z.array(z.string().max(100)).optional(),
  experiences: z.array(CandidateExperienceItemSchema).optional(),
  education: z.array(CandidateEducationItemSchema).optional(),
  certifications: z.array(z.string().max(200)).optional(),
  projects: z.array(CandidateProjectItemSchema).optional(),
  onboardingStep: z.number().min(1).max(10).optional(),
  isOnboardingCompleted: z.boolean().optional(),
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

// ─── Job Search & Discovery ───────────────────────────────────────────────────

export const SeniorityLevelEnum = z.enum([
  'INTERN',
  'ENTRY',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'STAFF',
  'PRINCIPAL',
  'EXECUTIVE',
]);

export const JobSearchFilterSchema = z.object({
  query: z.string().max(300).optional(),
  titles: z.array(z.string().max(200)).max(10).optional(),
  location: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  radiusKm: z.coerce.number().min(0).max(500).optional(),
  workModes: z.array(z.enum(['ONSITE', 'HYBRID', 'REMOTE'])).optional(),
  employmentTypes: z
    .array(z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']))
    .optional(),
  seniorities: z.array(SeniorityLevelEnum).optional(),
  freshness: z
    .enum(['LAST_24H', 'LAST_3_DAYS', 'LAST_7_DAYS', 'LAST_30_DAYS'])
    .default('LAST_7_DAYS'),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  companyId: z.string().uuid().optional(),
  companyName: z.string().max(300).optional(),
  skills: z.array(z.string().max(100)).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['postedAt', 'salary', 'relevance']).default('postedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const JobSearchSchema = JobSearchFilterSchema;

export const CompanyFilterSchema = z.object({
  query: z.string().max(300).optional(),
  industry: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  isHiringNow: z
    .preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean())
    .optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const IngestJobSchema = z.object({
  companyName: z.string().min(1).max(300),
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  rawDescription: z.string().optional(),
  location: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default('India'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  workMode: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).default('HYBRID'),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'])
    .default('FULL_TIME'),
  seniority: SeniorityLevelEnum.default('MID'),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().length(3).default('INR'),
  salaryPeriod: z.enum(['YEARLY', 'MONTHLY', 'HOURLY']).default('YEARLY'),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  experienceMinYears: z.number().min(0).default(0),
  experienceMaxYears: z.number().min(0).optional(),
  source: z.string().default('MANUAL'),
  sourceJobId: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  applicationUrl: z.string().url().optional().or(z.literal('')),
  postedAt: z.string().datetime().optional(),
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
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const UpdateEvidenceSchema = CreateEvidenceSchema.partial();

export const VerifyEvidenceSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  verifierNotes: z.string().max(1000).optional(),
});

export const BulkVerifyEvidenceSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(['VERIFIED', 'REJECTED']),
});

export const EvidenceFilterSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

// ─── Onboarding Wizard Schemas ────────────────────────────────────────────────

export const OnboardingStep1Schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().max(30).optional(),
  location: z.string().min(1, 'Location is required').max(200),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
});

export const OnboardingStep2Schema = z.object({
  title: z.string().min(1, 'Target job title is required').max(200),
  yearsOfExperience: z.number().min(0).max(50),
  workModes: z.array(z.enum(['ONSITE', 'HYBRID', 'REMOTE'])).min(1, 'Select at least one work mode'),
  noticePeriodDays: z.number().min(0).max(365).optional(),
});

export const OnboardingStep3Schema = z.object({
  skills: z.array(z.string().min(1)).min(1, 'Add at least one technical skill'),
});

export const OnboardingStep4Schema = z.object({
  experiences: z.array(CandidateExperienceItemSchema).default([]),
});

export const OnboardingStep5Schema = z.object({
  education: z.array(CandidateEducationItemSchema).default([]),
  certifications: z.array(z.string()).default([]),
});

export const OnboardingStep6Schema = z.object({
  expectedSalaryMin: z.number().min(0).optional(),
  expectedSalaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().length(3).default('USD'),
  summary: z.string().max(2000).optional(),
});

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

export type CandidateExperienceItemDto = z.infer<typeof CandidateExperienceItemSchema>;
export type CandidateEducationItemDto = z.infer<typeof CandidateEducationItemSchema>;
export type CandidateProjectItemDto = z.infer<typeof CandidateProjectItemSchema>;
export type UpdateCandidateProfileDto = z.infer<typeof UpdateCandidateProfileSchema>;
export type CreateRoleProfileDto = z.infer<typeof CreateRoleProfileSchema>;
export type UpdateRoleProfileDto = z.infer<typeof UpdateRoleProfileSchema>;

export type JobSearchDto = z.infer<typeof JobSearchSchema>;
export type JobSearchFilterDto = z.infer<typeof JobSearchFilterSchema>;
export type CompanyFilterDto = z.infer<typeof CompanyFilterSchema>;
export type IngestJobDto = z.infer<typeof IngestJobSchema>;
export type CreateResumeDto = z.infer<typeof CreateResumeSchema>;
export type CreateApplicationDto = z.infer<typeof CreateApplicationSchema>;
export type CreateEvidenceDto = z.infer<typeof CreateEvidenceSchema>;
export type UpdateEvidenceDto = z.infer<typeof UpdateEvidenceSchema>;
export type VerifyEvidenceDto = z.infer<typeof VerifyEvidenceSchema>;
export type BulkVerifyEvidenceDto = z.infer<typeof BulkVerifyEvidenceSchema>;
export type EvidenceFilterDto = z.infer<typeof EvidenceFilterSchema>;

export type OnboardingStep1Dto = z.infer<typeof OnboardingStep1Schema>;
export type OnboardingStep2Dto = z.infer<typeof OnboardingStep2Schema>;
export type OnboardingStep3Dto = z.infer<typeof OnboardingStep3Schema>;
export type OnboardingStep4Dto = z.infer<typeof OnboardingStep4Schema>;
export type OnboardingStep5Dto = z.infer<typeof OnboardingStep5Schema>;
export type OnboardingStep6Dto = z.infer<typeof OnboardingStep6Schema>;

// ─── Phase 4: Resume Tailoring & ATS Scoring ──────────────────────────────────

export const ScoreResumeSchema = z.object({
  jobId: z.string().uuid().optional(),
  customJobDescription: z.string().min(10).max(50000).optional(),
  targetRoleTitle: z.string().max(200).optional(),
  targetCompanyName: z.string().max(200).optional(),
});

export const TailorResumeSchema = z.object({
  jobId: z.string().uuid().optional(),
  customJobDescription: z.string().min(10).max(50000).optional(),
  targetRoleTitle: z.string().max(200).optional(),
  targetCompanyName: z.string().max(200).optional(),
  selectedEvidenceIds: z.array(z.string().uuid()).optional(),
  templateStyle: z.enum(['MODERN', 'CLASSIC', 'MINIMAL']).default('MODERN'),
});

export const CreateVariantSchema = z.object({
  resumeId: z.string().uuid(),
  name: z.string().min(1).max(200),
  targetJobId: z.string().uuid().optional(),
  targetCompany: z.string().max(200).optional(),
  structuredData: z.record(z.any()),
  diffSummary: z.record(z.any()).optional(),
  evidenceBindings: z.array(z.string().uuid()).default([]),
});

export type ScoreResumeDto = z.infer<typeof ScoreResumeSchema>;
export type TailorResumeDto = z.infer<typeof TailorResumeSchema>;
export type CreateVariantDto = z.infer<typeof CreateVariantSchema>;
