import {
  UserRole,
  WorkMode,
  EmploymentType,
  SeniorityLevel,
  SkillGapLevel,
  SkillGapPriority,
  ApplicationState,
  ApplyMode,
  ResumeType,
  EvidenceStatus,
  EvidenceSource,
  AIProvider,
  ConnectorCapability,
  JobFreshness,
  ApplicationEventType,
  NotificationType,
  InterviewType,
  ResumeTemplateStyle,
} from './enums.js';

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
  slug?: string;
  domain?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  employeeCount?: string;
  isHiringNow?: boolean;
  activeJobsCount?: number;
  careersUrl?: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyFilter {
  query?: string;
  industry?: string;
  location?: string;
  isHiringNow?: boolean;
  page?: number;
  pageSize?: number;
}

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface SalaryInfo {
  min?: number;
  max?: number;
  currency?: string;
  period?: 'YEARLY' | 'MONTHLY' | 'HOURLY';
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  normalizedTitle: string;
  description: string;
  rawDescription?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  seniority?: SeniorityLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  responsibilities?: string[];
  experienceMinYears?: number;
  experienceMaxYears?: number;
  postedAt?: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  source: string;
  sourceJobId?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  contentHash: string;
  status?: string;
  isActive: boolean;
  company?: Company;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobDetails extends Job {
  company: Company;
  snapshot?: JDSnapshot;
  matchReadiness?: {
    matchedSkills: string[];
    missingSkills: string[];
    matchScore: number;
  };
}

export interface JobSearchFilter {
  query?: string;
  titles?: string[];
  location?: string;
  city?: string;
  radiusKm?: number;
  workModes?: WorkMode[];
  employmentTypes?: EmploymentType[];
  seniorities?: SeniorityLevel[];
  freshness?: JobFreshness;
  salaryMin?: number;
  salaryMax?: number;
  companyId?: string;
  companyName?: string;
  skills?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'postedAt' | 'salary' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

// ─── JD Snapshot ─────────────────────────────────────────────────────────────

export interface JDSnapshot {
  id: string;
  jobId: string;
  rawJd: string;
  rawHtml?: string;
  cleanedText?: string;
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

// ─── Resume & AST ─────────────────────────────────────────────────────────────

export interface ResumeBulletItem {
  text: string;
  evidenceId?: string; // ID of verified CandidateEvidence claim
  metrics?: string[]; // Quantified impact (e.g., "$1.2M", "45%", "10x")
  matchedSkills?: string[];
}

export interface ResumeExperienceItem {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: ResumeBulletItem[];
}

export interface ResumeEducationItem {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface ResumeProjectItem {
  name: string;
  description?: string;
  url?: string;
  bullets?: string[];
  skills?: string[];
}

export interface ResumeAST {
  personalInfo: {
    fullName: string;
    headline?: string;
    email: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  };
  summary: string;
  skills: {
    core: string[];
    secondary?: string[];
    tools?: string[];
  };
  experiences: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  projects?: ResumeProjectItem[];
  certifications?: string[];
  evidenceBindings?: string[];
}

// ─── ATS Scorer Contracts ─────────────────────────────────────────────────────

export interface AtsCategoryScore {
  score: number; // 0 - 100
  weight: number; // e.g., 0.35
  weightedScore: number;
  details: string;
}

export interface AtsScoreBreakdown {
  overallScore: number; // 0 - 100
  requiredSkills: AtsCategoryScore & {
    matched: string[];
    missing: string[];
  };
  preferredSkills: AtsCategoryScore & {
    matched: string[];
    missing: string[];
  };
  experienceAlignment: AtsCategoryScore & {
    candidateYears: number;
    requiredYears: number;
    seniorityMatch: boolean;
  };
  quantifiableImpact: AtsCategoryScore & {
    quantifiedBulletCount: number;
    totalBulletCount: number;
    impactRatio: number;
  };
  formattingHygiene: AtsCategoryScore & {
    hasContactInfo: boolean;
    hasSummary: boolean;
    hasStandardSections: boolean;
  };
  recommendations: string[];
}

export interface AtsScoreResult {
  score: number;
  breakdown: AtsScoreBreakdown;
  assessedAt: Date;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
}

// ─── Resume Diff & Tailoring ──────────────────────────────────────────────────

export interface ResumeDiffChange {
  section: 'summary' | 'skills' | 'experience' | 'projects' | 'education';
  type: 'ADDED' | 'MODIFIED' | 'REORDERED' | 'UNCHANGED';
  description: string;
  details?: Record<string, unknown>;
}

export interface ResumeDiff {
  addedSkills: string[];
  reorderedBulletsCount: number;
  evidenceClaimsLinked: number;
  summaryChanged: boolean;
  atsScoreDelta: number;
  changes: ResumeDiffChange[];
}

export interface TailorResumeInput {
  baseResumeId: string;
  jobId?: string;
  customJobDescription?: string;
  targetRoleTitle?: string;
  targetCompanyName?: string;
  selectedEvidenceIds?: string[];
  templateStyle?: ResumeTemplateStyle;
}

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
  structuredData?: ResumeAST;
  targetJobId?: string;
  targetCompany?: string;
  atsBreakdown?: AtsScoreBreakdown;
  diffSummary?: ResumeDiff;
  evidenceBindings?: string[];
  isActive: boolean;
  isFrozen: boolean;
  createdAt: Date;
}

export interface ResumeVariant {
  id: string;
  resumeId: string;
  version: number;
  name: string;
  type: ResumeType;
  targetJobId?: string;
  targetJobTitle?: string;
  targetCompany?: string;
  atsScore?: number;
  atsBreakdown?: AtsScoreBreakdown;
  structuredData?: ResumeAST;
  diffSummary?: ResumeDiff;
  evidenceBindings: string[];
  fileKey?: string;
  createdAt: Date;
  updatedAt?: Date;
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
