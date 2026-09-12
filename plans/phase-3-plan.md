# AI Career OS — Phase 3: Job Discovery & Market Radar Plan

## 1. Executive Summary & Objective

Phase 3 builds the job ingestion, intelligence, and discovery engine for **AI Career OS**:
1. **Pluggable Job Discovery Connectors**: Standardized, rate-limited connector SDK connecting official APIs, public ATS feeds (Greenhouse, Lever), company career pages, and public job aggregators without bypassing bot protections.
2. **Location Intelligence Engine**: Geographic search allowing candidates to discover opportunities by city, region, multi-location presets, radius (e.g., 50km from Coimbatore or Bangalore), and work modes (Remote, Hybrid, On-site).
3. **Job Normalization & Deduplication Pipeline**: Multi-source normalization pipeline that standardizes titles, extracts structured compensation ranges, resolves canonical companies, and eliminates cross-board duplicate postings using cryptographic content hashes (`SHA-256`).
4. **Immutable JD Snapshotting & Deterministic JD Analysis**: Captures immutable snapshots of job postings used in matching and application preparation. Extracts required/preferred skills, seniority, responsibilities, and qualifications deterministically with zero mandatory LLM costs.
5. **pgvector & Hybrid Semantic Search Engine**: Utilizes PostgreSQL 16 + `pgvector` for vector embeddings combined with full-text search (`tsvector` / `pg_trgm`) to enable semantic search across hundreds of jobs.
6. **Frontend Experience**:
   - **Recent Job Discovery Screen** (`/jobs`): Modern job feed with freshness filters (last 24 hours, 3 days, 7 days, 30 days), location radius sliders, salary filters, and quick-preview drawer.
   - **Companies Hiring Now Screen** (`/companies`): Company directory showing active hiring counts, latest postings, hiring trends, and direct careers links.
   - **Job Details & JD Inspector** (`/jobs/[id]`): Detailed role view with immutable snapshot viewer, structured requirements breakdown, and matching readiness preview.

---

## 2. Architecture & Service Ports

The Phase 3 services operate within our Turborepo monorepo:

```text
                                +-----------------------------+
                                |  Next.js 16 Web (Port 1962)  |
                                |  /jobs, /companies, /jobs/:id|
                                +--------------+--------------+
                                               |
                                        REST / Axios Client
                                               |
                                +--------------v--------------+
                                |  NestJS 12 API (Port 1961)  |
                                |  JobDiscovery, Normalizer,   |
                                |  Connectors, JD Analyzer    |
                                +--------------+--------------+
                                               |
                     +-------------------------+-------------------------+
                     |                         |                         |
          +----------v----------+   +----------v----------+   +----------v----------+
          | PostgreSQL 16 (5433)|   | Redis 7 Cache (6379)|   | MinIO S3 (9000/9001)|
          | pgvector + Jobs     |   | BullMQ Job Sync     |   | Bucket: "jd-snapshots|
          +---------------------+   +---------------------+   +---------------------+
```

| Service | Host Port | Internal Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | `1962` | `1962` | HTTP | Client app (`/jobs`, `/companies`, `/jobs/:id`) |
| **Backend API** | `1961` | `1961` | HTTP | Job search, normalization, connectors, Swagger docs |
| **PostgreSQL 16** | `5433` | `5432` | TCP | `Company`, `Job`, `JobSnapshot` tables + `pgvector` indexes |
| **Redis 7** | `6379` | `6379` | TCP | Connector rate limiting, job deduplication cache, BullMQ queue |
| **MinIO S3** | `9000/9001` | `9000/9001` | HTTP | Raw JD archive & snapshot storage |

---

## 3. Detailed Component Specifications

### 3.1 Pluggable Job Connector Architecture (`packages/connector-sdk` & `apps/api/src/connectors`)
- **Philosophy**: Extensible connector pattern respecting platform rate limits, robots.txt, and public APIs.
- **Base Connector Interface**:
  ```typescript
  export interface JobConnector {
    readonly id: string;
    readonly name: string;
    readonly capabilities: ConnectorCapability[];
    searchJobs(input: JobSearchInput): Promise<JobSearchResult>;
    getJobDetails(id: string): Promise<JobDetails>;
    fetchCompanyJobs(companyIdentifier: string): Promise<JobDetails[]>;
  }

  export enum ConnectorCapability {
    JOB_SEARCH = 'JOB_SEARCH',
    JOB_DETAILS = 'JOB_DETAILS',
    COMPANY_JOBS = 'COMPANY_JOBS',
    RAW_JD_CAPTURE = 'RAW_JD_CAPTURE',
  }
  ```
- **Supported Initial Connectors**:
  1. **Greenhouse Public Board Connector**: Ingests public job listings from `boards-api.greenhouse.io/v1/boards/{company}/jobs`.
  2. **Lever Public Feed Connector**: Ingests public postings from `api.lever.co/v0/postings/{company}`.
  3. **Mock / Seed Connector**: Seed dataset of realistic tech jobs across India and global remote markets (Coimbatore, Bangalore, Hyderabad, Pune, Remote).

### 3.2 Location Intelligence Engine (`apps/api/src/location`)
- **First-Class Dimension**: Location is never a simple string match.
- **Geographic Modeling**:
  - `country`, `state`, `city`, `area`, `latitude`, `longitude`.
  - Radius calculation using Haversine formula (e.g., 25km, 50km, 100km).
  - Multi-location preferences: Allow candidates to specify primary city (e.g., Coimbatore) with secondary regions (Bangalore, Chennai) and Remote.
  - Work Mode matching: `REMOTE`, `HYBRID`, `ONSITE`.

### 3.3 Normalization & Deduplication Pipeline (`apps/api/src/jobs/pipeline`)
- **Job Normalization**:
  - Title standardizer: Maps divergent titles (e.g., "Sr. Software Engr - Backend", "Staff Backend Developer") to canonical taxonomy ("Senior Backend Engineer").
  - Salary normalizer: Parses text strings (e.g., "₹18 - ₹25 LPA", "$140,000 - $170,000 / yr") into structured `{ min, max, currency, period }`.
  - Experience years parser: Regex extraction of `X+ years`, `X-Y years` into integer ranges.
- **Cryptographic Deduplication**:
  - Generates SHA-256 hash from `normalize(company) + normalize(title) + normalize(location) + cleanBody(description)`.
  - If a job with identical content hash or `(source, source_job_id)` exists within 30 days, update `last_seen_at` without creating a duplicate listing.

### 3.4 Immutable JD Snapshotting & Deterministic JD Analysis (`apps/api/src/jd-analysis`)
- **Immutable Snapshot**:
  - Every job used in matching or applications captures an immutable record:
    ```json
    {
      "jobId": "uuid",
      "rawHtml": "...",
      "cleanedText": "...",
      "contentHash": "sha256...",
      "capturedAt": "2026-09-12T...",
      "sourceUrl": "https://..."
    }
    ```
- **Deterministic JD Analysis**:
  - Rule-based parser extracting:
    - Required Skills vs. Preferred / Nice-to-have Skills.
    - Role Seniority (`INTERN`, `JUNIOR`, `MID`, `SENIOR`, `LEAD`, `STAFF`, `PRINCIPAL`).
    - Core Responsibilities list.
    - Education / Degree requirements.
    - Technical keywords and framework tags.

### 3.5 pgvector & Hybrid Search Engine (`apps/api/src/jobs/search`)
- **Vector Embeddings**:
  - `Job` table includes `embedding vector(1536)` (or 384/768 depending on model).
  - pgvector cosine distance index (`HNSW` / `IVFFlat`) for sub-millisecond semantic search.
- **Hybrid Search Strategy**:
  - Combined query:
    1. SQL Filter conditions (Work Mode, Min Salary, Location Radius, Freshness date).
    2. Full-Text Search rank via `to_tsvector('english', title || ' ' || description)`.
    3. Vector cosine similarity rank when semantic embeddings are present.

### 3.6 Frontend User Experience (`apps/web`)

#### 1. Recent Job Discovery (`/jobs`)
- **Freshness Filter Chips**: "Last 24 hours", "Last 3 days", "Last 7 days", "Last 30 days".
- **Search & Filter Bar**: Keyword search, Location input with radius dropdown (10km, 25km, 50km, 100km), Work Mode toggle pills (Remote, Hybrid, Onsite), Minimum Salary slider.
- **Interactive Job Cards**: Company logo, job title, company name, location badge, work mode badge, salary estimate, posted time ago, matched skills count.
- **Quick-Preview Drawer**: Clicking a card opens a slide-over panel showing full job description, parsed skills, key requirements, and a "View Full Details" CTA.

#### 2. Companies Hiring Now (`/companies`)
- **Company Directory Cards**: Company name, logo, industry, headquarters, active open jobs count, latest job posting time, top matching roles.
- **Hiring Velocity Metric**: Visual badge showing high hiring activity (e.g. "5 new jobs this week").
- **Direct Careers Link**: Links to official company careers page and internal company profile view.

#### 3. Job Details & JD Inspector (`/jobs/[id]`)
- **Hero Header**: Title, company, location, salary, date posted, apply source badge.
- **Structured Requirements Breakdown**:
  - Required Skills (badges).
  - Preferred Skills (badges).
  - Key Responsibilities (bullet list).
  - Minimum Experience & Education.
- **Immutable Snapshot Inspector**: Toggle to inspect the raw captured job description and verification hash.
- **Match Readiness Preview**: Visual breakdown showing how the candidate's verified evidence links to the job's requirements.

---

## 4. Prisma Relational Schema Extensions

```prisma
model Company {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  domain          String?
  logoUrl         String?
  careersUrl      String?
  description     String?
  headquarters    String?
  employeeCount   String?
  industry        String?
  isHiringNow     Boolean  @default(true)
  activeJobsCount Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  jobs            Job[]

  @@map("companies")
}

model Job {
  id                String          @id @default(uuid())
  companyId         String
  company           Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  title             String
  normalizedTitle   String
  description       String          @db.Text
  rawDescription    String?         @db.Text
  contentHash       String          @db.VarChar(64)
  
  // Location & Work Mode
  location          String
  city              String?
  state             String?
  country           String?         @default("India")
  latitude          Float?
  longitude         Float?
  workMode          WorkMode        @default(HYBRID)
  employmentType    EmploymentType  @default(FULL_TIME)
  seniority         SeniorityLevel  @default(MID)
  
  // Compensation
  salaryMin         Float?
  salaryMax         Float?
  salaryCurrency    String?         @default("INR")
  salaryPeriod      String?         @default("YEARLY")
  
  // Analysis & Skills
  requiredSkills    String[]        @default([])
  preferredSkills   String[]        @default([])
  responsibilities  String[]        @default([])
  experienceMinYears Int?           @default(0)
  experienceMaxYears Int?
  
  // Metadata & Timestamps
  source            String          @default("INTERNAL") // GREENHOUSE, LEVER, MANUAL, etc.
  sourceJobId       String?
  sourceUrl         String?
  applicationUrl    String?
  status            String          @default("ACTIVE") // ACTIVE, EXPIRED, ARCHIVED
  postedAt          DateTime        @default(now())
  firstSeenAt       DateTime        @default(now())
  lastSeenAt        DateTime        @default(now())
  
  // Relations
  snapshots         JobSnapshot[]

  @@unique([source, sourceJobId])
  @@index([normalizedTitle])
  @@index([city, workMode])
  @@index([postedAt])
  @@index([contentHash])
  @@map("jobs")
}

model JobSnapshot {
  id          String   @id @default(uuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  rawHtml     String?  @db.Text
  cleanedText String   @db.Text
  contentHash String   @db.VarChar(64)
  capturedAt  DateTime @default(now())
  sourceUrl   String?

  @@index([jobId])
  @@map("job_snapshots")
}
```

---

## 5. Implementation Milestones

### Milestone 1: Data Contracts & Database Schema
- [ ] Extend `@career-os/types` with `Job`, `Company`, `JobSnapshot`, `JobSearchFilter`, `JobDetails`, `SalaryInfo`.
- [ ] Extend `@career-os/schemas` with Zod validation schemas for job querying, connector ingestion, and company filters.
- [ ] Add `Company`, `Job`, and `JobSnapshot` models to `prisma/schema.prisma`.
- [ ] Apply database migrations using `prisma db push` on port `5433`.

### Milestone 2: Connector SDK & Feed Ingestion
- [ ] Build `JobConnector` abstract class and capability registry.
- [ ] Implement `GreenhouseConnector` for public job boards.
- [ ] Implement `LeverConnector` for public postings.
- [ ] Implement high-quality `MockSeedConnector` for comprehensive local testing with real tech roles.
- [ ] Build BullMQ background ingestion queue with configurable sync schedules.

### Milestone 3: Normalization & Deterministic JD Analyzer
- [ ] Build `JobNormalizerService` for title standardization, salary parsing, and experience extraction.
- [ ] Build `JobDeduplicationService` with SHA-256 content hashing.
- [ ] Build `JdAnalyzerService` for deterministic requirement extraction (skills, seniority, responsibilities).
- [ ] Build `JobSnapshotService` storing immutable snapshots upon job ingestion.

### Milestone 4: Backend Search & Jobs API
- [ ] Implement `JobsService` with multi-facet filtering (location, radius, freshness, salary, work mode, skills).
- [ ] Implement `JobsController`:
  - `GET /api/v1/jobs`: Filtered job search with pagination and freshness filters.
  - `GET /api/v1/jobs/:id`: Single job details with parsed analysis and snapshot.
  - `POST /api/v1/jobs/ingest`: Manual / webhook job ingestion endpoint.
- [ ] Implement `CompaniesService` and `CompaniesController`:
  - `GET /api/v1/companies`: Companies hiring now with active opening counts and hiring velocity.
  - `GET /api/v1/companies/:id`: Company profile and associated open jobs.

### Milestone 5: Frontend UI Screens (`apps/web`)
- [ ] Build `/jobs` Recent Job Discovery screen with freshness tabs (24h, 3d, 7d, 30d), location radius slider, work mode filters, and quick-preview drawer.
- [ ] Build `/companies` Companies Hiring Now screen with company cards, hiring velocity badges, and active role listings.
- [ ] Build `/jobs/[id]` Job Details & JD Inspector view with structured requirements, immutable snapshot viewer, and match readiness indicator.
- [ ] Update main dashboard (`/dashboard`) with "Recent Jobs For You" and "Top Companies Hiring" summary widgets.

### Milestone 6: Verification, Testing & QA
- [ ] Unit tests for `JobNormalizerService`, `JobDeduplicationService`, and `JdAnalyzerService`.
- [ ] Integration tests for `JobsService` and `CompaniesService`.
- [ ] End-to-end verification of `/jobs`, `/companies`, and `/jobs/[id]` on port `1962`.
- [ ] Typecheck pass across all workspaces (`pnpm run typecheck`).
- [ ] Linting pass with 0 errors (`oxlint src/ test/`).
- [ ] Document Phase 3 completion and commit to repository.
