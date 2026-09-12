# AI Career OS — Phase 2: Profile & Evidence Engine Plan

## 1. Executive Summary & Objective

Phase 2 builds the core identity and differentiation layer of **AI Career OS**:
1. **Candidate Profile Engine**: High-fidelity structured representation of the candidate across personal, professional, technical, and preference dimensions with a deterministic 0–100% Health Score.
2. **Candidate Evidence Ledger**: First-class verification engine linking every skill, project, and achievement to concrete proof (resume citations, GitHub repos, certifications, URLs), enforcing the rule: *No unverified claims*.
3. **Deterministic Resume Parser**: Native, rule-based PDF/DOCX ingestion and section segmentation engine that operates reliably with **zero LLM dependencies** (baseline deterministic principle).
4. **Target Role Profiles**: Multi-role configuration enabling candidates to customize skills, salary expectations, seniority, and locations across multiple distinct job targets (e.g., Backend Engineer vs. DevOps Engineer).
5. **Interactive Frontend**: 6-step Onboarding Wizard (`/onboarding`), Profile Management Hub (`/profile`), Evidence Ledger (`/profile/evidence`), and Role Profiles Manager (`/role-profiles`).

---

## 2. Architecture & Service Ports

The architecture operates in our Turborepo monorepo with custom network configuration:

```text
                                +-----------------------------+
                                |  Next.js 16 Web (Port 1962)  |
                                |  Tailwind CSS v4 + shadcn   |
                                +--------------+--------------+
                                               |
                                        REST / Axios Client
                                               |
                                +--------------v--------------+
                                |  NestJS 12 API (Port 1961)  |
                                +--------------+--------------+
                                               |
                     +-------------------------+-------------------------+
                     |                         |                         |
          +----------v----------+   +----------v----------+   +----------v----------+
          | PostgreSQL 16 (5433)|   | Redis 7 Cache (6379)|   | MinIO S3 (9000/9001)|
          | Prisma ORM + pgvect |   | BullMQ Queues       |   | Bucket: "resumes"   |
          +---------------------+   +---------------------+   +---------------------+
```

| Service | Internal Port | Host Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | `1962` | `1962` | HTTP | Client application (`/onboarding`, `/profile`, `/role-profiles`) |
| **Backend API** | `1961` | `1961` | HTTP | Core REST endpoints & Swagger (`/api/v1`, `/api/docs`) |
| **PostgreSQL 16** | `5432` | `5433` | TCP | Relational storage & vector embeddings (`career_os_db`) |
| **Redis 7** | `6379` | `6379` | TCP | Session caching & parsing job queues |
| **MinIO S3 API** | `9000` | `9000` | HTTP | Resume raw files storage (`resumes` bucket) |
| **MinIO Console** | `9001` | `9001` | HTTP | S3 object management web dashboard |

---

## 3. Detailed Component Specifications

### 3.1 Deterministic Resume Parser Engine (`packages/resume-engine` or `apps/api/src/modules/resume-parser`)
- **Philosophy**: Must parse structured PDF and DOCX files without requiring an external AI API call or paid LLM tokens.
- **Extractor**:
  - `pdf-parse` / native stream extractor for PDF files.
  - `mammoth` for DOCX files.
- **Rule-Based Segmentation Pipeline**:
  1. **Header / Contact Extractor**: Regex patterns for email (`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`), phone numbers (E.164 and localized formats), LinkedIn URL, GitHub URL, portfolio URL.
  2. **Section Heading Classifier**: Case-insensitive keyword matching against common resume headings:
     - `SUMMARY` / `OBJECTIVE` / `ABOUT ME`
     - `EXPERIENCE` / `WORK HISTORY` / `EMPLOYMENT`
     - `SKILLS` / `TECHNICAL SKILLS` / `CORE COMPETENCIES`
     - `EDUCATION` / `ACADEMIC BACKGROUND`
     - `PROJECTS` / `PERSONAL PROJECTS`
     - `CERTIFICATIONS` / `LICENSES`
  3. **Experience Block Parser**: Date range matcher (`(Jan|Feb|...|Present) \d{4} - (Jan|Feb|...|Present) \d{4}`), company name heuristic, bullet point splitters.
  4. **Skill Dictionary Matcher**: 500+ curated tech terms (TypeScript, Python, Docker, Kubernetes, NestJS, React, AWS, Postgres, Redis, etc.).
  5. **Evidence Candidate Seeding**: For each parsed achievement or experience bullet containing a matched skill, automatically create a draft candidate evidence item with status `UNVERIFIED` / `PENDING`.

### 3.2 Candidate Profile Engine (`apps/api/src/modules/profile`)
- **Data Model Extensions**:
  - `CandidateProfile`: Full personal info, current title, total experience in months, location (city, state, country), remote preferences, salary currency, notice period in days.
  - Deterministic **Health Score Calculation Engine (0–100%)**:
    - **Personal & Contact (20%)**: Name, email, phone, location, LinkedIn link.
    - **Work Experience (25%)**: At least 1 valid work experience block with company and dates.
    - **Skills (20%)**: At least 5 verified/active skills listed.
    - **Education (15%)**: Degree and institution provided.
    - **Evidence Coverage (20%)**: Ratio of verified skills to total claimed skills (rewards evidence verification).
- **API Contracts**:
  - `GET /api/v1/profile/me`: Returns complete profile, health score, and improvement tips.
  - `PUT /api/v1/profile/me`: Upsert profile information with strict Zod validation.
  - `GET /api/v1/profile/health`: Detailed scoring breakdown with missing field checklist.

### 3.3 Candidate Evidence Ledger Engine (`apps/api/src/modules/evidence`)
- **Data Model**:
  - `CandidateEvidence`:
    - `id`: UUID
    - `userId`: UUID
    - `skill`: String (e.g. "PostgreSQL", "Next.js")
    - `category`: String ("TECHNICAL", "PROJECT", "LEADERSHIP", "CERTIFICATION")
    - `title`: String ("Enterprise Machinery Platform")
    - `description`: String ("Engineered real-time telemetry pipeline handling 10k eps")
    - `sourceType`: Enum (`RESUME`, `GITHUB`, `LINKEDIN`, `PORTFOLIO`, `MANUAL`, `CERTIFICATE`)
    - `sourceUrl`: Optional String
    - `status`: Enum (`PENDING`, `VERIFIED`, `REJECTED`)
    - `confidenceScore`: Float (0.00 – 1.00)
    - `verifiedAt`: Optional DateTime
    - `verifierNotes`: Optional String
- **API Contracts**:
  - `GET /api/v1/evidence`: List candidate evidence items with filters (`status`, `skill`, `category`).
  - `POST /api/v1/evidence`: Create a new evidence record.
  - `PATCH /api/v1/evidence/:id`: Update claim or toggle status between `PENDING`, `VERIFIED`, `REJECTED`.
  - `DELETE /api/v1/evidence/:id`: Delete evidence record.
  - `POST /api/v1/evidence/bulk-verify`: Verify multiple pending items in a single action.

### 3.4 Target Role Profiles Engine (`apps/api/src/modules/role-profiles`)
- **Purpose**: Allows candidates to configure multiple distinct search strategies (e.g., "Full Stack Engineer" targeting $120k Remote vs. "DevOps Engineer" targeting $130k Hybrid).
- **Data Model**:
  - `RoleProfile`:
    - `id`: UUID
    - `userId`: UUID
    - `targetTitle`: String
    - `seniorityLevel`: Enum (`ENTRY`, `JUNIOR`, `MID`, `SENIOR`, `LEAD`, `PRINCIPAL`)
    - `requiredSkills`: Array of Strings
    - `preferredSkills`: Array of Strings
    - `targetLocations`: Array of Strings
    - `workModes`: Array of `WorkMode` (`REMOTE`, `HYBRID`, `ONSITE`)
    - `salaryMin`: Optional Decimal
    - `salaryMax`: Optional Decimal
    - `currency`: String (default "USD")
    - `isDefault`: Boolean
- **API Contracts**:
  - `GET /api/v1/role-profiles`: List all role profiles for authenticated user.
  - `POST /api/v1/role-profiles`: Create a new role profile.
  - `GET /api/v1/role-profiles/:id`: Get role profile by ID.
  - `PUT /api/v1/role-profiles/:id`: Update role profile.
  - `DELETE /api/v1/role-profiles/:id`: Delete role profile.
  - `POST /api/v1/role-profiles/:id/set-default`: Set as active primary search profile.

### 3.5 Frontend Experience (`apps/web`)

1. **6-Step Onboarding Wizard (`/onboarding`)**:
   - Step 1: Personal Information & Location (Name, Phone, City, Country, LinkedIn, GitHub).
   - Step 2: Target Role & Seniority (Title, Seniority Level, Work Modes).
   - Step 3: Technical Skills Inventory (Interactive badge tagger with autocomplete).
   - Step 4: Work Experience & Achievements (Dynamic experience form cards).
   - Step 5: Resume Upload & Parsing (Drag & drop PDF/DOCX, instant extraction preview).
   - Step 6: Evidence Verification & Health Summary (Quick verification toggles, initial health score).
2. **Profile Management Hub (`/profile`)**:
   - Visual Profile Health Meter (circular radial score with missing item alerts).
   - Tabbed layout: Overview, Experience, Education, Skills, Preferences.
   - Inline editing with immediate optimistic updates.
3. **Evidence Ledger Viewer (`/profile/evidence`)**:
   - Filter bar: All, Verified, Pending Verification, Rejected.
   - Evidence cards with source badges, claim excerpts, and verification action buttons.
   - "Add Evidence" dialog.
4. **Target Role Profiles Hub (`/role-profiles`)**:
   - Multi-card overview showing active targets.
   - Skill tagger for Required vs. Preferred skills.
   - Salary range slider and work mode checkboxes.

---

## 4. Shared Data Contracts (`packages/schemas` & `packages/types`)

### 4.1 New Enums & Types (`@career-os/types`)
- `EvidenceStatus`: `'PENDING' | 'VERIFIED' | 'REJECTED'`
- `EvidenceSourceType`: `'RESUME' | 'GITHUB' | 'LINKEDIN' | 'PORTFOLIO' | 'MANUAL' | 'CERTIFICATE'`
- `SeniorityLevel`: `'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL'`
- `ParsedResumeData`: Interface covering parsed personal info, experiences, educations, skills, and suggested evidence blocks.

### 4.2 New Zod Schemas (`@career-os/schemas`)
- `CreateEvidenceSchema`, `UpdateEvidenceSchema`, `EvidenceFilterSchema`
- `CreateRoleProfileSchema`, `UpdateRoleProfileSchema`
- `ResumeUploadSchema`, `ParsedResumeSchema`
- `OnboardingStepSchemas` (Steps 1 through 6)

---

## 5. Implementation Sequence & Milestones

```text
Step 1: Data Contracts & Prisma Schema
  ├── Extend Prisma schema (RoleProfile, CandidateEvidence, Resume storage fields)
  ├── Run prisma db push on port 5433
  └── Add Zod schemas and TypeScript interfaces in @career-os/types and @career-os/schemas

Step 2: Deterministic Resume Parser
  ├── Implement rule-based PDF/DOCX parser & regex segmentation
  ├── Implement skill dictionary extraction
  └── Unit test parser with sample resume payloads

Step 3: Backend API Modules (NestJS)
  ├── Create ResumesModule (upload to MinIO, parse, retrieve)
  ├── Create ProfileModule (CRUD + Health Score 0-100% calculation)
  ├── Create EvidenceModule (Ledger CRUD, verification state machine)
  ├── Create RoleProfilesModule (Multi-role CRUD and default toggle)
  └── Unit and integration tests for all 4 new modules

Step 4: Frontend Onboarding Wizard (`/onboarding`)
  ├── Multi-step state machine with step indicators
  ├── Form steps with Zod validation
  └── Real-time resume upload & evidence auto-population

Step 5: Frontend Profile Hub & Evidence Ledger
  ├── Build `/profile` hub with health meter
  ├── Build `/profile/evidence` with verification actions
  └── Build `/role-profiles` multi-target manager

Step 6: End-to-End Verification & Documentation
  ├── Run pnpm run typecheck, pnpm run lint, pnpm test
  ├── Verify live flows on http://localhost:1962 and http://localhost:1961
  └── Update plans/phase-2-tasks.md and workspace skill
```

---

## 6. Verification & Quality Gates

1. **Deterministic Quality**: Resume parsing executes without requiring any OpenAI/Gemini/Ollama API key.
2. **Evidence Integrity**: Health score strictly correlates with verified evidence ratio.
3. **Type Safety**: Zero TypeScript compiler errors across all monorepo workspaces (`pnpm run typecheck`).
4. **Code Quality**: Clean ESLint check (`pnpm run lint`).
5. **Automated Testing**: 100% passing unit tests for Profile, Evidence, and Parser modules (`pnpm test`).
6. **Network Reliability**: API strictly binds to `1961`, Web strictly binds to `1962`, Database strictly connects on `5433`.
