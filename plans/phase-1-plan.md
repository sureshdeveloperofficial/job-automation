# AI Career OS — Phase 1: Foundation Plan & Architecture Specification

## 1. Overview & Objective
Phase 1 establishes the foundational infrastructure, monorepo setup, shared data contracts, authentication flow, and initial user interface for **AI Career OS**.

- **Goal**: Provide a clean, robust, type-safe development environment ready to power downstream modules (Resume Parsing, Evidence Ledger, Job Connectors, ATS Matching, Application Automation).
- **Core Principle**: Factual evidence-based applications, deterministic fallbacks without mandatory LLMs, strict platform compliance, and progressive enhancement.

---

## 2. Monorepo Architecture

Managed via **pnpm workspaces** and **Turborepo**:

```text
job-automation/
├── apps/
│   ├── api/          # NestJS 12 REST API (Port: 1961)
│   │   ├── prisma/   # Relational schema + migrations (PostgreSQL 16 + pgvector)
│   │   ├── src/      # Auth, Users, Health, Common (guards, filters, interceptors)
│   │   └── test/     # Vitest unit and integration suites
│   └── web/          # Next.js 16 App Router (Port: 1962)
│       ├── src/app/  # Routes: / (redirect), /login, /signup, /dashboard
│       ├── src/components/ # shadcn/ui components & theme providers
│       ├── src/contexts/   # AuthProvider & session management
│       └── src/lib/        # Typed API client with auto 401 token refresh queue
├── packages/
│   ├── types/        # Domain enums & TypeScript entity interfaces (@career-os/types)
│   └── schemas/      # Shared Zod validation schemas & inferred DTOs (@career-os/schemas)
├── infrastructure/
│   └── docker/postgres/init.sql # Database extensions (vector, uuid-ossp, pg_trgm)
├── docker-compose.yml# Containerized services (Postgres on 5433, Redis 6379, MinIO 9000/9001)
├── plans/            # Project phase plans and progress tracking
├── .env.example      # Environment variables template
└── README.md         # Developer documentation
```

---

## 3. Network Ports & Services Mapping

| Service | Internal Port | Host Port | Protocol / Path | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (Next.js)** | `1962` | `1962` | HTTP (`/login`, `/signup`, `/dashboard`) | Client web app |
| **Backend (NestJS)** | `1961` | `1961` | HTTP (`/api/v1`, `/api/docs`) | Business logic & API |
| **PostgreSQL 16 + pgvector** | `5432` | `5433` | TCP (`career_os_db`) | Primary database |
| **Redis 7** | `6379` | `6379` | TCP | Queues & caching |
| **MinIO S3 API** | `9000` | `9000` | HTTP / S3 API | Object storage |
| **MinIO Console** | `9001` | `9001` | HTTP | Storage web console |

---

## 4. Key Components Delivered

### 4.1 Shared Packages
- **`@career-os/types`**:
  - Domain enums: `UserRole`, `WorkMode`, `EmploymentType`, `ApplicationState`, `ResumeType`, `SkillGapLevel`, `SkillGapPriority`, `ApplicationEventType`, `NotificationType`, `InterviewType`.
  - Type definitions for `User`, `CandidateProfile`, `CandidateEvidence`, `RoleProfile`, `Resume`, `Job`, `Application`.
- **`@career-os/schemas`**:
  - Validation schemas for `SignUpSchema`, `SignInSchema`, `RefreshTokenSchema`, `UpdateCandidateProfileSchema`, `CreateRoleProfileSchema`, `JobSearchSchema`, `CreateEvidenceSchema`.

### 4.2 Backend (NestJS 12 API)
- **Database (Prisma)**: Complete relational schema with UUID primary keys and vector search support.
- **Authentication**:
  - Password hashing via `bcrypt` (12 rounds).
  - Access tokens (JWT, 15m expiry) + refresh tokens (UUID, 7-day expiry with rotation and revocation).
  - Global `JwtAuthGuard` with `@Public()` decorator.
  - Endpoints: `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- **Users**: `GET /users/me` with profile and health score data.
- **Health**: `GET /health` with live database connectivity verification.
- **Pino Structured Logging**: `nestjs-pino` with pretty formatting in dev.
- **Standardized Responses & Errors**:
  - `ResponseInterceptor` wrapping success payloads (`success: true`, `data`, `traceId`, `timestamp`).
  - `AllExceptionsFilter` formatting RFC-compliant error envelopes (`success: false`, `message`, `errors`, `traceId`).
- **OpenAPI**: Swagger UI available at `http://localhost:1961/api/docs`.

### 4.3 Frontend (Next.js 16 Web App)
- **Design System**: Tailwind CSS v4 dark glassmorphism theme, typography tokens, and micro-animations.
- **UI Components**: `shadcn/ui` base suite (`Button`, `Input`, `Label`, `Card`, `Badge`, `Skeleton`, `Toast`).
- **API Client**: Axios instance with automatic token attachment and 401 retry queue with transparent refresh.
- **Pages**:
  - `/login`: Form validation, password visibility toggle, server error alerts.
  - `/signup`: Real-time password requirement checklist (length, uppercase, number).
  - `/dashboard`: Authenticated shell with sidebar navigation, KPI cards, and empty-state onboarding CTA.

---

## 5. Verification Results
- **Typecheck**: `pnpm run typecheck` passed (0 errors across 4 packages).
- **Lint**: `pnpm run lint` passed (0 errors, 1 non-blocking React compiler warning).
- **Build**: `pnpm run build` passed (Next.js and NestJS production builds clean).
- **Unit Tests**: `pnpm --filter api test` passed (8/8 unit tests passing).
- **Infrastructure**: All Docker containers running and healthy. Database schema synced via Prisma.
