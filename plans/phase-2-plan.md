# AI Career OS — Phase 2: Profile & Evidence Engine Plan

## Objective
Establish the candidate identity, deterministic resume ingestion, and verified evidence ledger.

---

## Scope & Components
1. **Deterministic Resume Parser**: Rule-based PDF/DOCX text extraction and section segmentation (Contact, Skills, Experience, Education, Projects).
2. **Candidate Profile Engine**: Full CRUD for personal, professional, preferences, and 0–100% Health Score calculator.
3. **Candidate Evidence Ledger**: Verifiable claim records (`PENDING`, `VERIFIED`, `REJECTED`) linked to skills, achievements, and experiences.
4. **Role Profiles Manager**: Multiple target titles, required/preferred skills, location preferences, and salary floors per candidate.
5. **Frontend Experience**:
   - 6-step Onboarding Wizard (`/onboarding`)
   - Profile Management Hub (`/profile`)
   - Evidence Ledger Viewer & Verifier (`/profile/evidence`)
   - Target Role Profiles Manager (`/role-profiles`)

---

## Target Ports
- Backend API: `http://localhost:1961`
- Frontend Web: `http://localhost:1962`
- Database: `localhost:5433`
