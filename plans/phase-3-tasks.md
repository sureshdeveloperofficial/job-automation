# AI Career OS — Phase 3: Tasks Checklist

## Phase 3: Job Discovery & Market Radar Engine

### Milestone 1: Data Contracts & Database Schema
- [x] Extend `packages/types` with `Job`, `Company`, `JDSnapshot`, `JobSearchFilter`, `JobDetails`, `SalaryInfo`, `SeniorityLevel`, `JobFreshness`
- [x] Extend `packages/schemas` with `JobSearchFilterSchema`, `IngestJobSchema`, `CompanyFilterSchema`, and infer DTOs
- [x] Update `apps/api/prisma/schema.prisma` with `Company`, `Job`, and `JDSnapshot` models and `SeniorityLevel` enum
- [x] Generate Prisma client with `pnpm -F api exec prisma generate` (schema synchronized for offline & online DB)
- [x] Export new contracts from root index files of `@career-os/types` and `@career-os/schemas`

### Milestone 2: Connector SDK & Feed Ingestion
- [x] Create `apps/api/src/connectors/connector.interface.ts` with `JobConnector` abstract class and `RawJobPayload`
- [x] Implement `GreenhouseConnector` for public boards ingestion (`boards-api.greenhouse.io`)
- [x] Implement `LeverConnector` for public postings ingestion (`api.lever.co`)
- [x] Implement `SeedJobConnector` with realistic Indian and Global tech jobs (Coimbatore, Bangalore, Chennai, Hyderabad, Remote)
- [x] Register connectors in `ConnectorsModule` with dependency injection token and automated sync support

### Milestone 3: Normalization & Deterministic JD Analyzer
- [x] Implement `JobNormalizerService` (title canonicalization, INR LPA / USD salary parsing, experience level extraction)
- [x] Implement `JobDeduplicationService` with SHA-256 content hashing to eliminate duplicate listings and touch `lastSeenAt`
- [x] Implement `JdAnalyzerService` for deterministic requirements parsing (skills dictionary matcher, seniority, responsibility bullets)
- [x] Implement `JdSnapshotService` capturing immutable raw and cleaned job descriptions with SHA-256 verification
- [x] Write unit tests for normalizer, deduplication, and JD analyzer (`test/job-normalizer.service.spec.ts`, `test/job-deduplication.service.spec.ts`, `test/jd-analyzer.service.spec.ts` - all passing)

### Milestone 4: Backend API Modules (NestJS)
- [x] **Jobs Module**:
  - [x] `GET /api/v1/jobs`: Multi-faceted search (keywords, location, freshness, work mode, salary, pagination)
  - [x] `GET /api/v1/jobs/:id`: Retrieve single job details with parsed analysis and candidate match readiness
  - [x] `GET /api/v1/jobs/:id/snapshot`: Retrieve immutable snapshot and SHA-256 content hash
  - [x] `POST /api/v1/jobs/ingest`: Manual job intake endpoint with deduplication and snapshot generation
  - [x] `POST /api/v1/jobs/sync`: Trigger automated sync of connector feeds (Seed, Greenhouse, Lever)
- [x] **Companies Module**:
  - [x] `GET /api/v1/companies`: List hiring companies with active job counts, logos, and hiring velocity
  - [x] `GET /api/v1/companies/:id`: Company details with associated active jobs
  - [x] `GET /api/v1/companies/:id/jobs`: Paginated open jobs for a specific company
- [x] Write integration tests for Jobs endpoints (`apps/api/test/jobs.service.spec.ts` - 3/3 passing)

### Milestone 5: Frontend Web Screens (Next.js 16)
- [x] Build `/jobs` Recent Job Discovery screen:
  - [x] Freshness filter pills (`Last 24 hours`, `Last 3 days`, `Last 7 days`, `Last 30 days`, `All`)
  - [x] Location filter input and work mode toggles (`Remote`, `Hybrid`, `Onsite`, `All`)
  - [x] Interactive job cards with salary formatting, location badges, and match tags
  - [x] Quick-preview drawer with full details and direct apply CTA
  - [x] "Sync Tech Feeds" button for on-demand connector syncing
- [x] Build `/companies` Companies Hiring Now screen:
  - [x] Company cards with logos, active openings count, hiring velocity, and headquarters
  - [x] Industry and keyword search filters
  - [x] Links to view open roles per company
- [x] Build `/jobs/[id]` Job Details & JD Inspector:
  - [x] Full job details header with direct application link
  - [x] Candidate match readiness indicator preview with matched skills and gaps
  - [x] Structured skills checklist and responsibilities breakdown
  - [x] Immutable raw JD snapshot viewer with SHA-256 hash copy button
- [x] Update `/dashboard` with Market Radar Highlights and Top Hiring Companies widgets

### Milestone 6: Verification & Quality Assurance
- [x] Execute `pnpm run typecheck` across all 4 monorepo workspaces (0 errors)
- [x] Execute `pnpm run lint` across monorepo (0 errors)
- [x] Execute `pnpm --filter api test` (all 11 test suites and 41 tests passing)
- [x] Document Phase 3 deliverables, architecture, and verification in `walkthrough.md`
- [x] Commit completed Phase 3 to Git repository
