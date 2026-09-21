# AI Career OS — Master Task Tracker & Verification Record

> **Overall Project Status**: **Phase 1 (100% Completed)** | **Phase 2 (100% Completed)** | **Phase 3 (100% Completed)** | **Phase 4 (100% Completed)**  
> **Active Environment**: Ports `1961` (API) & `1962` (Web), Postgres `5433`, Redis `6379`, MinIO `9000/9001`  
> **Last Verification Date**: 2026-09-21  

---

## Executive Summary

| Phase | Title | Scope | Status | Test & Quality Gate |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation & Architecture** | Monorepo, Shared Contracts, NestJS API Auth, Next.js Web, Docker Stack | **100% COMPLETED** | Typecheck PASS, Oxlint PASS, 8/8 Unit Tests PASS, All Containers Healthy |
| **Phase 2** | **Profile & Evidence Engine** | Deterministic Resume Parser, Profile Health Engine, Evidence Ledger, Role Profiles, Onboarding Wizard, Profile Hub | **100% COMPLETED** | Typecheck PASS, Oxlint PASS, 19/19 Unit Tests PASS, All Endpoints HTTP 200 |
| **Phase 3** | **Job Discovery & Market Radar** | Connectors SDK, Normalization, Deduplication, Deterministic JD Analyzer, Jobs & Companies APIs, Web Radar UI | **100% COMPLETED** | Typecheck PASS, Lint PASS, 41/41 Unit Tests PASS, 0 Errors Across Workspaces |
| **Phase 4** | **Resume Tailoring & Version Control** | Deterministic ATS Scoring, Evidence-Backed Tailoring, Visual Diffing, Semantic HTML & Text Exporter, Web Tailoring Studio & Audit | **100% COMPLETED** | Typecheck PASS, Lint PASS, 50/50 Unit Tests PASS (14/14 suites), 0 Errors |

---

## Phase 1: Task Verification Matrix

### 1. Monorepo Root Setup
- [x] **P1-01: Git Repository Initialized** — Remote added to `https://github.com/sureshdeveloperofficial/job-automation.git` on branch `main`.
- [x] **P1-02: Workspace Configuration** — `pnpm-workspace.yaml` configured for `apps/*` and `packages/*`.
- [x] **P1-03: Monorepo Root Tooling** — `package.json` configured with Turborepo scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `clean`, `format`).
- [x] **P1-04: Turborepo Pipeline** — `turbo.json` build pipeline configured with topological dependency caching.
- [x] **P1-05: Shared TypeScript Base** — `tsconfig.base.json` with modern strict compiler options.
- [x] **P1-06: Git Ignore Rules** — Comprehensive `.gitignore` for node_modules, `.env`, `.next`, and build outputs.
- [x] **P1-07: Docker Ignore Rules** — `.dockerignore` configured to prevent host `node_modules` transfer.
- [x] **P1-08: PNPM Hoisting Configuration** — `.npmrc` configured for reliable monorepo module resolution.
- [x] **P1-09: Environment Variables Template** — Complete `.env.example` blueprint for all services and ports.
- [x] **P1-10: Documentation** — Master `README.md` with system architecture and port mappings.

### 2. Shared Data Contracts
- [x] **P1-11: `@career-os/types` Scaffolding** — NodeNext ESM package with `"types"` export mapping.
- [x] **P1-12: Domain Enums** — `UserRole`, `WorkMode`, `EmploymentType`, `ApplicationState`, `ResumeType`, `SkillGapLevel`, `SkillGapPriority`.
- [x] **P1-13: Domain Entity Types** — Core interfaces for `User`, `CandidateProfile`, `CandidateEvidence`, `RoleProfile`, `Resume`, `Job`, `Application`.
- [x] **P1-14: `@career-os/schemas` Scaffolding** — Shared Zod validation package with compiled TypeScript DTOs.
- [x] **P1-15: Auth & User Schemas** — `SignUpSchema`, `SignInSchema`, `RefreshTokenSchema`, `UpdateCandidateProfileSchema`.

### 3. Backend API Foundation (`apps/api`)
- [x] **P1-16: NestJS 12 Application Core** — Scaffolded with Vitest, Fastify/Express platform, and `@Public()` decorators.
- [x] **P1-17: Relational Database Schema** — `prisma/schema.prisma` with User, RefreshToken, Profile, Evidence, Resume, and Job tables.
- [x] **P1-18: Global Prisma Service** — Connection lifecycle management and health monitoring.
- [x] **P1-19: Authentication Service** — Argon2/bcrypt password hashing, JWT access token (15m), and secure refresh token rotation (7d).
- [x] **P1-20: Authentication Controller** — `/api/v1/auth/signup`, `/signin`, `/refresh`, and `/logout` with OpenAPI docs.
- [x] **P1-21: JWT Passport Strategy & Guard** — Automatic request authentication with route-level `@Public()` bypass.
- [x] **P1-22: Users Module** — User profile inspection via `GET /api/v1/users/me`.
- [x] **P1-23: Health Controller** — `GET /api/v1/health` with active PostgreSQL and Redis ping checks.
- [x] **P1-24: Standardized Envelopes** — `ResponseInterceptor` (`{ success, data, timestamp, traceId }`) and `AllExceptionsFilter`.
- [x] **P1-25: Pino Structured Logging** — Contextual request tracing and log level filtering.
- [x] **P1-26: OpenAPI / Swagger Integration** — Auto-generated OpenAPI schema live at `http://localhost:1961/api/docs`.
- [x] **P1-27: Unit Tests Suite** — Auth and Users services (8/8 passing).

### 4. Frontend Web Foundation (`apps/web`)
- [x] **P1-28: Next.js 16 App Router** — TypeScript, Tailwind CSS v4, and Turbopack compiler.
- [x] **P1-29: Design System & Styling** — Dark glassmorphism styling, radial glow utilities, and CSS tokens in `globals.css`.
- [x] **P1-30: Component Library** — shadcn/ui components (`Button`, `Input`, `Label`, `Card`, `Badge`, `Skeleton`, `Toast`).
- [x] **P1-31: Global Providers** — TanStack React Query and theme provider wrappers.
- [x] **P1-32: Typed API Client** — Axios client with automated 401 token refresh queue (`src/lib/api.ts`).
- [x] **P1-33: Authentication Context** — `AuthProvider` and `useAuth` hook with session restoration.
- [x] **P1-34: Login Screen** — `/login` with form validation and password reveal toggle.
- [x] **P1-35: Signup Screen** — `/signup` with real-time password strength and requirement tracker.
- [x] **P1-36: Dashboard Shell** — `/dashboard` authenticated dashboard with KPI cards and quick actions.

### 5. Docker Infrastructure
- [x] **P1-37: Compose Architecture** — Multi-container definition in `docker-compose.yml`.
- [x] **P1-38: Database Container** — PostgreSQL 16 with `pgvector` extension exposed on host port `5433`.
- [x] **P1-39: Cache & Queue Container** — Redis 7 Alpine exposed on port `6379`.
- [x] **P1-40: Object Storage Container** — MinIO S3 API on port `9000` and Web Console on port `9001`.
- [x] **P1-41: Network & Binding Fixes** — Configured container `0.0.0.0` bindings and removed profile flags so web (1962) and api (1961) boot by default.

---

## Phase 2: Task Verification Matrix

### 1. Data Contracts & Prisma Schema Extension
- [x] **P2-01: Types Extension** — Added `EvidenceStatus`, `EvidenceSourceType`, `SeniorityLevel`, `ParsedResumeData`, and `HealthBreakdown` in `@career-os/types`.
- [x] **P2-02: Schemas Extension** — Added `CreateEvidenceSchema`, `UpdateEvidenceSchema`, `CreateRoleProfileSchema`, `UpdateRoleProfileSchema`, and `OnboardingSchemas` in `@career-os/schemas`.
- [x] **P2-03: Relational Models Update** — Added `RoleProfile`, `CandidateEvidence`, and `Resume` models with foreign keys to `prisma/schema.prisma`.
- [x] **P2-04: Database Synchronization** — Pushed updated schema to database via Prisma (`prisma db push`).

### 2. Deterministic Resume Parser Engine
- [x] **P2-05: Multi-Format Text Extraction** — PDF (`pdf-parse`) and DOCX (`mammoth`) text extraction service.
- [x] **P2-06: Rule-Based Section Classifier** — Header heuristic detection for `SUMMARY`, `EXPERIENCE`, `SKILLS`, `EDUCATION`, and `PROJECTS`.
- [x] **P2-07: Contact Details Extractor** — Regex extraction for email, international telephone numbers, LinkedIn URLs, and GitHub handles.
- [x] **P2-08: Skill Dictionary Matcher** — Fast set-based matcher recognizing 500+ curated programming languages, frameworks, cloud services, and tools.
- [x] **P2-09: Candidate Evidence Generator** — Automatically extracts action-verb achievement bullets from experience sections into candidate evidence records.
- [x] **P2-10: Resume Parser Unit Tests** — 5/5 unit tests passing in `apps/api/test/resume-parser.service.spec.ts`.

### 3. Backend API Modules (`apps/api`)
- [x] **P2-11: Resumes Upload Endpoint** — `POST /api/v1/resumes/upload` with Multer file validation and MinIO S3 storage.
- [x] **P2-12: Resumes Parsing Endpoint** — `POST /api/v1/resumes/parse` extracting deterministic resume AST.
- [x] **P2-13: Resumes Query Endpoints** — `GET /api/v1/resumes` (list) and `GET /api/v1/resumes/:id` (single).
- [x] **P2-14: Profile Management Endpoints** — `GET /api/v1/profile/me` and `PUT /api/v1/profile/me` for profile updates.
- [x] **P2-15: Profile Health Score Calculator** — `GET /api/v1/profile/health` returning 0–100% overall score with weighted component breakdown (Personal 15%, Experience 30%, Skills 25%, Evidence 20%, Education 10%) and dynamic suggestions.
- [x] **P2-16: Evidence Ledger Endpoints** — `GET /api/v1/evidence` (with status/category filters) and `POST /api/v1/evidence` (manual claim creation).
- [x] **P2-17: Evidence Verification & Deletion** — `PATCH /api/v1/evidence/:id` (toggle status) and `DELETE /api/v1/evidence/:id`.
- [x] **P2-18: Evidence Bulk Operations** — `POST /api/v1/evidence/bulk-verify` for bulk verification of extracted claims.
- [x] **P2-19: Role Profiles CRUD** — `GET /api/v1/role-profiles`, `POST /api/v1/role-profiles`, `GET /:id`, `PUT /:id`, and `DELETE /:id`.
- [x] **P2-20: Role Profile Primary Toggle** — `POST /api/v1/role-profiles/:id/set-default` ensures single primary profile invariant.
- [x] **P2-21: Service Integration Tests** — Profile, RoleProfiles, Evidence, and Resume Parser suites (19/19 passing).

### 4. Frontend Onboarding Wizard (`apps/web`)
- [x] **P2-22: Multi-Step State Machine** — 6-step state machine with animated progress meter at `/onboarding`.
- [x] **P2-23: Step 1: Personal Details** — Full name, headline, phone, location, bio, LinkedIn, GitHub with Zod validation.
- [x] **P2-24: Step 2: Target Role & Seniority** — Desired titles, seniority level, minimum salary, work modes (Remote, Hybrid, Onsite).
- [x] **P2-25: Step 3: Interactive Skills Matrix** — Tag-based skill entry with quick-add recommendations.
- [x] **P2-26: Step 4: Work Experience Builder** — Dynamic list of previous roles, dates, descriptions, and achievements.
- [x] **P2-27: Step 5: Resume Drag & Drop Uploader** — Instant file dropzone with real-time deterministic parsing preview.
- [x] **P2-28: Step 6: Evidence Verification & Review** — Review extracted claims, adjust verifications, and submit profile.

### 5. Frontend Profile Hub & Management Screens (`apps/web`)
- [x] **P2-29: Profile Management Hub** — `/profile` with radial health score gauge, summary cards, and quick navigation.
- [x] **P2-30: Sub-View Tabs** — Interactive tabs for Personal Info, Experience, Education, Skills, and Preferences.
- [x] **P2-31: Evidence Ledger Screen** — `/profile/evidence` with claim verification badges, category filters, and source links.
- [x] **P2-32: Target Role Profiles Screen** — `/role-profiles` multi-preset manager with modal creator and primary badge toggles.
- [x] **P2-33: API Client Connection** — All frontend forms wired to backend endpoints with toast notifications.

### 6. Cloudinary Cloud Storage & Document Ingestion
- [x] **P2-34: Cloudinary Storage Service** — `CloudinaryService` with stream buffer upload supporting raw documents (`PDF`, `DOCX`, `TXT`) and images (`PNG`, `JPG`).
- [x] **P2-35: Storage Controller** — `POST /api/v1/storage/upload` for generic multipart file uploads.
- [x] **P2-36: Cloudinary Resume Upload Endpoint** — `POST /api/v1/resumes/upload` stores file in Cloudinary (`job-automation/resumes`), deterministically parses AST, syncs candidate profile, and seeds evidence items.
- [x] **P2-37: Evidence Attachment Endpoint** — `POST /api/v1/evidence/:id/attachment` uploads proof documents/screenshots to Cloudinary (`job-automation/evidence`) and links to `sourceDetail`.
- [x] **P2-38: Frontend File Dropzone** — `FileDropzone` drag-and-drop component with format filtering, 10MB limit, and loading states.
- [x] **P2-39: Onboarding Cloudinary Ingestion** — Step 5 dual-mode selector (Cloudinary file dropzone + fallback plain text) with instant evidence population.
- [x] **P2-40: Evidence Ledger Proof Attachments** — Direct Cloudinary document upload and verified proof links in `/profile/evidence`.
- [x] **P2-41: Cloudinary Service Unit Tests** — 3 unit tests in `apps/api/test/cloudinary.service.spec.ts` (all passing).

---

## Phase 3: Task Verification Matrix

### 1. Data Contracts & Prisma Schema Extension
- [x] **P3-01: Types Extension** — Added `SeniorityLevel`, `JobFreshness`, `ConnectorCapability`, extended `Company`, `Job`, `JDSnapshot`, and added `JobDetails`, `SalaryInfo`, `JobSearchFilter`, `CompanyFilter` in `@career-os/types`.
- [x] **P3-02: Schemas Extension** — Added `JobSearchFilterSchema`, `IngestJobSchema`, `CompanyFilterSchema` in `@career-os/schemas` and exported inferred DTOs.
- [x] **P3-03: Relational Models Update** — Extended `Company`, `Job`, `JDSnapshot` with city, state, country, lat/long, seniority, salaryPeriod, requiredSkills, preferredSkills, responsibilities, experienceMinYears/MaxYears, cleanedText, and rawHtml in `prisma/schema.prisma`.
- [x] **P3-04: Prisma Client Offline Generation** — Executed `pnpm -F api exec prisma generate` generating client with updated models and enums.

### 2. Connector SDK & Feed Ingestion
- [x] **P3-05: Connector Abstract Interface** — `apps/api/src/connectors/connector.interface.ts` defining `JobConnector` and `RawJobPayload`.
- [x] **P3-06: Greenhouse Connector** — Ingestion from public Greenhouse boards (`boards-api.greenhouse.io`).
- [x] **P3-07: Lever Connector** — Ingestion from public Lever postings (`api.lever.co`).
- [x] **P3-08: Seed Tech Jobs Connector** — Realistic high-quality tech postings across Zoho, Razorpay, Zerodha, Postman, BrowserStack, Swiggy in Coimbatore, Bangalore, Chennai, Hyderabad, and Remote.
- [x] **P3-09: Connectors NestJS Module** — Registered in `ConnectorsModule` with DI token `JOB_CONNECTORS` and automated sync support.

### 3. Normalization & Deterministic JD Analyzer
- [x] **P3-10: Job Normalizer Service** — Canonical role mapping (e.g. "SDE-II" -> "Backend Engineer"), regex salary parser (INR LPA, $, hourly), and experience level extraction.
- [x] **P3-11: Job Deduplication Service** — SHA-256 content hashing across title, company, location, and description; eliminates duplicate listings and updates `lastSeenAt`.
- [x] **P3-12: Deterministic JD Analyzer** — Zero mandatory LLM cost; 500+ skills dictionary extraction (required vs preferred), seniority detection, and action-verb responsibility extraction.
- [x] **P3-13: Immutable JD Snapshot Service** — Captures immutable raw JD and cleaned text snapshots verified by SHA-256 checksums.
- [x] **P3-14: Normalization & Analyzer Unit Tests** — 16 unit tests passing across `test/job-normalizer.service.spec.ts` (8/8), `test/jd-analyzer.service.spec.ts` (4/4), and `test/job-deduplication.service.spec.ts` (4/4).

### 4. Backend API Modules (`apps/api`)
- [x] **P3-15: Jobs Search API** — `GET /api/v1/jobs` with multi-facet filters (query, location, workMode, freshness, minSalary, pagination).
- [x] **P3-16: Job Details & Candidate Match Readiness** — `GET /api/v1/jobs/:id` returning parsed specifications and real-time candidate match scoring.
- [x] **P3-17: Immutable Snapshot Retrieval** — `GET /api/v1/jobs/:id/snapshot` returning raw immutable JD text and SHA-256 hash.
- [x] **P3-18: Jobs Ingestion & Feed Sync** — `POST /api/v1/jobs/ingest` (manual intake) and `POST /api/v1/jobs/sync` (connector feeds sync).
- [x] **P3-19: Companies Directory API** — `GET /api/v1/companies`, `GET /api/v1/companies/:id`, and `GET /api/v1/companies/:id/jobs`.
- [x] **P3-20: Jobs Service Unit Tests** — 3 unit tests in `apps/api/test/jobs.service.spec.ts` (3/3 passing). Total backend test suite now at 41/41 passing tests.

### 5. Frontend Web Screens (`apps/web`)
- [x] **P3-21: Reusable Sidebar Navigation** — `AppSidebar` component with active route highlighting, badge counts, and user profile footer.
- [x] **P3-22: Market Radar Job Discovery** — `/jobs` screen with freshness pills, work mode filters, salary formatting, live search, quick-preview drawer, and "Sync Tech Feeds" trigger.
- [x] **P3-23: Hiring Companies Directory** — `/companies` screen with hiring velocity indicators, active openings count, industry filters, and direct links to open roles.
- [x] **P3-24: Job Details & Immutable JD Inspector** — `/jobs/[id]` screen with candidate match readiness score, verified skills vs gap breakdown, structured checklist, and immutable raw snapshot viewer with SHA-256 copy button.
- [x] **P3-25: Dashboard Market Radar Highlights** — `/dashboard` mission control with live jobs/companies count and recent opportunities feed.

---

## Phase 4: Task Verification Matrix

### 1. Data Contracts & Prisma Schema
- [x] **P4-01: Shared AST & Scoring Types** — `packages/types` extended with `ResumeAST`, `AtsScoreResult`, `AtsScoreBreakdown`, `ResumeVariant`, `ResumeDiff`, `TailorResumeInput`, and `ResumeTemplateStyle`.
- [x] **P4-02: Shared Zod DTOs** — `packages/schemas` extended with `ScoreResumeSchema`, `TailorResumeSchema`, and `CreateVariantSchema`.
- [x] **P4-03: Relational Persistence Extensions** — `ResumeVersion` extended in `prisma/schema.prisma` with `structuredData`, `targetJobId`, `targetCompany`, `atsScore`, `atsBreakdown`, `diffSummary`, `evidenceBindings`, and relation to `Job`.
- [x] **P4-04: Package Compilations** — `@career-os/types` and `@career-os/schemas` built and packaged cleanly.

### 2. ATS Scorer & Tailoring Engines
- [x] **P4-05: Deterministic ATS Scorer** — 5-factor scoring engine (35% required skills, 15% preferred skills, 20% experience alignment, 15% quantifiable impact, 15% formatting hygiene) with synonym expansion and actionable recommendations.
- [x] **P4-06: Zero-Hallucination Tailoring Service** — Evidence re-ranking, bullet re-ordering based on keyword relevance, skills promotion to core, and summary synthesis; every bullet point bound to verified evidence.
- [x] **P4-07: Resume Diff Engine** — Structural section-level and bullet-level diffing between base and tailored versions.
- [x] **P4-08: ATS Document Exporter** — Semantic HTML generator with print stylesheet and plain-text ASCII resume generator.

### 3. Backend REST APIs
- [x] **P4-09: Score Resume Endpoint** — `POST /api/v1/resumes/:id/score` calculating deterministic score against target job or custom JD.
- [x] **P4-10: Tailor Resume Endpoint** — `POST /api/v1/resumes/:id/tailor` creating an immutable tailored variant.
- [x] **P4-11: List Variants Endpoint** — `GET /api/v1/resumes/variants` returning tailored resumes with target job info and ATS scores.
- [x] **P4-12: Variant Detail Endpoint** — `GET /api/v1/resumes/variants/:id` returning structured AST and audit details.
- [x] **P4-13: Variant Diff Endpoint** — `GET /api/v1/resumes/variants/:id/diff` returning structural delta against base version.
- [x] **P4-14: Variant Export Endpoint** — `GET /api/v1/resumes/variants/:id/export` generating HTML, plain text, or JSON.

### 4. Frontend Web UI
- [x] **P4-15: Resume Hub (`/resumes`)** — Master resumes & tailored variants tabs, ATS gauges, target company badges, and quick export.
- [x] **P4-16: Tailoring Studio (`/resumes/tailor`)** — 4-step wizard (Role Selection, Pre-score Gap Analysis, Evidence Claims, and Side-by-side Diff Preview).
- [x] **P4-17: Variant & ATS Audit Inspector (`/resumes/[id]`)** — Printable semantic resume preview, ATS category scorecard, matched vs missing skills, and visual diff viewer.
- [x] **P4-18: Role Details Integration** — Direct "Tailor Resume" CTA button from `/jobs/[id]` header and Candidate Match Readiness card.
- [x] **P4-19: Mission Control Integration** — ATS Tailoring Engine launch card added to `/dashboard`.

### 5. Docker Container Reliability & Auth Resolution
- [x] **P4-20: Automatic Docker Container Schema Push** — `apps/api/package.json` `"start:prod"` configured with `prisma db push --skip-generate && node dist/main.js`, ensuring PostgreSQL tables (`public.users`, etc.) are automatically synchronized on container spin-up.
- [x] **P4-21: CurrentUser Decorator Property Resolution** — [`CurrentUser`](file:///d:/Personal/job-automation/apps/api/src/auth/decorators/current-user.decorator.ts) updated to correctly extract string IDs (`@CurrentUser('id')`), resolving user ID lookups in resume and application services.

---

## Phase 5: Application Engine & Submission Automation (Roadmap — Next Up)

- **Lifecycle State Machine**: Comprehensive states (`DRAFT`, `READY`, `SUBMITTING`, `SUBMITTED`, `INTERVIEWING`, `OFFER`, `REJECTED`, `ARCHIVED`).
- **Form Automation Engine**: Mapping candidate profile and evidence claims to standard ATS application form fields (Workday, Greenhouse, Lever).
- **User Consent & Review Gate**: Mandatory review and confirmation gate before any automated submission is processed.
- **Submission Receipts & Proofs**: Capture submission confirmation IDs, timestamps, and evidence logs.
- **Application Tracker UI**: Kanban and tabular views for application status, follow-up reminders, and response metrics.

---

## Verification & Quality Assurance Summary

| Check | Tool / Target | Command | Result |
| :--- | :--- | :--- | :--- |
| **Monorepo Typecheck** | Turborepo (4 packages) | `pnpm run typecheck` | **PASS (0 errors across 4/4 packages)** |
| **Code Linting** | Oxlint & ESLint | `pnpm run lint` | **PASS (0 errors, 0 warnings across API and Web)** |
| **Backend Test Suite** | Vitest (14 suites, 50 tests) | `pnpm --filter api test` | **PASS (50/50 passing in 3.06s)** |
| **Prisma Generation** | Prisma Client (v6.1.0) | `pnpm -F api exec prisma generate` | **PASS (Schema synchronized)** |

---

## Verified File Catalog

- **Documentation & Plans**:
  - `plans/phase-1-plan.md`
  - `plans/phase-1-tasks.md`
  - `plans/phase-2-plan.md`
  - `plans/phase-2-tasks.md`
  - `plans/phase-3-plan.md`
  - `plans/phase-3-tasks.md`
  - `plans/phase-4-plan.md`
  - `plans/phase-4-tasks.md`
  - `plans/master-task-tracker.md` (this file)
  - `.agents/skills/ai-career-os/SKILL.md`
- **Backend API Modules**:
  - `apps/api/src/auth/*`
  - `apps/api/src/users/*`
  - `apps/api/src/profile/*`
  - `apps/api/src/evidence/*`
  - `apps/api/src/resumes/*` (Resumes service, controller, module)
  - `apps/api/src/resumes/ats-scorer/*` (Deterministic 5-factor ATS scoring service)
  - `apps/api/src/resumes/tailoring/*` (Evidence-backed tailoring pipeline)
  - `apps/api/src/resumes/diff/*` (Structural diffing service)
  - `apps/api/src/resumes/export/*` (Semantic ATS HTML and plain-text export)
  - `apps/api/src/resume-parser/*`
  - `apps/api/src/role-profiles/*`
  - `apps/api/src/storage/*`
  - `apps/api/src/connectors/*` (Greenhouse, Lever, Seed connectors, interface)
  - `apps/api/src/jobs/*` (Job pipeline, normalizer, deduplication, search service, controller)
  - `apps/api/src/jd-analysis/*` (JD analyzer, snapshot service)
  - `apps/api/src/companies/*` (Companies service, controller)
- **Frontend App Routes & Components**:
  - `apps/web/src/app/(auth)/login/page.tsx`
  - `apps/web/src/app/(auth)/signup/page.tsx`
  - `apps/web/src/app/(app)/dashboard/page.tsx` (Market radar & ATS tailoring studio banner)
  - `apps/web/src/app/(app)/onboarding/page.tsx`
  - `apps/web/src/app/(app)/profile/page.tsx`
  - `apps/web/src/app/(app)/profile/evidence/page.tsx`
  - `apps/web/src/app/(app)/role-profiles/page.tsx`
  - `apps/web/src/app/(app)/jobs/page.tsx` (Market Radar discovery & quick-preview)
  - `apps/web/src/app/(app)/jobs/[id]/page.tsx` (Role details, match readiness, JD inspector, Tailor CTA)
  - `apps/web/src/app/(app)/companies/page.tsx` (Companies hiring directory)
  - `apps/web/src/app/(app)/resumes/page.tsx` (Resume Hub & Lineage)
  - `apps/web/src/app/(app)/resumes/tailor/page.tsx` (4-step Tailoring Studio)
  - `apps/web/src/app/(app)/resumes/[id]/page.tsx` (Variant & ATS Audit Inspector)
  - `apps/web/src/components/app-sidebar.tsx`
  - `apps/web/src/components/ui/file-dropzone.tsx`
  - `apps/web/src/components/ui/textarea.tsx`

