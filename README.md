# AI Career OS

> AI Career OS is an intelligent, privacy-first career automation platform designed to find the right jobs for the right candidate, prepare evidence-backed applications, submit through permitted workflows, track outcomes, and learn from results.

---

## Architecture Overview

This project is organized as a pnpm monorepo managed with Turborepo:

```
job-automation/
├── apps/
│   ├── api/          # Backend REST API (NestJS 12, Prisma, BullMQ, Passport/JWT, Pino)
│   └── web/          # Frontend Web Application (Next.js 16, Tailwind CSS v4, shadcn/ui, TanStack Query)
├── packages/
│   ├── types/        # Shared TypeScript interfaces, AST definitions, types, and enums
│   └── schemas/      # Shared Zod validation schemas and DTO types
├── infrastructure/
│   └── docker/       # PostgreSQL initialization scripts and configurations
├── docker-compose.yml# Local infrastructure (PostgreSQL 16 + pgvector, Redis, MinIO, API, Web)
└── .env.example      # Shared environment configuration template
```

---

## Quick Start

### 1. Prerequisites
- **Node.js**: >= 20.x
- **pnpm**: >= 10.x
- **Docker & Docker Compose**: latest

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

### 4. Start Infrastructure & Applications with Docker
```bash
docker compose up -d --build
```
This automatically boots:
- **Frontend Web UI**: `http://localhost:1962`
- **Backend REST API**: `http://localhost:1961` (Swagger: `http://localhost:1961/api/docs`)
- **PostgreSQL 16 + pgvector**: `localhost:5433` (Internal `5432`)
- **Redis 7**: `localhost:6379`
- **MinIO S3**: `localhost:9000` (Web Console: `localhost:9001`)

> The API container automatically syncs the database schema on start via `prisma db push --skip-generate`.

### 5. Local Development (Alternative to Docker)
```bash
# Start Docker backing services only:
docker compose up -d postgres redis minio minio-init

# Push schema to local DB:
pnpm -F api exec prisma db push

# Start all apps in watch mode:
pnpm dev

# Or start individually:
pnpm --filter api dev    # NestJS API on http://localhost:1961
pnpm --filter web dev    # Next.js Web App on http://localhost:1962
```

---

## Platform Milestones Progress

| Phase | Title | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation & Architecture** | Monorepo, Shared Contracts, NestJS API Auth, Next.js Web, Docker Stack | **100% COMPLETED** |
| **Phase 2** | **Profile & Evidence Engine** | Deterministic Resume Parser, Profile Health Engine, Evidence Ledger, Role Profiles, Onboarding Wizard | **100% COMPLETED** |
| **Phase 3** | **Job Discovery & Market Radar** | Ingestion Connectors (Greenhouse, Lever, Seed), Normalization, Deduplication, Deterministic JD Analyzer, Radar UI | **100% COMPLETED** |
| **Phase 4** | **Resume Tailoring & Version Control** | 5-Factor Deterministic ATS Scorer, Zero-Hallucination Tailoring, Structural Diff, Semantic HTML/Text Exporter, Tailoring Studio | **100% COMPLETED** |
| **Phase 5** | **Application Engine & Pipeline** | Application lifecycle state machine, auto-fill submission workflows, verification receipts, outcome monitoring | **NEXT UP** |

---

## Web Application Routes

- **Authentication**: `/login`, `/signup`
- **Mission Control**: `/dashboard` (Market radar highlights & ATS tailoring launch banner)
- **Profile & Evidence**:
  - `/onboarding`: 6-step guided profile setup wizard
  - `/profile`: Candidate Profile Hub & Health Completeness Scorecard
  - `/profile/evidence`: Verified Evidence Claims Ledger
  - `/role-profiles`: Multi-preset Target Role Profiles manager
- **Job Discovery (Market Radar)**:
  - `/jobs`: Interactive Job Radar with real-time filters and quick drawer preview
  - `/jobs/[id]`: Job details, Candidate Match Readiness gauge, JD inspector, and direct Tailor CTA
  - `/companies`: Active hiring employers directory
- **Resume Tailoring & Version Control**:
  - `/resumes`: Resume Hub & Lineage (Master Resumes vs. Tailored Variants)
  - `/resumes/tailor`: 4-step interactive Tailoring Studio
  - `/resumes/[id]`: Variant live document preview, 5-factor ATS Audit Scorecard, and visual diff viewer

---

## API Documentation

When the API server is running, the Swagger OpenAPI documentation is interactively accessible at:
- **Interactive Swagger UI**: [http://localhost:1961/api/docs](http://localhost:1961/api/docs)
- **API Base Route**: [http://localhost:1961/api/v1](http://localhost:1961/api/v1)

---

## Platform Philosophy & Principles

1. **Evidence-Backed**: Every application, bullet point, and claim maps to verified candidate evidence.
2. **Zero-Hallucination Invariant**: Tailored resumes and applications only formulate claims substantiated by verified evidence records.
3. **Deterministic Baseline**: Core workflows (resume parsing, matching, ATS validation, tailoring) function reliably without mandatory LLM costs.
4. **Platform Compliance**: Respect rate limits, platform protections, and terms of service. Never bypass security barriers or CAPTCHAs.
5. **Outcome Intelligence**: Continuously learn from application responses to refine scoring, resumes, and targeting.
