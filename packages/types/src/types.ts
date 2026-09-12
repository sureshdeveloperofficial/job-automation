import {
  UserRole,
  WorkMode,
  EmploymentType,
  SkillGapLevel,
  SkillGapPriority,
  ApplicationState,
  ApplyMode,
  ResumeType,
  EvidenceStatus,
  EvidenceSource,
  AIProvider,
  ConnectorCapability,
  ApplicationEventType,
  NotificationType,
  InterviewType,
} from './enums';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Candidate Profile ────────────────────────────────────────────────────────

export interface CandidateExperienceItem {
  id?: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  bullets?: string[];
}

export interface CandidateEducationItem {
  id?: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
}

export interface CandidateProjectItem {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  technologies?: string[];
}

export interface CandidateProfile {
  id: string;
  userId: string;
  title?: string;
  summary?: string;
  phone?: string;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  noticePeriodDays?: number;
  currentSalary?: number;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
  workModes: WorkMode[];
  profileHealthScore: number;
  skills: string[];
  experiences?: CandidateExperienceItem[];
  education?: CandidateEducationItem[];
  certifications?: string[];
  projects?: CandidateProjectItem[];
  onboardingStep: number;
  isOnboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Candidate Evidence ───────────────────────────────────────────────────────

export interface CandidateEvidence {
  id: string;
  userId: string;
  profileId: string;
  category: string;
  claim: string;
  context?: string;
  source: EvidenceSource;
  sourceDetail?: string;
  status: EvidenceStatus;
  confidenceScore?: number;
  verifierNotes?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileHealthScore {
  score: number;
  breakdown: {
    personalInfo: number;
    experience: number;
    skills: number;
    education: number;
    evidence: number;
  };
  recommendations: string[];
  completedItems: string[];
  pendingItems: string[];
}

export interface ParsedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    summary?: string;
  };
  skills: string[];
  experiences: CandidateExperienceItem[];
  education: CandidateEducationItem[];
  projects: CandidateProjectItem[];
  certifications: string[];
  suggestedEvidence: Array<{
    category: string;
    claim: string;
    context?: string;
    sourceDetail?: string;
    confidenceScore?: number;
  }>;
  rawText?: string;
}


// ─── Role Profile ─────────────────────────────────────────────────────────────

export interface RoleProfile {
  id: string;
  userId: string;
  name: string;
  targetTitle: string;
  preferredTitles: string[];
  seniority?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  industries: string[];
  excludedRoles: string[];
  locations: string[];
  workModes: WorkMode[];
  employmentTypes: EmploymentType[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  preferredResumeId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  normalizedName: string;
  industry?: string;
  size?: string;
  careersUrl?: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  companyId: string;
  title: string;
  normalizedTitle: string;
  description: string;
  location?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  postedAt?: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  source: string;
  sourceJobId?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  contentHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── JD Snapshot ─────────────────────────────────────────────────────────────

export interface JDSnapshot {
  id: string;
  jobId: string;
  rawJd: string;
  normalizedJd?: string;
  contentHash: string;
  capturedAt: Date;
  source: string;
  sourceJobId?: string;
  sourceUrl?: string;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export interface JobMatch {
  id: string;
  userId: string;
  jobId: string;
  roleProfileId: string;
  overallScore: number;
  candidateMatchScore: number;
  freshnessScore: number;
  locationScore: number;
  companyRelevanceScore: number;
  readinessScore: number;
  matchDetails: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Skill Gap ────────────────────────────────────────────────────────────────

export interface SkillGap {
  id: string;
  matchId: string;
  skill: string;
  normalizedSkill: string;
  level: SkillGapLevel;
  priority: SkillGapPriority;
  evidenceIds: string[];
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export interface Resume {
  id: string;
  userId: string;
  name: string;
  type: ResumeType;
  roleProfileId?: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeVersion {
  id: string;
  resumeId: string;
  version: number;
  fileKey: string;
  fileUrl?: string;
  mimeType: string;
  fileSizeBytes: number;
  atsScore?: number;
  recruiterScore?: number;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: Date;
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  roleProfileId: string;
  jdSnapshotId: string;
  resumeVersionId?: string;
  state: ApplicationState;
  applyMode: ApplyMode;
  connectorId?: string;
  traceId: string;
  appliedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  type: ApplicationEventType;
  stage?: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  timestamp: Date;
  connector?: string;
  traceId: string;
  metadata?: Record<string, unknown>;
}

// ─── Connectors ───────────────────────────────────────────────────────────────

export interface JobConnector {
  id: string;
  name: string;
  type: string;
  capabilities: ConnectorCapability[];
  isEnabled: boolean;
  config?: Record<string, unknown>;
}

export interface JobSearchInput {
  query?: string;
  titles?: string[];
  location?: string;
  radiusKm?: number;
  workModes?: WorkMode[];
  employmentTypes?: EmploymentType[];
  freshness?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  pageSize?: number;
}

export interface JobSearchResult {
  jobs: Partial<Job>[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ─── Interview ────────────────────────────────────────────────────────────────

export interface InterviewPlan {
  id: string;
  applicationId: string;
  userId: string;
  scheduledAt?: Date;
  type: InterviewType;
  topics: string[];
  technicalQuestions: InterviewQuestion[];
  behavioralQuestions: InterviewQuestion[];
  systemDesignTopics: string[];
  codingTopics: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  suggestedAnswer?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  traceId?: string;
}
