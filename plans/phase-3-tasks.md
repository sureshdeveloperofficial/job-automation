# AI Career OS — Phase 3: Tasks Checklist

## Phase 3: Job Discovery & Market Radar Engine

### Milestone 1: Data Contracts & Database Schema
- [ ] Extend `packages/types` with `Job`, `Company`, `JobSnapshot`, `JobSearchFilter`, `JobDetails`, `SalaryInfo` interfaces
- [ ] Extend `packages/schemas` with `JobSearchFilterSchema`, `IngestJobSchema`, `CompanyFilterSchema`
- [ ] Update `apps/api/prisma/schema.prisma` with `Company`, `Job`, and `JobSnapshot` models
- [ ] Execute `pnpm -F api exec prisma db push` to synchronize database schema on port `5433`
- [ ] Export new contracts from root index files of `@career-os/types` and `@career-os/schemas`

### Milestone 2: Connector SDK & Feed Ingestion
- [ ] Create `packages/connector-sdk` (or `apps/api/src/connectors`) with `JobConnector` abstract class
- [ ] Implement `GreenhouseConnector` for public boards ingestion (`boards-api.greenhouse.io`)
- [ ] Implement `LeverConnector` for public postings ingestion (`api.lever.co`)
- [ ] Implement `SeedJobConnector` with realistic Indian and Global tech jobs (Coimbatore, Bangalore, Remote)
- [ ] Build BullMQ background ingestion queue with error handling and deduplication checks

### Milestone 3: Normalization & Deterministic JD Analyzer
- [ ] Implement `JobNormalizerService` (title normalization, salary range parsing, experience parsing)
- [ ] Implement `JobDeduplicationService` with SHA-256 content hashing to eliminate duplicate listings
- [ ] Implement `JdAnalyzerService` for deterministic requirements parsing (skills, seniority, responsibilities)
- [ ] Implement `JobSnapshotService` capturing immutable raw and cleaned job descriptions
- [ ] Write unit tests for normalizer, deduplication, and JD analyzer (`apps/api/test/jd-analyzer.spec.ts`)

### Milestone 4: Backend API Modules (NestJS)
- [ ] **Jobs Module**:
  - [ ] `GET /api/v1/jobs`: Filtered search (keywords, location, radius, freshness, work mode, salary)
  - [ ] `GET /api/v1/jobs/:id`: Retrieve single job details with parsed analysis
  - [ ] `GET /api/v1/jobs/:id/snapshot`: Retrieve immutable snapshot and content hash
  - [ ] `POST /api/v1/jobs/ingest`: Trigger connector sync or manual job intake
- [ ] **Companies Module**:
  - [ ] `GET /api/v1/companies`: List hiring companies with active job counts and latest posting
  - [ ] `GET /api/v1/companies/:id`: Company details with associated active jobs
  - [ ] `GET /api/v1/companies/:id/jobs`: Paginated open jobs for a specific company
- [ ] Write integration tests for Jobs and Companies endpoints (`apps/api/test/jobs.service.spec.ts`)

### Milestone 5: Frontend Web Screens (Next.js 16)
- [ ] Build `/jobs` Recent Job Discovery screen:
  - [ ] Freshness filter pills (`Last 24 hours`, `Last 3 days`, `Last 7 days`, `Last 30 days`)
  - [ ] Location input with radius selector (10km, 25km, 50km, 100km)
  - [ ] Work mode toggles (`Remote`, `Hybrid`, `Onsite`)
  - [ ] Salary range slider and search query bar
  - [ ] Interactive job cards with matched skills tags
  - [ ] Quick-preview side drawer with "View Full Details" CTA
- [ ] Build `/companies` Companies Hiring Now screen:
  - [ ] Company cards with logo, active openings count, latest posting time, and hiring velocity
  - [ ] Industry and location filters
  - [ ] Company profile view with list of current openings
- [ ] Build `/jobs/[id]` Job Details & JD Inspector:
  - [ ] Full job details header with apply button
  - [ ] Structured skills, responsibilities, and qualifications breakdown
  - [ ] Immutable JD snapshot viewer modal
  - [ ] Match readiness indicator preview (linking to candidate verified evidence)
- [ ] Update `/dashboard` with Recent Job recommendations and Top Hiring Companies widgets

### Milestone 6: Verification & Quality Assurance
- [ ] Execute `pnpm run typecheck` across all 4 monorepo workspaces (0 errors)
- [ ] Execute `pnpm run lint` across monorepo (0 errors)
- [ ] Execute `pnpm --filter api test` (all unit and integration tests passing)
- [ ] Verify live endpoints on `http://localhost:1961/api/docs`
- [ ] Verify live web UI on `http://localhost:1962/jobs` and `http://localhost:1962/companies`
- [ ] Commit completed Phase 3 to Git repository
