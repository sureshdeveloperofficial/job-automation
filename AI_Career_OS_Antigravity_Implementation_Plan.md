# AI Career OS — Complete Antigravity AI Implementation Plan

## 1. Purpose

This document is the master implementation specification for building **AI Career OS**, an end-to-end job discovery, job matching, resume optimization, application preparation, supported/permitted application automation, application tracking, interview preparation, and career intelligence platform.

### Core product principle

> Find the right jobs for the right candidate, prepare the strongest evidence-backed application, apply through supported/permitted workflows, track outcomes, and learn from the results.

The product is **not** only a job board and **not** only an auto-apply bot.

---

# 2. Product Vision

The platform should connect the complete candidate journey:

```text
Candidate Profile
      ↓
Verified Candidate Evidence
      ↓
Role Profiles
      ↓
Location Preferences
      ↓
Companies Hiring Now
      ↓
Recent Job Discovery
      ↓
Job Normalization + Deduplication
      ↓
JD Analysis
      ↓
Best Jobs for Me
      ↓
Match + Skill Gap
      ↓
Resume Tailoring
      ↓
ATS Validation
      ↓
Recruiter Review
      ↓
Fact Verification
      ↓
Application Package
      ↓
Manual / Assisted / Supported Auto Apply
      ↓
Application Tracking
      ↓
Interview Preparation
      ↓
Outcome Intelligence
      ↓
Better Future Job Recommendations
```

---

# 3. Important Product Rules

1. Do not promise a job, interview, offer, recruiter response, or universal ATS success.
2. Scores must be transparent and explainable.
3. Candidate claims must be evidence-backed.
4. Never fabricate experience, skills, employers, education, certifications, salary information, or application answers.
5. AI is optional; core workflows must work without an LLM.
6. Deterministic application code is the source of truth for workflow state, validation, permissions, scoring, and submission.
7. Use official/public/permitted sources and supported ATS/application workflows.
8. Never bypass CAPTCHA, login restrictions, anti-bot controls, access controls, rate limits, or platform protections.
9. If an unsupported or protected application step appears, transition to `USER_ACTION_REQUIRED`.
10. Never submit duplicate applications.

---

# 4. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- Radix UI
- React Hook Form
- Zod
- TanStack Query
- Recharts or ECharts
- Lucide icons

## Backend

- Node.js
- NestJS
- TypeScript
- REST API
- OpenAPI/Swagger
- WebSocket/Socket.IO where realtime progress is required

## Database

- PostgreSQL
- Prisma ORM
- pgvector

## Cache and Queues

- Redis
- BullMQ

## File Storage

- Amazon S3 or S3-compatible storage

## Documents

- PDF parsing
- DOCX parsing
- DOCX generation
- PDF generation
- text extraction

## Browser Automation

- Playwright

Playwright is for supported/permitted workflows only.

## AI

Provider abstraction:

- `NoAIProvider`
- `OllamaProvider`
- `GeminiProvider`
- `OpenAIProvider`

## Testing

- Jest
- Supertest
- Playwright E2E
- k6

## DevOps

- Docker
- Docker Compose
- GitHub Actions
- AWS
- Terraform

## AWS

Recommended production infrastructure:

- ECS/Fargate or EKS
- RDS/Aurora PostgreSQL
- ElastiCache Redis
- S3
- CloudFront
- AWS WAF
- ALB
- Route 53
- ECR
- Secrets Manager

## Observability

- OpenTelemetry
- Prometheus
- Grafana
- Sentry
- Pino structured logging

---

# 5. Architecture Strategy

Start with a:

## Modular Monolith + Background Workers

Do not immediately create many microservices.

```text
                    Next.js
                       |
                REST / WebSocket
                       |
                    NestJS
                       |
       +---------------+---------------+
       |               |               |
 PostgreSQL           Redis            S3
 + pgvector          BullMQ         Documents
       |               |
       |          Background Workers
       |               |
       +---------------+
                       |
                AI Provider Layer
                       |
       OpenAI / Gemini / Ollama / NoAI
```

Keep module boundaries clean so high-load components can later be extracted.

---

# 6. Monorepo Structure

```text
job-automation/
│
├── apps/
│   ├── web/                         # Next.js
│   ├── api/                         # NestJS
│   └── workers/
│       ├── job-discovery/
│       ├── jd-analysis/
│       ├── matching/
│       ├── resume/
│       ├── application/
│       ├── interview/
│       ├── notifications/
│       └── analytics/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── schemas/
│   ├── config/
│   ├── connector-sdk/
│   ├── no-ai-engine/
│   ├── resume-engine/
│   ├── ats-engine/
│   └── shared/
│
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   └── aws/
│
├── monitoring/
├── docs/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

---

# 7. Frontend Requirements

The frontend must be:

- production quality
- responsive
- accessible
- desktop-first
- mobile responsive
- component-driven
- API-connected
- typed
- fast
- consistent

Use the supplied UI reference screens as visual direction.

Do not implement screenshots as static images.

Every screen must use real components and real state.

---

# 8. Required UI Screens

## 8.1 Landing Page

Include:

- hero
- product explanation
- Find Right Jobs
- Companies Hiring Now
- Resume Optimization
- ATS Validation
- Application Automation
- Interview Preparation
- Career Intelligence
- pricing
- FAQ
- footer

Primary CTA:

`Find My Best Jobs`

Secondary CTA:

`See How It Works`

---

## 8.2 Authentication

Create:

- Sign In
- Sign Up
- Forgot Password
- Reset Password
- Email verification
- OAuth login
- Session management

---

# 9. Onboarding

Multi-step onboarding:

```text
1. Personal Information
2. Career Profile
3. Skills
4. Experience
5. Education
6. Job Preferences
7. Location Preferences
8. Resume Upload
9. Verify
10. Complete
```

Show progress.

---

# 10. Candidate Profile

Create sections:

- Personal
- Professional
- Skills
- Experience
- Education
- Projects
- Certifications
- Preferences
- Location
- Work mode
- Salary
- Notice period

Allow editing and verification.

---

# 11. Candidate Evidence Engine

This is a major product differentiator.

Store evidence for:

- skills
- projects
- responsibilities
- achievements
- technologies
- experience
- certifications
- education

Example:

```text
Skill: Redis

Evidence:
Enterprise Machinery Platform

Description:
Used Redis for token/session state and queue coordination.

Source:
Resume

Status:
Verified
```

Generated claims must reference evidence IDs.

---

# 12. Role Profiles

Allow independent profiles:

- Backend Engineer
- Full Stack Engineer
- Frontend Engineer
- DevOps Engineer
- Software Engineer

Each role contains:

- target title
- preferred titles
- required skills
- preferred skills
- seniority
- salary
- locations
- work mode
- industries
- excluded roles
- preferred resume
- application strategy

---

# 13. Resume Library

Support:

- Master Resume
- Base Resume
- Role Resume
- Tailored Resume
- Resume Versions
- Resume History
- Resume Comparison
- Resume Preview
- Resume Download
- Archive

Resume versions used in applications must be immutable.

---

# 14. Resume Parser

Extract:

- name
- email
- phone
- location
- title
- summary
- experience
- companies
- dates
- skills
- projects
- education
- certifications

Detect resume sections.

Create candidate evidence where possible.

Ambiguous information must be verified.

---

# 15. Location Intelligence

Location must be a first-class search input.

Support:

- country
- state
- city
- area
- radius
- remote
- hybrid
- multiple locations

Example:

```text
Location: Coimbatore
Radius: 50 km
Work Mode: On-site + Hybrid
Role: Backend Engineer
Freshness: Last 7 days
```

Do not depend on precise GPS unless explicitly enabled by the user.

Allow manual location entry.

---

# 16. Companies Hiring Now

Create:

## Companies Hiring Now

Company card:

```text
Company
Location
Recent Jobs
Latest Posting
Matching Jobs
Top Match
Careers URL
```

Example:

```text
Company A
Coimbatore

12 relevant jobs
Latest posting: 1 day ago

Backend Engineer        96%
Full Stack Engineer      91%
Software Engineer        87%

[View Company]
```

Clicking a company opens:

```text
Company Profile
↓
Recent Jobs
↓
Matching Jobs
↓
Job Details
↓
Apply
```

---

# 17. Job Discovery Engine

Use connector-based discovery.

Sources may include:

- official APIs
- public job feeds
- company career pages
- supported ATS platforms
- user-provided sources
- permitted aggregators

Do not build around bypassing protected job portals.

Interface:

```typescript
interface JobConnector {
  searchJobs(input: JobSearchInput): Promise<JobSearchResult>;
  getJobDetails(id: string): Promise<JobDetails>;
}
```

---

# 18. ATS / Company Connectors

Create:

```text
CompanyDiscoveryConnector
JobDiscoveryConnector
ATSConnector
ApplicationConnector
CompanyCareerPageConnector
LocationProvider
ConnectorManager
ConnectorCapabilityRegistry
```

Application interface:

```typescript
interface ApplicationConnector {
  prepareApplication(input: ApplicationInput): Promise<ApplicationPreparation>;
  fillApplication(input: ApplicationFillInput): Promise<ApplicationFillResult>;
  submitApplication(input: ApplicationSubmitInput): Promise<ApplicationSubmitResult>;
  getApplicationStatus(input: ApplicationStatusInput): Promise<ApplicationStatus>;
}
```

Capability flags:

```text
COMPANY_SEARCH
JOB_SEARCH
JOB_DETAILS
JD_CAPTURE
APPLICATION_PREPARATION
APPLICATION_FILL
APPLICATION_SUBMISSION
STATUS_TRACKING
```

Initial connector architecture should support:

- Greenhouse
- Lever
- Workday
- additional supported ATS
- supported custom workflows

Only mark a connector as supported when actually implemented and tested.

---

# 19. Recent Job Discovery

Allow:

- last 24 hours
- last 3 days
- last 7 days
- last 30 days

Store:

- posted_at
- first_seen_at
- last_seen_at
- source
- source_job_id
- content_hash

Sort by:

- newest
- best match
- company relevance
- salary
- location

---

# 20. Job Normalization

Normalize all sources:

```typescript
Job {
  id
  companyId
  title
  normalizedTitle
  description
  location
  workMode
  employmentType
  salary
  postedAt
  source
  sourceJobId
  sourceUrl
  applicationUrl
  status
}
```

---

# 21. Job Deduplication

Use:

- source_job_id
- company
- title
- location
- normalized description
- content hash

Do not display duplicates.

---

# 22. Immutable JD Snapshot

For every job used in matching/application store:

```text
raw_jd
normalized_jd
content_hash
captured_at
source
source_job_id
source_url
```

Historical applications must retain the exact JD snapshot used.

---

# 23. JD Analysis Engine

Extract:

- role
- seniority
- required skills
- preferred skills
- responsibilities
- experience
- education
- certifications
- location
- work mode
- salary
- employment type
- keywords

Output structured JSON.

Validate output with schemas.

---

# 24. Best Jobs for Me

Create:

## Best Jobs for Me

Initial ranking:

```text
Candidate Match              45%
Job Freshness                20%
Location / Work Mode         15%
Company Relevance            10%
Application Readiness        10%
```

Candidate match can initially use:

```text
Required Skills       40%
Experience             25%
Title / Role           15%
Location / Work Mode   10%
Other Requirements     10%
```

Make weights configurable.

Example:

```text
Backend Engineer
96% Match

Required Skills      38/40
Experience            24/25
Role Alignment        15/15
Location              10/10
Other                  9/10
```

Show:

- why recommended
- strong matches
- partial matches
- missing skills
- evidence
- risks

---

# 25. Skill Gap Engine

Classify:

```text
STRONG
PARTIAL
MISSING
```

Priorities:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Never encourage false claims.

---

# 26. Job Readiness Score

Use:

- Technical Match
- Resume Quality
- Evidence Coverage
- ATS Compatibility
- Interview Readiness

Example:

```text
Job Readiness: 91/100
```

This is not a hiring guarantee.

---

# 27. Application Confidence

Use:

- JD match
- required skills
- experience
- resume match
- evidence integrity
- ATS score
- application completeness

Default:

```text
94+       Ready
85–93     User Review
<85       Don't Apply
```

Allow configurable thresholds.

---

# 28. Resume Tailoring

Input:

```text
JD
+
Role Profile
+
Candidate Evidence
+
Base Resume
```

Output:

```text
Tailored Resume
```

Support:

- deterministic/no-AI
- AI-assisted generation

Every generated bullet must reference evidence.

---

# 29. ATS Engine

Validate:

- text extraction
- contact information
- section detection
- keywords
- skills
- title
- experience
- dates
- formatting
- single-column safety
- tables
- images
- headers
- footers
- encoding
- unusual characters

Return an ATS compatibility score.

Do not claim universal ATS compatibility.

---

# 30. Recruiter Quality Engine

Assess:

- relevance
- clarity
- impact
- technical depth
- credibility
- career progression
- scanability
- first-page impact

Keep recruiter score separate from ATS score.

---

# 31. Fact Verification

For each generated claim:

```text
Generated Claim
      ↓
Candidate Evidence
      ↓
Verified?
```

If not verified:

```text
BLOCK
```

or:

```text
USER CONFIRMATION REQUIRED
```

Never fabricate.

---

# 32. Validation Loop

Implement:

```text
Generate
↓
ATS Validate
↓
Recruiter Review
↓
Fact Check
↓
Repair
↓
Revalidate
```

Use a configurable maximum iteration count.

---

# 33. Resume A/B Testing

Track:

- applications
- responses
- interviews
- offers

Compare resume versions.

Do not declare statistical winners with insufficient data.

---

# 34. Application Package

Freeze:

- exact JD snapshot
- role profile snapshot
- candidate profile snapshot
- resume version
- cover letter
- application answers
- match analysis
- ATS analysis
- recruiter review
- fact verification
- connector
- timestamp
- trace ID

Application package becomes immutable after submission.

---

# 35. Apply Modes

## Manual Apply

System prepares:

- resume
- cover letter
- answers
- checklist

Then opens official application page.

User submits.

## Assisted Apply

System:

- opens supported form
- maps fields
- fills permitted fields
- uploads approved resume
- prepares answers
- pauses for review
- user submits

## Auto Apply

Only when:

- supported
- permitted
- required information validated
- user configuration allows it
- no CAPTCHA/access restriction exists

---

# 36. Auto Apply UI — Screen 1

## Select Job / Apply Mode

Show:

```text
Backend Engineer
95% Match

[Manual Apply]
[Assisted Apply]
[Auto Apply]
```

Also show:

- company
- location
- posting age
- job description
- match score

---

# 37. Auto Apply UI — Screen 2

## Auto Apply Setup

Show:

```text
Apply for Backend Engineer

1 Setup
2 Analyze
3 Map Fields
4 Review
5 Submit

Resume to Use
Tailored Backend Engineer.pdf

Application Mode
Auto Apply

Additional Information
☑ Use saved answers
☑ Allow generated answers
☑ Notify before final submission

[Next]
```

---

# 38. Auto Apply UI — Screen 3

## Form Analysis & Field Mapping

Show:

```text
Detected ATS
Supported

Form structure analyzed
18 fields identified

Full Name → Candidate Name
Email → Candidate Email
Phone → Candidate Phone
Location → Candidate Location
Current Title → Candidate Title
Experience → Candidate Experience
Resume → Approved Resume
```

Show confidence and validation status.

---

# 39. Auto Apply UI — Screen 4

## Review Application Data

Show tabs:

- Form Preview
- Resume & Cover Letter
- Additional Documents
- Answers

Show every mapped field.

Require configured confirmation before final submission.

---

# 40. Auto Apply UI — Screen 5

## Auto Apply Progress

Realtime stepper:

```text
✓ Setup
✓ Analyze
✓ Map Fields
✓ Review
● Submit

Opening application page        Completed
Filling personal information    Completed
Uploading resume                Completed
Filling questions               In Progress
Submitting application          Pending
Confirmation                    Pending
```

Use WebSocket or polling.

---

# 41. Auto Apply UI — Screen 6

## Success

Show:

```text
Application Submitted Successfully!

Company
Position
Application Date
Application ID
Status

[View Application]
[Track Status]
```

Save confirmation.

---

# 42. Auto Apply UI — Screen 7

## Fallback / User Action Required

If CAPTCHA, login, unsupported workflow, access control, or another blocked condition occurs:

```text
We couldn't complete automatic submission.

Reason:
CAPTCHA / Additional Verification Detected

Next Steps:

1. Open company application
2. Complete verification
3. Review remaining information
4. Submit manually

[Open Company Page]
[Copy Job Link]
```

Never bypass the protection.

---

# 43. Application Tracking UI

Create:

## My Applications

Tabs:

```text
All
Applied
Under Review
Interview
Offer
Rejected
```

Columns:

```text
Company
Position
Applied Date
Status
Mode
Resume
Actions
```

Modes:

```text
Manual
Assisted
Auto
```

---

# 44. Application State Machine

Implement:

```text
DISCOVERED
↓
ANALYZING
↓
MATCHED
↓
QUALIFIED
↓
RESUME_GENERATING
↓
RESUME_READY
↓
ATS_VALIDATING
↓
APPLICATION_READY
↓
AWAITING_USER
↓
APPLICATION_STARTED
↓
FORM_MAPPING
↓
FORM_FILLING
↓
QUESTIONS_COMPLETED
↓
SUBMITTING
↓
SUBMITTED
↓
TRACKING
```

Exception states:

```text
CAPTCHA_REQUIRED
LOGIN_REQUIRED
USER_ACTION_REQUIRED
JOB_CLOSED
DUPLICATE_APPLICATION
VALIDATION_ERROR
APPLICATION_ERROR
PLATFORM_ERROR
NETWORK_ERROR
```

All transitions must be validated.

---

# 45. Application Agent

Create:

```text
ApplicationAgent
```

Responsibilities:

- load application package
- determine connector
- validate connector capabilities
- start application
- map fields
- fill permitted fields
- upload approved resume
- prepare answers
- request review
- submit
- capture confirmation
- update state
- write audit events
- classify errors
- retry transient failures

Use idempotency.

Never submit twice.

---

# 46. Application Form Mapping

Data:

```text
application_field
source
candidate_value
evidence
confidence
validation_status
```

Unknown or ambiguous fields become:

```text
USER_ACTION_REQUIRED
```

---

# 47. Application Questions

Support:

- text
- select
- multi-select
- yes/no
- salary
- notice period
- work authorization
- sponsorship
- location
- experience

Generated answers:

```text
Question
↓
Candidate Evidence
↓
Generate
↓
Fact Check
↓
Approval if required
```

---

# 48. Company Intelligence

Company page may show:

- company
- industry
- size if reliable
- location
- careers URL
- relevant openings
- technology signals
- job frequency
- candidate outcomes

Do not invent data.

---

# 49. Interview Intelligence

Generate:

- company context
- JD summary
- technical topics
- coding topics
- system design
- project questions
- behavioral questions
- follow-up questions

Practice:

```text
Question
↓
Candidate Answer
↓
Evaluation
↓
Feedback
↓
Improved Answer
```

---

# 50. Interview UI

Create:

## Upcoming Interviews

Show:

- company
- role
- date
- interview type
- preparation status

## Interview Preparation

Tabs:

```text
Overview
Technical
Coding
System Design
Projects
Behavioral
Practice
Feedback
```

---

# 51. Career Intelligence

Analyze outcomes:

```text
Applications
↓
Responses
↓
Interviews
↓
Offers
```

Identify:

- strongest roles
- strongest technologies
- strongest locations
- strongest companies
- best resume
- best sources
- response rate
- interview rate
- offer rate

Only draw conclusions from sufficient data.

---

# 52. Dashboard

Show:

```text
Jobs Found
Relevant Jobs
Qualified Jobs
Applications
Responses
Interviews
Offers
```

Charts:

- applications over time
- response rate
- interview rate
- offer rate
- jobs by location
- jobs by company
- jobs by role
- resume performance
- source performance

---

# 53. Profile Health

Display:

```text
Profile Health
85%

Skills
Experience
Resume
Evidence
Preferences
Interview Readiness
```

Provide improvement actions.

---

# 54. Admin Dashboard

Create:

- users
- companies
- jobs
- connectors
- discovery runs
- application runs
- errors
- queues
- system health
- AI usage
- source coverage
- audit logs

---

# 55. Database Schema

Create PostgreSQL models:

```text
users
user_preferences

candidate_profiles
candidate_facts
candidate_evidence

role_profiles

resumes
resume_versions
resume_artifacts

companies
company_locations
company_job_sources

jobs
jd_snapshots
job_requirements
skill_taxonomy
skill_aliases

job_search_profiles
job_discovery_runs
job_freshness_signals

matches
skill_gaps

application_packages
applications
application_answers
application_events
application_errors
application_retries
application_attempts

application_connectors
application_form_mappings

interview_plans
interview_sessions

analytics_events
notifications
audit_logs
```

Use:

- foreign keys
- indexes
- unique constraints
- timestamps
- soft deletion where appropriate

---

# 56. Key Relationships

```text
User
 ├── CandidateProfile
 ├── RoleProfiles
 ├── Resumes
 ├── JobSearchProfiles
 └── Applications

RoleProfile
 ├── PreferredResume
 └── Matches

Company
 ├── CompanyLocations
 ├── CompanyJobSources
 └── Jobs

Job
 ├── Company
 ├── JDSnapshots
 ├── Requirements
 ├── Matches
 └── Applications

Application
 ├── RoleProfile
 ├── Job
 ├── JDSnapshot
 ├── ResumeVersion
 ├── ApplicationPackage
 ├── Answers
 ├── Events
 ├── Errors
 ├── Attempts
 └── InterviewPlan
```

---

# 57. NestJS Backend Modules

Create:

```text
Auth
Users
Candidate
CandidateEvidence
Roles
Resumes
Companies
Location
Jobs
JobDiscovery
JobNormalization
JDAnalysis
Matching
BestJobs
SkillGap
JobReadiness
ATS
RecruiterReview
FactVerification
ApplicationPackages
Applications
ApplicationQuestions
ApplicationAgent
Connectors
Interview
CareerIntelligence
Analytics
Notifications
Audit
Admin
AI
Common
```

---

# 58. API Design

Example APIs:

```text
POST /auth/signup
POST /auth/login
POST /auth/refresh

GET /candidate/profile
PUT /candidate/profile

GET /roles
POST /roles
PUT /roles/:id
DELETE /roles/:id

GET /resumes
POST /resumes
GET /resumes/:id
POST /resumes/:id/tailor

GET /companies
GET /companies/:id
GET /companies/:id/jobs

POST /job-search/search
GET /jobs
GET /jobs/:id

GET /jobs/:id/match
GET /jobs/:id/skill-gap

POST /jobs/:id/application/prepare

POST /applications
GET /applications
GET /applications/:id

POST /applications/:id/start
POST /applications/:id/review
POST /applications/:id/submit

GET /applications/:id/events
GET /applications/:id/status

GET /interviews
GET /interviews/:id
POST /interviews/:id/practice

GET /analytics/dashboard
GET /analytics/resumes
GET /analytics/roles

GET /admin/health
GET /admin/connectors
GET /admin/jobs
```

Document with OpenAPI.

---

# 59. BullMQ Queues

Create:

```text
job-discovery
company-discovery
job-normalization
job-deduplication
jd-capture
jd-analysis
job-matching
best-job-ranking
skill-gap
resume-generation
resume-validation
ats-validation
fact-verification
application-preparation
application-form-mapping
application-submission
application-status
interview
notifications
analytics
```

Implement:

- retries
- backoff
- timeouts
- dead-letter handling
- idempotency

Do not retry:

- CAPTCHA
- invalid user data
- duplicate application
- closed job
- authorization failure

---

# 60. Events

Create:

```text
JOB_DISCOVERED
JD_CAPTURED
JD_ANALYZED
ROLE_MATCHED
MATCH_SCORE_CALCULATED
RESUME_GENERATION_STARTED
RESUME_GENERATED
ATS_VALIDATION_COMPLETED
FACT_CHECK_COMPLETED
APPLICATION_READY
APPLICATION_STARTED
FORM_FIELDS_MAPPED
SUBMISSION_STARTED
APPLICATION_SUBMITTED
APPLICATION_FAILED
INTERVIEW_SCHEDULED
APPLICATION_REJECTED
OFFER_RECEIVED
```

Every event:

```text
event_id
application_id
type
stage
severity
timestamp
connector
trace_id
metadata
```

---

# 61. Error Tracking

Tables:

```text
application_errors
application_retries
```

Fields:

```text
error_code
message
retryable
attempt
connector
trace_id
timestamp
metadata
```

Never store secrets.

---

# 62. AI Provider Architecture

Create:

```typescript
interface LLMProvider {
  analyzeJobDescription(input): Promise<JobAnalysis>;
  analyzeResume(input): Promise<ResumeAnalysis>;
  generateResume(input): Promise<ResumeDraft>;
  generateCoverLetter(input): Promise<CoverLetter>;
  generateApplicationAnswers(input): Promise<ApplicationAnswers>;
  generateInterviewPlan(input): Promise<InterviewPlan>;
  evaluateInterviewAnswer(input): Promise<InterviewEvaluation>;
}
```

Providers:

```text
NoAIProvider
OllamaProvider
GeminiProvider
OpenAIProvider
```

Default:

```text
AI_PROVIDER=none
```

AI outputs must pass Zod/JSON Schema validation.

AI must not directly control application submission.

---

# 63. No-AI Mode

Core functionality must work without an LLM.

Implement:

- text extraction
- section detection
- keyword matching
- skill normalization
- skill taxonomy
- experience matching
- title matching
- location filtering
- work mode filtering
- rule-based JD extraction
- weighted matching
- deterministic resume assembly
- ATS validation
- application tracking
- analytics

---

# 64. Skill Taxonomy

Create:

```text
skill_taxonomy
skill_aliases
```

Examples:

```text
Node
NodeJS
Node.js
→ Node.js

Postgres
PostgreSQL
→ PostgreSQL
```

Do not map unrelated technologies.

---

# 65. Security

Implement:

- HTTPS/TLS
- JWT/OIDC
- secure refresh token handling
- RBAC
- NestJS guards
- Helmet
- CORS
- CSRF where applicable
- rate limiting
- input validation
- file validation
- upload limits
- malware scanning
- encryption at rest
- secrets management
- audit logging
- PII minimization

Never log:

- passwords
- tokens
- API keys
- sensitive answers

---

# 66. File Security

Validate:

- MIME
- extension
- content signature
- file size

Scan uploads.

Store originals in S3.

Store metadata in PostgreSQL.

Use signed URLs where appropriate.

---

# 67. Reliability

Implement:

- idempotency keys
- unique constraints
- Redis distributed locks
- exponential backoff
- jitter
- dead-letter queues
- circuit breakers
- timeouts
- transactions
- trace IDs
- correlation IDs

---

# 68. Observability

Use:

```text
OpenTelemetry
↓
Traces
Metrics
Logs
```

Add:

- Prometheus
- Grafana
- Sentry
- Pino

Track:

- API latency
- queue latency
- connector failures
- application failures
- AI latency
- AI usage/cost
- database performance
- worker health

---

# 69. Notifications

Support:

- in-app
- email
- optional web push

Notify on:

- new high-match jobs
- application ready
- user action required
- application submitted
- application error
- interview scheduled
- status changes
- offer received

---

# 70. Product Search

Search:

- jobs
- companies
- skills
- roles

Filters:

```text
Location
Radius
Role
Experience
Salary
Work Mode
Employment Type
Posted Date
Match Score
Company
Skills
Application Mode
```

---

# 71. Required UI Components

Create:

```text
DashboardCard
MetricCard
JobCard
CompanyCard
MatchScore
SkillBadge
SkillGapCard
ResumeCard
ApplicationStatusBadge
ApplicationTimeline
ProgressStepper
FormField
EvidenceCard
ATSScoreCard
RecruiterScoreCard
JobFilterBar
LocationSelector
CompanyList
JobList
JobDetail
ApplyModeSelector
ApplicationReview
ApplicationProgress
InterviewCard
AnalyticsChart
EmptyState
ErrorState
LoadingSkeleton
ConfirmationModal
```

---

# 72. Required User Routes

```text
/
 /login
 /signup
 /onboarding

 /dashboard

 /profile
 /profile/skills
 /profile/experience
 /profile/preferences
 /profile/evidence

 /roles
 /roles/:id

 /resumes
 /resumes/:id
 /resumes/:id/versions

 /jobs
 /jobs/:id
 /jobs/best-for-me

 /companies
 /companies/:id
 /companies/:id/jobs

 /applications
 /applications/:id
 /applications/:id/prepare
 /applications/:id/review
 /applications/:id/progress

 /interviews
 /interviews/:id
 /interviews/:id/practice

 /analytics

 /settings
 /settings/account
 /settings/privacy
 /settings/notifications
 /settings/integrations
 /settings/application-preferences

 /admin
 /admin/users
 /admin/jobs
 /admin/companies
 /admin/connectors
 /admin/runs
 /admin/errors
 /admin/health
```

---

# 73. Application Preferences

Allow:

```text
Default Role
Default Location
Default Resume
Minimum Match Score
Auto Apply Enabled
Auto Apply Threshold
Require Approval
Allowed Companies
Excluded Companies
Allowed Job Types
Excluded Job Types
Maximum Applications/Day
Notification Settings
```

Default:

```text
Manual resume approval = ON
Manual application approval = ON
Auto Apply = OFF
```

---

# 74. Company Website Workflow

```text
Job
↓
Company
↓
Official Careers Page
↓
Detect ATS
↓
Supported?
  ├── YES → Prepare Application
  └── NO  → Manual Apply
```

Supported flow:

```text
Load Application
↓
Map Fields
↓
Fill Permitted Fields
↓
Upload Resume
↓
Prepare Answers
↓
Validate
↓
User Review if configured
↓
Submit
↓
Confirmation
↓
Track
```

---

# 75. Automation Safety

If encountered:

```text
CAPTCHA
LOGIN
2FA
UNSUPPORTED FORM
ACCESS DENIED
ANTI-BOT
AMBIGUOUS QUESTION
MISSING REQUIRED DATA
```

Stop and set:

```text
USER_ACTION_REQUIRED
```

Never bypass.

---

# 76. Duplicate Application Protection

Before submission check:

```text
user
company
job
source_job_id
application_url
normalized_title
```

If already applied:

```text
DUPLICATE_APPLICATION
```

Do not submit again.

---

# 77. Audit Trail

Record:

```text
Who
What
When
Why
Connector
Resume
JD
Application Package
Answers
State
Result
```

Keep the application audit trail immutable.

---

# 78. Cost Control

Do not use AI unnecessarily.

Use deterministic processing for:

- filtering
- matching
- scoring
- validation
- deduplication

Use AI for:

- semantic understanding
- generation
- interview intelligence
- nuanced analysis

Cache reusable AI outputs.

Support:

```text
AI_PROVIDER=none
AI_PROVIDER=ollama
AI_PROVIDER=gemini
AI_PROVIDER=openai
```

Do not silently switch providers against configured privacy/budget rules.

---

# 79. Local Development

Docker Compose should run:

```text
PostgreSQL
Redis
API
Web
Workers
```

Provide:

```text
.env.example
README.md
```

Environment variables:

```text
DATABASE_URL=
REDIS_URL=

S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

JWT_SECRET=

AI_PROVIDER=none
OPENAI_API_KEY=
GEMINI_API_KEY=
OLLAMA_BASE_URL=

OTEL_ENDPOINT=
SENTRY_DSN=
```

---

# 80. Seed Data

Create realistic development seed data.

Example candidate:

```text
Software Engineer
3 years

Node.js
NestJS
TypeScript
React
Next.js
PostgreSQL
Redis
BullMQ
Microservices
```

Create sample:

- companies
- jobs
- JDs
- matches
- resumes
- applications
- interviews

Clearly mark seed data as development data.

---

# 81. Testing Strategy

## Unit Tests

Test:

- matching
- scoring
- skill normalization
- ATS validation
- fact verification
- application state transitions
- duplicate detection

## Integration Tests

Test:

- APIs
- database
- Redis
- queues
- connectors

## E2E

Test:

```text
Signup
↓
Onboarding
↓
Profile
↓
Resume
↓
Job Search
↓
Match
↓
Resume Tailoring
↓
ATS
↓
Application
↓
Tracking
```

Also test:

```text
Auto Apply
↓
CAPTCHA
↓
USER_ACTION_REQUIRED
```

---

# 82. Performance

Use:

- pagination
- lazy loading
- database indexes
- caching
- background jobs
- asynchronous heavy processing

Do not perform expensive processing inside long-running API requests.

Move heavy tasks to workers:

- JD analysis
- resume generation
- ATS analysis
- job discovery
- application processing
- interview generation

---

# 83. Rate Limiting

Implement per-user and per-connector limits.

Respect source policies.

Configure connector throttling.

---

# 84. Job Discovery Scheduler

Support scheduled searches.

Example:

```text
Every morning
↓
Configured locations
↓
Configured roles
↓
Recent jobs
↓
Rank
↓
Notify high-match opportunities
```

Also allow manual searches.

---

# 85. Company Discovery Scheduler

For configured locations:

```text
Location
↓
Companies with recent hiring activity
↓
Relevant jobs
↓
Rank companies
↓
Update Companies Hiring Now
```

---

# 86. Outcome Learning

Initially use deterministic ranking.

Later use historical outcomes:

```text
Applications
↓
Responses
↓
Interviews
↓
Offers
↓
Statistical Analysis
↓
Ranking Improvement
```

Do not overfit to small samples.

---

# 87. Career Recommendation Engine

Eventually recommend:

```text
Best Role
Best Location
Best Company Type
Best Skills
Best Resume
Best Application Strategy
```

Example:

> Backend Engineer roles are producing stronger response rates than generic Full Stack roles.

Only surface such conclusions when supported by enough data.

---

# 88. Navigation

Primary sidebar:

```text
Dashboard

Jobs
  ├── Find Jobs
  ├── Best Jobs for Me
  ├── Recent Jobs
  └── Saved Jobs

Companies
  ├── Companies Hiring Now
  ├── My Companies
  └── Company Intelligence

Profile
  ├── My Profile
  ├── Skills
  ├── Experience
  └── Evidence

Roles
  ├── Role Profiles
  └── Preferences

Resumes
  ├── Resume Library
  ├── Versions
  └── Resume Builder

Applications
  ├── All Applications
  ├── Ready to Apply
  ├── In Progress
  └── Tracking

Interviews
  ├── Upcoming
  ├── Preparation
  └── Practice

Analytics
  ├── Career Analytics
  ├── Resume Performance
  └── Application Funnel

Settings
  ├── Account
  ├── Job Preferences
  ├── Application Preferences
  ├── Notifications
  ├── Privacy
  └── Integrations
```

---

# 89. Development Phases

## Phase 1 — Foundation

Build:

- monorepo
- Next.js
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Docker
- authentication
- design system

## Phase 2 — Candidate Intelligence

Build:

- profile
- resume upload
- parser
- evidence
- role profiles
- resume library

## Phase 3 — Job Discovery

Build:

- location intelligence
- company discovery
- recent jobs
- normalization
- deduplication
- JD snapshots

## Phase 4 — Intelligence

Build:

- JD analysis
- taxonomy
- matching
- Best Jobs for Me
- skill gaps
- readiness
- confidence

## Phase 5 — Resume

Build:

- tailoring
- versions
- ATS
- recruiter review
- fact checking
- repair loop

## Phase 6 — Application

Build:

- application package
- manual apply
- connector framework
- assisted apply
- field mapping
- state machine
- tracking

## Phase 7 — Supported Auto Apply

Build:

- Playwright layer
- supported ATS connectors
- setup screen
- analysis screen
- mapping screen
- review screen
- progress screen
- success screen
- fallback screen

## Phase 8 — Interview

Build:

- interview plans
- practice
- evaluation
- feedback

## Phase 9 — Career Intelligence

Build:

- analytics
- A/B testing
- outcome learning
- career recommendations

## Phase 10 — Production

Build:

- security hardening
- observability
- load testing
- CI/CD
- AWS
- Terraform
- backups
- disaster recovery
- monitoring
- alerting

---

# 90. Final Product Funnel

```text
JOBS FOUND
    ↓
RELEVANT JOBS
    ↓
QUALIFIED JOBS
    ↓
BEST JOBS FOR ME
    ↓
RESUME READY
    ↓
APPLICATION READY
    ↓
SUBMITTED
    ↓
RECRUITER RESPONSE
    ↓
INTERVIEW
    ↓
OFFER
```

Track conversion at every stage.

---

# 91. Product Differentiators

## Best Jobs for Me

Optimize for relevance, not application volume.

## Companies Hiring Now

Company-first local/market discovery.

## Evidence-backed applications

Prevent unsupported candidate claims.

## ATS + Recruiter quality

Separate deterministic compatibility from human-style quality assessment.

## Application Agent

Manual → Assisted → Supported Auto.

## Outcome Learning

Learn which jobs and application strategies actually work.

## AI Optional

Core system remains useful without an LLM.

## Career Intelligence

Move beyond job search into career optimization.

---

# 92. Final Architecture

```text
                           AI CAREER OS
                                |
        +-----------------------+-----------------------+
        |                       |                       |
    CANDIDATE                JOB MARKET             APPLICATION
    INTELLIGENCE             INTELLIGENCE           INTELLIGENCE
        |                       |                       |
    Profile                  Location                Agent
    Evidence                 Companies               Connectors
    Roles                    Recent Jobs             ATS
    Resume                   JD Analysis              Tracking
        |                    Matching                 |
        +-----------------------+-----------------------+
                                |
                       CAREER INTELLIGENCE
                                |
                  +-------------+-------------+
                  |                           |
             Interview                   Outcome Learning
             Preparation                       |
                  |                           |
                  +-------------+-------------+
                                |
                       Better Recommendations
```

---

# 93. Final Technology Decision

Primary production stack:

```text
Frontend
Next.js + React + TypeScript
Tailwind CSS + shadcn/ui

Backend
NestJS + Node.js + TypeScript

Database
PostgreSQL + Prisma + pgvector

Cache / Queues
Redis + BullMQ

Documents
PDF/DOCX processing and generation

Storage
Amazon S3 / S3-compatible

Automation
Playwright for supported/permitted workflows

AI
OpenAI / Gemini / Ollama / NoAI provider abstraction

Testing
Jest + Supertest + Playwright + k6

DevOps
Docker + GitHub Actions + AWS + Terraform

Observability
OpenTelemetry + Prometheus + Grafana + Sentry
```

Engineering principle:

> Use AI for interpretation and generation, while application code remains the authority for workflow state, deterministic scoring, validation, evidence integrity, security, permissions, and submission.

---

# 94. Final Implementation Checklist

## Foundation

- [ ] Monorepo
- [ ] Next.js
- [ ] NestJS
- [ ] PostgreSQL
- [ ] Prisma
- [ ] Redis
- [ ] BullMQ
- [ ] Docker
- [ ] Shared types
- [ ] Shared schemas

## Candidate

- [ ] Profile
- [ ] Evidence
- [ ] Resume parser
- [ ] Role profiles
- [ ] Resume library
- [ ] Resume versions

## Job Discovery

- [ ] Location intelligence
- [ ] Company discovery
- [ ] Companies Hiring Now
- [ ] Recent jobs
- [ ] Job normalization
- [ ] Deduplication
- [ ] JD snapshots

## Intelligence

- [ ] JD analysis
- [ ] Skill taxonomy
- [ ] Matching
- [ ] Best Jobs for Me
- [ ] Skill gap
- [ ] Job readiness
- [ ] Application confidence

## Resume

- [ ] Resume tailoring
- [ ] ATS
- [ ] Recruiter review
- [ ] Fact verification
- [ ] Repair loop
- [ ] A/B testing

## Applications

- [ ] Application package
- [ ] Manual Apply
- [ ] Assisted Apply
- [ ] Connector SDK
- [ ] ATS connectors
- [ ] Application Agent
- [ ] Form mapping
- [ ] Application questions
- [ ] Supported Auto Apply
- [ ] Fallback/User Action Required
- [ ] Application tracking

## Interviews

- [ ] Interview plans
- [ ] Practice
- [ ] Evaluation
- [ ] Feedback

## Analytics

- [ ] Funnel analytics
- [ ] Resume analytics
- [ ] Role analytics
- [ ] Source analytics
- [ ] Outcome learning
- [ ] Career intelligence

## Security

- [ ] Authentication
- [ ] Authorization
- [ ] Rate limiting
- [ ] File validation
- [ ] Malware scanning
- [ ] Secrets management
- [ ] Audit logs
- [ ] PII protection

## Reliability

- [ ] Idempotency
- [ ] Distributed locks
- [ ] Retries
- [ ] Backoff
- [ ] DLQ
- [ ] Circuit breakers
- [ ] Timeouts
- [ ] Transactions
- [ ] Trace IDs

## DevOps

- [ ] Docker Compose
- [ ] CI/CD
- [ ] AWS foundation
- [ ] Terraform
- [ ] Monitoring
- [ ] Logging
- [ ] Alerts
- [ ] Backups
- [ ] Disaster recovery

## Testing

- [ ] Unit
- [ ] Integration
- [ ] E2E
- [ ] Load
- [ ] Security
- [ ] Connector tests
- [ ] Application workflow tests

---

# 95. Definition of Done

The implementation is complete only when:

1. All major UI screens are implemented.
2. UI screens are connected to real backend APIs.
3. Authentication works.
4. Onboarding works.
5. Candidate profile works.
6. Resume upload and parsing work.
7. Evidence verification works.
8. Role profiles work.
9. Location-based discovery works.
10. Companies Hiring Now works.
11. Recent job discovery works.
12. Jobs are normalized and deduplicated.
13. JD snapshots are immutable.
14. JD analysis works.
15. Best Jobs for Me ranking works.
16. Matching works.
17. Skill gap works.
18. Resume tailoring works.
19. ATS validation works.
20. Recruiter review works.
21. Fact verification works.
22. Application packages are immutable.
23. Manual Apply works.
24. Assisted Apply works for supported workflows.
25. Supported/permitted Auto Apply works.
26. CAPTCHA/protected flows correctly stop and request user action.
27. Duplicate applications are prevented.
28. Application tracking works.
29. Interview preparation works.
30. Analytics work.
31. Outcome learning foundation works.
32. Security controls are implemented.
33. Audit logs work.
34. Queues/workers work.
35. Retry and failure handling work.
36. Observability works.
37. Unit tests pass.
38. Integration tests pass.
39. E2E tests pass.
40. Production build passes.
41. Docker environment works.
42. CI pipeline works.
43. Documentation is complete.

---

# 96. Antigravity Execution Instructions

When using this document as the Antigravity build prompt:

1. Inspect the existing repository first.
2. Do not delete working code without understanding it.
3. Produce an implementation plan before major changes.
4. Create the architecture incrementally.
5. Build the database foundation first.
6. Build API contracts before dependent UI logic.
7. Build shared types and schemas.
8. Implement core deterministic logic before AI enhancements.
9. Connect each UI screen to real state/API behavior.
10. Implement background workers for heavy tasks.
11. Test each module before moving forward.
12. Run typecheck frequently.
13. Run lint frequently.
14. Run unit tests frequently.
15. Run E2E tests for critical workflows.
16. Keep environment configuration documented.
17. Never hardcode credentials.
18. Never fabricate application data.
19. Never bypass platform protections.
20. Do not leave critical functionality as TODO.
21. Use feature flags for risky automation features.
22. Keep the connector architecture extensible.
23. Keep the application state machine explicit.
24. Keep application packages immutable.
25. Continue until the complete end-to-end product workflow is connected.

---

# 97. Required Final Antigravity Report

After implementation, provide:

```text
IMPLEMENTATION SUMMARY

ARCHITECTURE SUMMARY

DATABASE SUMMARY

API SUMMARY

WORKER SUMMARY

UI SCREEN SUMMARY

CONNECTOR SUMMARY

AI PROVIDER SUMMARY

NO-AI ENGINE SUMMARY

APPLICATION AUTOMATION SUMMARY

SECURITY SUMMARY

OBSERVABILITY SUMMARY

TEST SUMMARY

ENVIRONMENT SETUP

LOCAL RUN COMMANDS

PRODUCTION DEPLOYMENT STEPS

KNOWN LIMITATIONS

NEXT PRODUCTION STEPS
```

Also report:

- completed modules
- incomplete modules
- failing tests
- known technical debt
- unsupported connectors
- automation limitations
- environment variables required
- deployment requirements

Do not claim a feature is complete unless it has been implemented and tested.

---

# 98. Final Product Statement

AI Career OS is a complete career automation platform that:

```text
UNDERSTANDS THE CANDIDATE
        ↓
UNDERSTANDS THE JOB MARKET
        ↓
FINDS RELEVANT COMPANIES
        ↓
FINDS FRESH JOBS
        ↓
RANKS THE BEST JOBS
        ↓
EXPLAINS THE MATCH
        ↓
IDENTIFIES SKILL GAPS
        ↓
CREATES AN EVIDENCE-BACKED RESUME
        ↓
VALIDATES ATS + RECRUITER QUALITY
        ↓
PREPARES THE APPLICATION
        ↓
APPLIES MANUALLY / ASSISTED / SUPPORTED AUTO
        ↓
TRACKS APPLICATIONS
        ↓
PREPARES FOR INTERVIEWS
        ↓
LEARNS FROM OUTCOMES
        ↓
IMPROVES FUTURE RECOMMENDATIONS
```

The final goal is not:

> Apply to the maximum number of jobs.

The final goal is:

> **Apply to the right jobs with the strongest truthful application and continuously improve the candidate's job-search outcomes.**
