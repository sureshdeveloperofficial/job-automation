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
│   ├── types/        # Shared TypeScript interfaces, types, and enums
│   └── schemas/      # Shared Zod validation schemas and DTO types
├── infrastructure/
│   └── docker/       # PostgreSQL initialization scripts and configurations
├── docker-compose.yml# Local infrastructure (PostgreSQL 16 + pgvector, Redis, MinIO)
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

### 4. Start Infrastructure Services
```bash
docker compose up -d
```
This starts:
- **PostgreSQL 16 + pgvector**: `localhost:5432`
- **Redis**: `localhost:6379`
- **MinIO**: `localhost:9000` (Console: `localhost:9001`)

### 5. Generate Database Client & Run Migrations
```bash
pnpm run db:generate
# or inside apps/api:
# pnpm exec prisma db push
```

### 6. Start Development Servers
```bash
# Start all apps in watch mode:
pnpm dev

# Or start individually:
pnpm --filter api dev    # NestJS API on http://localhost:3001
pnpm --filter web dev    # Next.js Web App on http://localhost:3000
```

---

## API Documentation

When the API server is running, the Swagger OpenAPI documentation is interactively accessible at:
- **Interactive Swagger UI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **API Base Route**: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)

---

## Platform Philosophy & Principles

1. **Evidence-Backed**: Every application, bullet point, and claim maps to verified candidate evidence.
2. **Deterministic Fallbacks**: AI features are progressive enhancements. Core workflows function reliably without LLMs.
3. **Platform Compliance**: Respect rate limits, platform protections, and terms of service. Never bypass security barriers or CAPTCHAs.
4. **Outcome Intelligence**: Continuously learn from application responses to refine scoring, resumes, and targeting.
