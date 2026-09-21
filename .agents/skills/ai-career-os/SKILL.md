---
name: ai-career-os
description: "Architecture, environment, and development conventions for the AI Career OS platform"
risk: none
source: workspace
date_added: "2026-09-12"
last_updated: "2026-09-21"
---

# AI Career OS — Platform Standards & Conventions

This skill provides persistent knowledge and guidelines for developing and maintaining the **AI Career OS** platform.

---

## 1. Core Principles
- **Evidence-Backed**: Every application, resume highlight, or claim must link to a verified evidence item with an evidence ID.
- **Zero-Hallucination Invariant**: Tailored bullet points, skills, and metrics must be strictly bound to verified candidate evidence claims.
- **Deterministic Baseline**: Core workflows (resume parsing, JD analysis, ATS scoring, tailoring) must work reliably without an mandatory LLM token cost. AI is a progressive enhancement.
- **Platform Compliance**: Respect rate limits, anti-bot protections, and terms of service. Never bypass CAPTCHAs, login walls, or platform security mechanisms.
- **Privacy First**: Candidate documents and data are owned strictly by the user.

---

## 2. Infrastructure & Port Standards

Always use the designated ports to avoid conflicts:

| Service | Host Port | Internal Port | Environment Variable | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API (NestJS)** | `1961` | `1961` | `PORT=1961`, `API_PORT=1961` | Swagger: `http://localhost:1961/api/docs` |
| **Frontend Web (Next.js)** | `1962` | `1962` | `PORT=1962` | Web: `http://localhost:1962` |
| **PostgreSQL 16 + pgvector** | `5433` | `5432` | `DATABASE_URL` | Mapped to 5433 on host to prevent conflicts |
| **Redis 7** | `6379` | `6379` | `REDIS_URL` | BullMQ queues and token blacklists |
| **MinIO S3 API** | `9000` | `9000` | `S3_ENDPOINT` | Document storage (bucket: `career-os-files`) |
| **MinIO Web Console** | `9001` | `9001` | — | Web UI for object inspection |

---

## 3. Project Structure
- `apps/api`: NestJS 12, Prisma ORM, Passport/JWT, BullMQ, Pino logging.
  - `src/auth`: Authentication, JWT strategy, `@CurrentUser('id')` decorator.
  - `src/users`: User management & profile inspection (`/api/v1/users/me`).
  - `src/profile`: Candidate profile health scoring (0-100%).
  - `src/evidence`: Evidence ledger and file attachment management.
  - `src/connectors`: Job board ingestion SDK (Greenhouse, Lever, Seed feeds).
  - `src/jobs`: Job pipeline, normalization, deduplication, search API.
  - `src/jd-analysis`: Deterministic JD requirements & seniority extraction.
  - `src/companies`: Company directory & active hiring intelligence.
  - `src/resumes`: Resume management, ATS scoring, tailoring, diffing, export.
    - `ats-scorer`: 5-factor deterministic ATS score engine.
    - `tailoring`: Evidence-backed bullet re-ranking and summary synthesis.
    - `diff`: Section and bullet structural diff engine.
    - `export`: Semantic ATS HTML (print CSS) and ASCII text generators.
- `apps/web`: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, TanStack Query.
  - `src/app/(auth)`: `/login`, `/signup`.
  - `src/app/(app)`:
    - `/dashboard`: Mission Control with radar metrics & tailoring launch banner.
    - `/onboarding`: 6-step guided profile setup wizard.
    - `/profile`: Profile Hub & Completeness Health Scorecard.
    - `/profile/evidence`: Verified Evidence Ledger.
    - `/role-profiles`: Target Role Profiles configuration.
    - `/jobs`: Job Radar discovery with instant filter drawer.
    - `/jobs/[id]`: Job details, candidate match readiness, Tailor CTA.
    - `/companies`: Verified hiring employers directory.
    - `/resumes`: Resume Hub & Lineage (master resumes vs tailored variants).
    - `/resumes/tailor`: 4-step interactive Tailoring Studio.
    - `/resumes/[id]`: Variant Document preview, ATS Audit Scorecard, visual diff.
- `packages/types`: Shared domain interfaces, AST types, and enums (`@career-os/types`).
- `packages/schemas`: Shared Zod validation schemas and inferred DTOs (`@career-os/schemas`).
- `plans/`: Architectural blueprints, phase plans, and task trackers.

---

## 4. Key Development Commands
```bash
# Start Docker containers (PostgreSQL on 5433, Redis 6379, MinIO 9000/9001)
docker compose up -d

# Rebuild API container with automatic schema synchronization
docker compose build api && docker compose up -d api

# Database schema management (Host to Docker Postgres on 5433)
pnpm -F api exec prisma db push      # Push schema directly to database
pnpm -F api exec prisma generate     # Regenerate Prisma Client

# Monorepo execution
pnpm run typecheck                   # Typecheck all 4 packages (API, Web, Types, Schemas)
pnpm run lint                        # Lint across API (oxlint) and Web (eslint)
pnpm run build                       # Build all packages and applications
pnpm --filter api test               # Run all 50 backend unit and integration tests
```

---

## 5. Architectural Patterns & Conventions
- **Standardized Response Envelope**: Always return `{ success: boolean, data: T, timestamp: string, traceId: string }`.
- **Standardized Error Envelope**: Unhandled exceptions caught by `AllExceptionsFilter` returning RFC-standard envelopes with unique trace IDs.
- **Authentication**: JWT access token (15m) + refresh token rotation (7 days). Use `@Public()` for public routes. Use `@CurrentUser('id')` to extract authenticated user's string UUID.
- **Automatic Container Schema Sync**: `apps/api/package.json` specifies `"start:prod": "prisma db push --skip-generate && node dist/main.js"`, ensuring PostgreSQL tables are always synchronized upon container start.

---

## 6. Implementation Milestones Progress

- **Phase 1: Foundation & Architecture (COMPLETED & VERIFIED)**
  - Monorepo structure (pnpm + Turbo), `@career-os/types`, `@career-os/schemas`.
  - NestJS 12 API on port `1961` with AuthModule, UsersModule, HealthModule, Pino logger.
  - Next.js 16 Web on port `1962` with Tailwind CSS v4, dark glassmorphism design.
  - Docker Compose: PostgreSQL 16 on `5433`, Redis 7 on `6379`, MinIO on `9000/9001`.
  - Detailed specs: `plans/phase-1-plan.md` & `plans/phase-1-tasks.md`.

- **Phase 2: Profile & Evidence Engine (COMPLETED & VERIFIED)**
  - Deterministic Resume Parser (rule-based PDF/DOCX text extraction, 500+ skill dictionary matcher).
  - Candidate Profile Engine with 0–100% Health Score calculator.
  - Candidate Evidence Ledger (claims, status tracking, source links, verification actions).
  - Target Role Profiles Manager (multiple job target presets with primary role toggle).
  - Frontend: `/onboarding`, `/profile`, `/profile/evidence`, `/role-profiles`.
  - Detailed specs: `plans/phase-2-plan.md` & `plans/phase-2-tasks.md`.

- **Phase 3: Job Discovery & Market Radar (COMPLETED & VERIFIED)**
  - Ingestion Connectors SDK (Greenhouse, Lever, Seed feeds with scheduling).
  - Job Normalization & Deduplication Pipeline (SHA-256 content hashing, canonical company names, salary parsing).
  - Deterministic Job Description Analyzer (skill extraction, required vs preferred categorization, seniority classification).
  - Frontend: Job Radar discovery (`/jobs`), Job Details & JD Inspector (`/jobs/[id]`), Hiring Companies directory (`/companies`).
  - Detailed specs: `plans/phase-3-plan.md` & `plans/phase-3-tasks.md`.

- **Phase 4: Resume Tailoring & Version Control Engine (COMPLETED & VERIFIED)**
  - Deterministic ATS Scorer: 5-factor weighted score (35% required, 15% preferred, 20% experience, 15% impact, 15% formatting).
  - Zero-Hallucination Tailoring Pipeline: Evidence re-ranking, bullet re-ordering, core skill promotion, and summary synthesis.
  - Structural Diff Engine: Granular section and bullet diffing between base and tailored ASTs.
  - Semantic Exporter: Clean, printable ATS HTML with print stylesheets and plain-text ASCII resume outputs.
  - Frontend: Resume Hub (`/resumes`), 4-step Tailoring Studio (`/resumes/tailor`), Variant & ATS Audit Inspector (`/resumes/[id]`), Direct CTA from `/jobs/[id]`.
  - Detailed specs: `plans/phase-4-plan.md` & `plans/phase-4-tasks.md`.

- **Phase 5: Application Engine & Submission Automation (NEXT UP)**
  - Application lifecycle state machine (Draft, Ready, Submitted, Interview, Offer, Rejected).
  - Auto-fill and form automation engine with user consent gates.
  - Submission tracking with verification screenshots and receipts.
  - Status polling & outcome monitoring.
