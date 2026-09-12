---
name: ai-career-os
description: "Architecture, environment, and development conventions for the AI Career OS platform"
risk: none
source: workspace
date_added: "2026-09-12"
---

# AI Career OS — Platform Standards & Conventions

This skill provides persistent knowledge and guidelines for developing and maintaining the **AI Career OS** platform.

---

## 1. Core Principles
- **Evidence-Backed**: Every application, resume highlight, or claim must link to a verified evidence item with an evidence ID.
- **Deterministic Baseline**: Core workflows (resume parsing, job matching, ATS validation, scoring) must work reliably without an LLM. AI is a progressive enhancement.
- **Platform Compliance**: Respect rate limits, anti-bot protections, and terms of service. Never bypass CAPTCHAs, login walls, or platform security mechanisms.
- **Privacy First**: Candidate documents and data are owned strictly by the user.

---

## 2. Infrastructure & Port Standards

Always use the designated ports to avoid conflicts:

| Service | Host Port | Internal Port | Environment Variable | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API (NestJS)** | `1961` | `1961` | `PORT=1961`, `API_PORT=1961` | Swagger: `http://localhost:1961/api/docs` |
| **Frontend Web (Next.js)** | `1962` | `1962` | `PORT=1962` | Web: `http://localhost:1962` |
| **PostgreSQL 16 + pgvector** | `5433` | `5432` | `DATABASE_URL` | Mapped to 5433 to avoid local Windows Postgres |
| **Redis 7** | `6379` | `6379` | `REDIS_URL` | BullMQ queues and token blacklists |
| **MinIO S3 API** | `9000` | `9000` | `S3_ENDPOINT` | Document storage (bucket: `career-os-files`) |
| **MinIO Web Console** | `9001` | `9001` | — | Web UI for object inspection |

---

## 3. Project Structure
- `apps/api`: NestJS 12, Prisma ORM, Passport/JWT, BullMQ, Pino logging.
- `apps/web`: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, TanStack Query.
- `packages/types`: Shared domain interfaces and enums (`@career-os/types`).
- `packages/schemas`: Shared Zod validation schemas and DTOs (`@career-os/schemas`).
- `plans/`: Archived plans and task trackers for past and upcoming phases.

---

## 4. Key Development Commands
```bash
# Start Docker containers (PostgreSQL on 5433, Redis 6379, MinIO 9000/9001)
docker compose up -d

# Database schema management
pnpm run db:generate    # Regenerate Prisma Client
pnpm -F api run prisma:migrate  # Run migration in dev
pnpm -F api exec prisma db push # Push schema directly to database

# Monorepo execution
pnpm run typecheck      # Typecheck all packages
pnpm run lint           # Lint across API and Web
pnpm run build          # Build all apps and packages
pnpm --filter api test  # Run backend unit tests
```

---

## 5. Architectural Patterns
- **Response Format**: Always wrap API responses in `{ success: boolean, data: T, timestamp: string, traceId: string }`.
- **Error Format**: Always return standardized JSON error envelopes with trace IDs via `AllExceptionsFilter`.
- **Authentication**: JWT access token (15m) + refresh token rotation (7 days) with revocation check in DB. Use `@Public()` for unauthenticated routes.

---

- **Phase 1: Foundation (COMPLETED & VERIFIED)**
  - Monorepo structure (pnpm + Turbo), `@career-os/types`, `@career-os/schemas`.
  - NestJS 12 API on port `1961` with AuthModule (JWT + refresh token rotation), UsersModule, HealthModule, Pino logger, RFC-compliant exceptions filter.
  - Next.js 16 Web on port `1962` with Tailwind CSS v4, dark glassmorphism design, `/login`, `/signup`, `/dashboard`, typed API client with auto 401 token refresh queue.
  - Docker Compose: PostgreSQL 16 on `5433`, Redis 7 on `6379`, MinIO on `9000/9001`.
  - Detailed specs: `plans/phase-1-plan.md` & `plans/phase-1-tasks.md`.

- **Phase 2: Profile & Evidence Engine (COMPLETED & VERIFIED)**
  - Deterministic Resume Parser (rule-based PDF/DOCX text extraction, 500+ skill dictionary matcher, contact regexes, zero LLM dependency).
  - Candidate Profile Engine with 0–100% Health Score calculator and completeness breakdown.
  - Candidate Evidence Ledger (claims, status tracking, source links, verification actions).
  - Target Role Profiles Manager (multiple job target presets with primary role toggle).
  - MinIO S3 document integration for resume storage and file downloads.
  - Frontend: 6-step Onboarding Wizard (`/onboarding`), Profile Hub (`/profile`), Evidence Ledger (`/profile/evidence`), and Target Role Profiles (`/role-profiles`).
  - Detailed specs: `plans/phase-2-plan.md` & `plans/phase-2-tasks.md`.

- **Phase 3: Job Discovery & Market Radar (NEXT UP)**
  - Multi-source Job Ingestion Connectors (Greenhouse, Lever, Workday, LinkedIn, Indeed).
  - Job Normalization & Deduplication Pipeline (canonical company, location, salary parsing).
  - Vector Embeddings & Hybrid Search (`pgvector` cosine similarity + full-text search).
  - Market Salary Intelligence & Role Trends radar.

