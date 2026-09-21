# AI Career OS — Phase 4: Tasks Checklist

## Phase 4: Resume Tailoring & Version Control Engine

### Milestone 1: Data Contracts & Database Schema
- [x] Extend `packages/types` with:
  - [x] `ResumeAST` (structured resume document schema)
  - [x] `AtsScoreResult` & `AtsScoreBreakdown` (skills, experience, impact, formatting, recommendations)
  - [x] `ResumeVariant` & `ResumeDiff` interfaces
  - [x] `TailorResumeInput` & `ExportResumeFormat` enums/types
- [x] Extend `packages/schemas` with:
  - [x] `ScoreResumeSchema` (for scoring against a job ID or custom JD)
  - [x] `TailorResumeSchema` (target job ID, selected evidence IDs, template type)
  - [x] `CreateVariantSchema` & `UpdateVariantSchema`
- [x] Update `apps/api/prisma/schema.prisma`:
  - [x] Extend `ResumeVersion` with `structuredData` (Json), `targetJobId` (Uuid?), `targetCompany` (VarChar?), `atsScore` (Int?), `atsBreakdown` (Json?), `diffSummary` (Json?), `evidenceBindings` (String[])
  - [x] Add foreign key relation from `ResumeVersion.targetJobId` to `Job.id`
- [x] Generate Prisma Client (`pnpm -F api exec prisma generate`)
- [x] Export and build shared packages (`pnpm -F types build && pnpm -F schemas build`)

### Milestone 2: Deterministic ATS Scoring Engine
- [x] Create `AtsScorerService` in `apps/api/src/resumes/ats-scorer/`:
  - [x] Required skills exact & synonym match density calculator (35% weight)
  - [x] Preferred skills bonus coverage calculator (15% weight)
  - [x] Experience & seniority alignment comparator (20% weight)
  - [x] Quantifiable impact & metrics detector (15% weight)
  - [x] Section structure and formatting hygiene validator (15% weight)
  - [x] Actionable improvement suggestions generator
- [x] Write unit tests in `apps/api/test/ats-scorer.service.spec.ts`:
  - [x] Test 100% match scenario with high metrics
  - [x] Test low match scenario with missing required skills
  - [x] Test synonym recognition (e.g. Postgres vs PostgreSQL)
  - [x] Test impact quantification detection

### Milestone 3: Evidence-Backed Tailoring Pipeline
- [x] Create `ResumeTailoringService` in `apps/api/src/resumes/tailoring/`:
  - [x] Ingest target job requirements and candidate profile/evidence
  - [x] Re-rank and score candidate evidence items against job requirements
  - [x] Prioritize and select top-matching bullet points per experience
  - [x] Categorize skills into core/relevant vs secondary based on JD
  - [x] Formulate tailored role summary emphasizing relevant verified achievements
  - [x] Bind every bullet to its source `CandidateEvidence.id` (Zero-hallucination guarantee)
- [x] Create `ResumeDiffService` in `apps/api/src/resumes/diff/`:
  - [x] Calculate section-level, bullet-level, and skill-level diffs between base and tailored ASTs
- [x] Write unit tests in `apps/api/test/resume-tailoring.service.spec.ts`

### Milestone 4: Backend REST APIs & Export Module
- [x] Implement `POST /api/v1/resumes/:id/score` (calculate ATS score against job ID or custom JD text)
- [x] Implement `POST /api/v1/resumes/:id/tailor` (generate evidence-backed tailored variant)
- [x] Implement `GET /api/v1/resumes/variants` (list all tailored variants with target job info)
- [x] Implement `GET /api/v1/resumes/variants/:id` (retrieve variant details and structured AST)
- [x] Implement `GET /api/v1/resumes/variants/:id/diff` (visual diff against parent master resume)
- [x] Implement `GET /api/v1/resumes/variants/:id/export` (generate clean ATS-compliant HTML/plain-text document)
- [x] Register services and endpoints in `ResumesModule`
- [x] Write integration tests in `apps/api/test/resumes-tailor.service.spec.ts`

### Milestone 5: Frontend Tailoring Studio & Web Screens
- [x] Build `/resumes` Resume Hub screen:
  - [x] Tabs for Master Resumes vs. Tailored Variants
  - [x] ATS score badges, target companies, and last updated stamps
  - [x] New Master Resume upload modal & "Create Tailored Resume" CTA
- [x] Build `/resumes/tailor` Interactive Tailoring Studio:
  - [x] Step 1: Base resume & Target Job selector (from Job Radar or custom JD input)
  - [x] Step 2: Gap analysis & pre-tailoring ATS score preview
  - [x] Step 3: Evidence claim binding & bullet ordering
  - [x] Step 4: Side-by-side diff inspector and final ATS verification
  - [x] Save variant & direct download
- [x] Build `/resumes/[id]` Variant Inspector screen:
  - [x] Render formatted ATS-compliant resume preview
  - [x] Display comprehensive ATS audit report with actionable fixes
  - [x] Side-by-side lineage diff viewer against base resume
  - [x] One-click print/PDF download and copy plain text
- [x] Add "Tailor Resume" direct CTA button on `/jobs/[id]` Job Details page
- [x] Update `/dashboard` with Tailored Resumes widget

### Milestone 6: Quality Assurance & Verification
- [x] Execute `pnpm run typecheck` across all 4 monorepo workspaces (0 errors)
- [x] Execute `pnpm run lint` across monorepo (0 errors)
- [x] Execute `pnpm --filter api test` (all unit and integration tests passing: 50/50 tests in 14 suites)
- [x] Update `plans/master-task-tracker.md` with Phase 4 progress
- [x] Create walkthrough documentation with verification evidence
- [x] Commit completed Phase 4 to Git repository
