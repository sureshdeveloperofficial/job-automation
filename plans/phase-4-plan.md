# AI Career OS — Phase 4: Resume Tailoring & Version Control Engine Plan

## 1. Executive Summary & Objective

Phase 4 builds the core competitive advantage of **AI Career OS**: the **Resume Tailoring, ATS Optimization, and Version Control Engine**.

In the modern job market, sending generic resumes results in single-digit response rates. Candidates need hyper-targeted resumes customized for each target role or job description. However, existing AI resume builders suffer from two fatal flaws:
1. **Hallucination & Fabrication**: Generative LLMs routinely invent experiences, metrics, or technologies the candidate never possessed, ruining candidate credibility during interviews.
2. **Black-box ATS Guesswork**: Most tools provide arbitrary scores without explaining exact parsing heuristics or algorithmic weighting.

Phase 4 solves this with an **Evidence-Backed Guarantee** and **Deterministic Baseline**:
1. **Deterministic ATS Scoring Engine**: Computes a transparent, 0–100% weighted ATS score based on keyword match density, required vs. preferred skill coverage, seniority/experience alignment, quantifiable impact metrics, and structural formatting heuristics—with **zero mandatory LLM token cost**.
2. **Evidence-Backed Tailoring Pipeline**: Tailors resumes by selecting, reordering, and emphasizing the candidate's verified evidence items (`CandidateEvidence` records) that directly match the target job's requirements. Every bullet point is bound to a verified evidence ID, guaranteeing 100% truthfulness.
3. **Resume Version Control & Lineage**: Treats resumes like Git branches. Candidates maintain Master Resumes and generate job-specific variants (`ResumeVersion` / `ResumeVariant`) with immutable links to the target `Job` and `JDSnapshot`, complete with bullet-by-bullet visual diffing.
4. **ATS-Grade Export & Document Rendering**: Generates clean, parser-friendly, single/two-page ATS-optimized layouts (Modern Clean, Classic Tech, Minimal Executive) with direct HTML-to-print/PDF rendering and plain-text export.
5. **Interactive Tailoring Studio (Frontend)**:
   - `/resumes`: Master Resume Hub & Variant Lineage Explorer.
   - `/resumes/tailor`: 4-step Interactive Tailoring Studio (Job Selection -> Gap & ATS Analysis -> Evidence Binding & Section Ordering -> Diff & Live Preview).
   - `/resumes/[id]`: Variant Inspector, ATS Audit report, and export tools.

---

## 2. Architecture & Service Ports

The Phase 4 engine operates seamlessly within the existing monorepo architecture:

```text
                                 +-----------------------------+
                                 |  Next.js 16 Web (Port 1962)  |
                                 |  /resumes, /resumes/tailor,  |
                                 |  /resumes/:id (ATS Studio)  |
                                 +--------------+--------------+
                                                |
                                         REST / Axios Client
                                                |
                                 +--------------v--------------+
                                 |  NestJS 12 API (Port 1961)  |
                                 |  ResumesModule, AtsScorer,  |
                                 |  TailoringEngine, DiffEngine|
                                 +--------------+--------------+
                                                |
                      +-------------------------+-------------------------+
                      |                         |                         |
           +----------v----------+   +----------v----------+   +----------v----------+
           | PostgreSQL 16 (5433)|   | Redis 7 Cache (6379)|   | MinIO / Cloudinary  |
           | Resume, Version,    |   | ATS score cache     |   | Generated PDF /     |
           | Evidence, Job links |   | Rate limits         |   | Document storage    |
           +---------------------+   +---------------------+   +---------------------+
```

| Service | Host Port | Internal Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | `1962` | `1962` | HTTP | Client app (`/resumes`, `/resumes/tailor`, `/resumes/[id]`) |
| **Backend API** | `1961` | `1961` | HTTP | Resumes API, ATS Scorer, Tailoring Pipeline, Swagger docs |
| **PostgreSQL 16** | `5433` | `5432` | TCP | `Resume`, `ResumeVersion`, `CandidateEvidence`, `Job` |
| **Redis 7** | `6379` | `6379` | TCP | Scorer calculation caching, session rate limits |
| **Cloud Storage** | Cloudinary / MinIO | `9000` | HTTPS | Storage of tailored PDF artifacts and base documents |

---

## 3. Detailed Component Specifications

### 3.1 Deterministic ATS Scoring Engine (`apps/api/src/ats-scorer`)
- **Philosophy**: Completely deterministic, lightning-fast (<50ms), and 100% transparent. No LLM required.
- **Weighted Multi-Dimensional Score (0–100%)**:
  1. **Required Skills Coverage (35% weight)**:
     - Exact match ratio: $\frac{\text{Skills In Resume} \cap \text{Required Skills}}{\text{Required Skills}}$.
     - Case-insensitive synonym expansion (e.g., `PostgreSQL` matches `Postgres`, `Node.js` matches `Node`).
  2. **Preferred Skills Coverage (15% weight)**:
     - Bonus alignment with nice-to-have technologies.
  3. **Experience & Seniority Alignment (20% weight)**:
     - Seniority check: Compares parsed candidate seniority (`MID`, `SENIOR`, etc.) with JD requirement.
     - Total years of experience vs. minimum required years.
  4. **Quantifiable Impact & Metrics (15% weight)**:
     - Scans experience bullets for quantified results (percentages `%`, dollar amounts `$`, multiplier `x`, scale `M/K`, latency `ms/s`).
     - Rewarding Google X-Y-Z formula bullets ("Accomplished [X], as measured by [Y], by doing [Z]").
  5. **Formatting, Length & Structure Hygiene (15% weight)**:
     - Standard section header detection (`Summary`, `Experience`, `Education`, `Skills`).
     - Contact info presence (Email, Phone, Location, LinkedIn/GitHub).
     - Bullet density and length checks (ideal 3–5 bullets per role, 15–30 words per bullet).
- **Audit Feedback Payload**:
  - `matchedSkills: string[]`
  - `missingRequiredSkills: string[]`
  - `missingPreferredSkills: string[]`
  - `quantifiedBulletRatio: number` (e.g. 0.75 = 75% bullets have metrics)
  - `recommendations: string[]` (Actionable steps: "Add metrics to role at XYZ", "Include missing required skill: Docker").

### 3.2 Evidence-Backed Bullet Tailoring Pipeline (`apps/api/src/tailoring`)
- **Zero-Hallucination Invariant**:
  - The tailoring engine operates strictly on verified candidate records (`CandidateProfile` and verified `CandidateEvidence`).
  - No new claims, experiences, or degrees are ever synthesized.
- **Tailoring Operations**:
  1. **Target Role & Job Ingestion**: Reads the target `Job` requirements and immutable `JDSnapshot`.
  2. **Evidence Re-ranking**: Scores each candidate evidence claim against the JD's required skills and responsibilities using deterministic term frequency and semantic keyword overlap.
  3. **Experience Re-ordering**: Prioritizes bullet points that exhibit the highest match scores for the target role.
  4. **Summary Formulation**: Generates a role-focused executive summary aligning the candidate's verified experience with the target position's domain.
  5. **Skills Section Categorization**: Dynamically organizes skills into "Core / Relevant to Role", "Secondary / Related", and "Additional Tools".
  6. **Evidence Citation Binding**: Attaches `evidenceIds: string[]` to each section and bullet in the structured resume AST.

### 3.3 Resume Version Control & Lineage (`ResumeVersion` & Structured AST)
- **Data Model Extensions**:
  - Extend `ResumeVersion` with:
    - `structuredData`: Complete JSON document AST (`personalInfo`, `summary`, `experiences`, `skills`, `education`, `projects`, `evidenceBindings`).
    - `targetJobId`: Optional foreign key to `Job`.
    - `targetCompany`: Optional company name.
    - `atsScore`: Overall 0-100 score against the target job.
    - `atsBreakdown`: Full JSON audit breakdown.
    - `diffSummary`: Structured diff from base version (`addedSkills`, `reorderedBulletsCount`, `modifiedSummary`).
- **Branching & Versioning**:
  - Every candidate has one or more **MASTER** resumes.
  - Tailoring creates a new **TAILORED** `Resume` or a branched `ResumeVersion` referencing the parent.
  - Candidates can inspect visual diffs between any two versions or between Master and Tailored.

### 3.4 ATS-Grade Document & Export Engine (`apps/api/src/resumes/export`)
- **Semantic HTML/CSS Templates**:
  - **Modern Clean**: High readability, subtle divider lines, optimal line height, single/double column hybrid.
  - **Classic Tech**: Traditional serif/sans-serif, compact high-density layout preferred by financial/enterprise recruiters.
  - **Minimal Executive**: Elegant typography, expanded spacing, high focus on leadership impact and career trajectory.
- **ATS Compliance Rules**:
  - Clean semantic HTML structure (`<h1>`, `<h2>`, `<ul>`, `<li>`, `<p>`).
  - Standard fonts (Inter, Roboto, Arial, Times New Roman, Calibri) that render identically across all ATS parsers.
  - Zero tables, complex grids, text boxes, or floating layers that cause ATS ingestion crashes.
- **Export Formats**:
  - Printable / Downloadable HTML with print stylesheets (`@media print`).
  - Plain-text ASCII export for copy-pasting directly into raw application textareas.
  - Server-side PDF generation or client-side print-to-PDF stream.

---

## 4. Frontend Experience Specifications

### 4.1 Resume Hub & Lineage Manager (`/resumes`)
- Master Resumes vs. Tailored Variants tabs.
- Quick stats: Total versions, average ATS score, active tailored variants.
- Actions: Upload new master resume, Create tailored variant, Download PDF, View audit.

### 4.2 Interactive Resume Tailoring Studio (`/resumes/tailor`)
- **Step 1: Target Role & Job Selection**:
  - Select an existing base resume.
  - Choose from saved Job Radar opportunities or paste a custom Job Description.
- **Step 2: Instant ATS Pre-Score & Gap Analysis**:
  - Live side-by-side match breakdown (Current ATS score: 62% -> Projected tailored score: 89%).
  - Highlight missing required skills and experience alignment.
- **Step 3: Evidence Selection & Bullet Prioritization**:
  - Interactive bullet picker showing verified evidence items with green "Verified Claim" badges.
  - Ability to drag, re-order, and select top-performing bullets for each previous company.
- **Step 4: Diff Review & Live ATS Audit**:
  - Visual side-by-side diff (Base Resume on left, Tailored Resume on right with added/emphasized items highlighted).
  - Final ATS score verification widget.
  - "Save Variant" and "Download ATS Resume" buttons.

### 4.3 Resume Variant Inspector (`/resumes/[id]`)
- Comprehensive variant view with target company and job link.
- Tabbed view: Formatted ATS Resume Preview, Lineage Diff against Base, and In-depth ATS Audit report.
- One-click PDF download and plain text clipboard copy.

---

## 5. Phased Implementation Milestones

### Milestone 1: Data Contracts & Prisma Schema Extension
- Extend `@career-os/types` with `ResumeAST`, `ResumeVariant`, `AtsScoreResult`, `AtsScoreBreakdown`, `TailorResumeInput`.
- Extend `@career-os/schemas` with validation schemas for tailoring, scoring, and variant management.
- Update `apps/api/prisma/schema.prisma` with structured data and metadata fields for `ResumeVersion`.
- Regenerate Prisma client.

### Milestone 2: Deterministic ATS Scoring Engine
- Build `AtsScorerService` with keyword extraction, skill matching, seniority alignment, and impact quantification.
- Implement actionable recommendations generator.
- Write unit tests covering various JD and resume combinations (`test/ats-scorer.service.spec.ts`).

### Milestone 3: Evidence-Backed Tailoring Pipeline
- Build `ResumeTailoringService` linking candidate evidence to JD specifications.
- Implement deterministic re-ordering and skill prioritization.
- Implement diff calculation engine comparing base resume AST to tailored variant.
- Write unit tests (`test/resume-tailoring.service.spec.ts`).

### Milestone 4: Backend REST APIs & Export Module
- Endpoints:
  - `POST /api/v1/resumes/:id/score`: Calculate ATS score for resume against a job ID or custom JD.
  - `POST /api/v1/resumes/:id/tailor`: Generate tailored resume variant backed by evidence.
  - `GET /api/v1/resumes/variants`: List all tailored variants with target job metadata.
  - `GET /api/v1/resumes/variants/:id/diff`: Compare variant with base resume.
  - `GET /api/v1/resumes/variants/:id/export`: Generate ATS-compliant HTML/PDF export.
- Integration tests in `apps/api/test/resumes-tailor.service.spec.ts`.

### Milestone 5: Frontend Tailoring Studio & Web Screens
- Build `/resumes`: Master resume hub and tailored variants list.
- Build `/resumes/tailor`: 4-step interactive tailoring studio with live gap analysis.
- Build `/resumes/[id]`: Variant inspector, diff viewer, and ATS score report.
- Connect direct navigation from `/jobs/[id]` ("Tailor Resume for this Job").

### Milestone 6: Quality Assurance & Verification
- Execute `pnpm run typecheck` across all 4 workspaces (0 errors).
- Execute `pnpm run lint` across monorepo (0 errors).
- Execute `pnpm --filter api test` (all unit and integration tests passing).
- Update task tracking and create walkthrough documentation.
