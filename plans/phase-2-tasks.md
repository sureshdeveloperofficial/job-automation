# AI Career OS — Phase 2: Tasks Checklist

## Phase 2: Profile & Evidence Engine

### Milestone 1: Data Contracts & Prisma Schema
- [ ] Extend `packages/types` with `EvidenceStatus`, `EvidenceSourceType`, `SeniorityLevel`, and `ParsedResumeData` interfaces
- [ ] Extend `packages/schemas` with `CreateEvidenceSchema`, `UpdateEvidenceSchema`, `CreateRoleProfileSchema`, `UpdateRoleProfileSchema`, `OnboardingSchemas`
- [ ] Update `apps/api/prisma/schema.prisma` with `RoleProfile`, `CandidateEvidence`, and `Resume` models
- [ ] Execute `pnpm --filter api db:push` to sync database schema on port `5433`
- [ ] Export new contracts from root index files of `@career-os/types` and `@career-os/schemas`

### Milestone 2: Deterministic Resume Parser Engine
- [ ] Implement text extraction utilities (PDF and DOCX support)
- [ ] Implement rule-based section classifier (`SUMMARY`, `EXPERIENCE`, `SKILLS`, `EDUCATION`, `PROJECTS`)
- [ ] Implement contact details regex extractor (email, phone, LinkedIn, GitHub, portfolio)
- [ ] Implement skill dictionary matcher (500+ curated tech terms)
- [ ] Implement evidence candidate generator from work experience bullets
- [ ] Write unit tests for the deterministic resume parser (`apps/api/test/resume-parser.spec.ts`)

### Milestone 3: Backend API Modules (NestJS)
- [ ] **Resumes Module**:
  - [ ] `POST /resumes/upload`: Handle file upload to MinIO S3 bucket `resumes`
  - [ ] `POST /resumes/parse`: Deterministic parse and return structured resume AST
  - [ ] `GET /resumes`: List all user resumes with metadata
  - [ ] `GET /resumes/:id`: Retrieve single resume details
- [ ] **Profile Module**:
  - [ ] `GET /profile/me`: Retrieve full profile with health score
  - [ ] `PUT /profile/me`: Update profile details (personal, location, preferences)
  - [ ] `GET /profile/health`: Detailed 0–100% health score breakdown with recommendations
- [ ] **Evidence Ledger Module**:
  - [ ] `GET /evidence`: List evidence items with filtering by status/category
  - [ ] `POST /evidence`: Create manual evidence claim
  - [ ] `PATCH /evidence/:id`: Update or toggle verification status (`PENDING`, `VERIFIED`, `REJECTED`)
  - [ ] `DELETE /evidence/:id`: Remove evidence record
  - [ ] `POST /evidence/bulk-verify`: Bulk status update
- [ ] **Role Profiles Module**:
  - [ ] `GET /role-profiles`: List user's role profiles
  - [ ] `POST /role-profiles`: Create a new role profile
  - [ ] `GET /role-profiles/:id`: Get role profile by ID
  - [ ] `PUT /role-profiles/:id`: Update role profile
  - [ ] `DELETE /role-profiles/:id`: Delete role profile
  - [ ] `POST /role-profiles/:id/set-default`: Set primary role profile
- [ ] Write unit and integration tests for Profile, Evidence, and RoleProfiles services

### Milestone 4: Frontend Onboarding Wizard (`apps/web`)
- [ ] Build multi-step state machine with visual progress bar (`/onboarding`)
- [ ] Step 1: Personal & Contact Information form with Zod validation
- [ ] Step 2: Target Role & Seniority selector
- [ ] Step 3: Interactive Skills badge tagger with quick add recommendations
- [ ] Step 4: Dynamic Work Experience entries with achievement bullets
- [ ] Step 5: Resume Drag & Drop uploader with live extraction preview
- [ ] Step 6: Evidence Verification & Health Summary review
- [ ] Add auto-save and draft resume recovery

### Milestone 5: Frontend Profile Hub & Management Screens (`apps/web`)
- [ ] Build `/profile` Profile Management Hub with radial Health Score meter
- [ ] Build tabbed sub-views: Personal Info, Work History, Education, Skills Matrix, Preferences
- [ ] Build `/profile/evidence` Evidence Ledger with filter controls, verification chips, and source links
- [ ] Build `/role-profiles` Multi-Target Role Manager with add/edit modals and default toggles
- [ ] Connect all frontend components to typed Axios API client (`src/lib/api.ts`)

### Milestone 6: Verification & Quality Assurance
- [ ] Execute `pnpm run typecheck` across all 4 workspaces (0 errors)
- [ ] Execute `pnpm run lint` across monorepo (0 errors)
- [ ] Execute `pnpm test` (all unit and integration tests passing)
- [ ] Verify live API on `http://localhost:1961` and Swagger UI on `http://localhost:1961/api/docs`
- [ ] Verify live Web UI on `http://localhost:1962`
- [ ] Document Phase 2 completion in `plans/phase-2-tasks.md` and commit to Git
