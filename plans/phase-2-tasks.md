# AI Career OS — Phase 2: Tasks Checklist

## Phase 2: Profile & Evidence Engine

### Milestone 1: Data Contracts & Prisma Schema
- [x] Extend `packages/types` with `EvidenceStatus`, `EvidenceSourceType`, `SeniorityLevel`, and `ParsedResumeData` interfaces
- [x] Extend `packages/schemas` with `CreateEvidenceSchema`, `UpdateEvidenceSchema`, `CreateRoleProfileSchema`, `UpdateRoleProfileSchema`, `OnboardingSchemas`
- [x] Update `apps/api/prisma/schema.prisma` with `RoleProfile`, `CandidateEvidence`, and `Resume` models
- [x] Execute `pnpm --filter api db:push` to sync database schema on port `5433`
- [x] Export new contracts from root index files of `@career-os/types` and `@career-os/schemas`

### Milestone 2: Deterministic Resume Parser Engine
- [x] Implement text extraction utilities (PDF and DOCX support)
- [x] Implement rule-based section classifier (`SUMMARY`, `EXPERIENCE`, `SKILLS`, `EDUCATION`, `PROJECTS`)
- [x] Implement contact details regex extractor (email, phone, LinkedIn, GitHub, portfolio)
- [x] Implement skill dictionary matcher (500+ curated tech terms)
- [x] Implement evidence candidate generator from work experience bullets
- [x] Write unit tests for the deterministic resume parser (`apps/api/test/resume-parser.spec.ts`)

### Milestone 3: Backend API Modules (NestJS)
- [x] **Resumes Module**:
  - [x] `POST /resumes/upload`: Handle file upload to MinIO S3 bucket `resumes`
  - [x] `POST /resumes/parse`: Deterministic parse and return structured resume AST
  - [x] `GET /resumes`: List all user resumes with metadata
  - [x] `GET /resumes/:id`: Retrieve single resume details
- [x] **Profile Module**:
  - [x] `GET /profile/me`: Retrieve full profile with health score
  - [x] `PUT /profile/me`: Update profile details (personal, location, preferences)
  - [x] `GET /profile/health`: Detailed 0–100% health score breakdown with recommendations
- [x] **Evidence Ledger Module**:
  - [x] `GET /evidence`: List evidence items with filtering by status/category
  - [x] `POST /evidence`: Create manual evidence claim
  - [x] `PATCH /evidence/:id`: Update or toggle verification status (`PENDING`, `VERIFIED`, `REJECTED`)
  - [x] `DELETE /evidence/:id`: Remove evidence record
  - [x] `POST /evidence/bulk-verify`: Bulk status update
- [x] **Role Profiles Module**:
  - [x] `GET /role-profiles`: List user's role profiles
  - [x] `POST /role-profiles`: Create a new role profile
  - [x] `GET /role-profiles/:id`: Get role profile by ID
  - [x] `PUT /role-profiles/:id`: Update role profile
  - [x] `DELETE /role-profiles/:id`: Delete role profile
  - [x] `POST /role-profiles/:id/set-default`: Set primary role profile
- [x] Write unit and integration tests for Profile, Evidence, and RoleProfiles services

### Milestone 4: Frontend Onboarding Wizard (`apps/web`)
- [x] Build multi-step state machine with visual progress bar (`/onboarding`)
- [x] Step 1: Personal & Contact Information form with Zod validation
- [x] Step 2: Target Role & Seniority selector
- [x] Step 3: Interactive Skills badge tagger with quick add recommendations
- [x] Step 4: Dynamic Work Experience entries with achievement bullets
- [x] Step 5: Resume Drag & Drop uploader with live extraction preview
- [x] Step 6: Evidence Verification & Health Summary review
- [x] Add auto-save and draft resume recovery

### Milestone 5: Frontend Profile Hub & Management Screens (`apps/web`)
- [x] Build `/profile` Profile Management Hub with radial Health Score meter
- [x] Build tabbed sub-views: Personal Info, Work History, Education, Skills Matrix, Preferences
- [x] Build `/profile/evidence` Evidence Ledger with filter controls, verification chips, and source links
- [x] Build `/role-profiles` Multi-Target Role Manager with add/edit modals and default toggles
- [x] Connect all frontend components to typed Axios API client (`src/lib/api.ts`)

### Milestone 6: Verification & Quality Assurance
- [x] Execute `pnpm run typecheck` across all 4 workspaces (0 errors)
- [x] Execute `pnpm run lint` across monorepo (0 errors)
- [x] Execute `pnpm test` (all unit and integration tests passing: 19/19 tests)
- [x] Verify live API on `http://localhost:1961` and Swagger UI on `http://localhost:1961/api/docs`
- [x] Verify live Web UI on `http://localhost:1962`
- [x] Document Phase 2 completion in `plans/phase-2-tasks.md` and commit to Git
