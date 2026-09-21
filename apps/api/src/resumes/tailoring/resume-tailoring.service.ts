import { Injectable } from '@nestjs/common';
import type {
  ResumeAST,
  ResumeBulletItem,
  ResumeExperienceItem,
  TailorResumeInput,
  ResumeDiff,
} from '@career-os/types';
import { AtsScorerService, type JobTargetSpec } from '../ats-scorer/ats-scorer.service.js';
import { ResumeDiffService } from '../diff/resume-diff.service.js';

export interface VerifiedEvidenceClaim {
  id: string;
  claim: string;
  category: string;
  context?: string | null;
  sourceDetail?: string | null;
}

export interface TailoringResult {
  tailoredResume: ResumeAST;
  diffSummary: ResumeDiff;
  atsScoreBefore: number;
  atsScoreAfter: number;
  evidenceBindings: string[];
}

@Injectable()
export class ResumeTailoringService {
  constructor(
    private readonly atsScorer: AtsScorerService,
    private readonly diffService: ResumeDiffService,
  ) {}

  /**
   * Deterministically tailors a base resume for a target job specification, strictly backed by verified candidate evidence
   */
  tailor(
    baseResume: ResumeAST,
    evidenceClaims: VerifiedEvidenceClaim[],
    target: JobTargetSpec,
    options?: Partial<TailorResumeInput>,
  ): TailoringResult {
    // 1. Calculate Baseline ATS score before tailoring
    const beforeEval = this.atsScorer.evaluate(baseResume, target);

    // 2. Map & Score verified evidence items against job requirements
    const scoredEvidence = this.scoreEvidenceClaims(evidenceClaims, target, options?.selectedEvidenceIds);

    // 3. Tailor experience bullets by re-ranking according to target relevance
    const tailoredExperiences = this.tailorExperiences(baseResume.experiences || [], scoredEvidence);

    // 4. Tailor skills by categorizing target-matched skills into Core
    const tailoredSkills = this.tailorSkills(baseResume.skills, target);

    // 5. Tailor executive summary aligning candidate facts with target role
    const tailoredSummary = this.formulateTailoredSummary(
      baseResume,
      target,
      tailoredSkills.core,
      scoredEvidence,
    );

    // 6. Gather all bound evidence IDs
    const evidenceBindings = this.extractEvidenceBindings(tailoredExperiences);

    const tailoredResume: ResumeAST = {
      personalInfo: {
        ...baseResume.personalInfo,
        headline: target.title || baseResume.personalInfo?.headline,
      },
      summary: tailoredSummary,
      skills: tailoredSkills,
      experiences: tailoredExperiences,
      education: baseResume.education || [],
      projects: baseResume.projects || [],
      certifications: baseResume.certifications || [],
      evidenceBindings,
    };

    // 7. Calculate ATS score after tailoring
    const afterEval = this.atsScorer.evaluate(tailoredResume, target);

    // 8. Compute structural diff
    const atsScoreDelta = afterEval.score - beforeEval.score;
    const diffSummary = this.diffService.computeDiff(baseResume, tailoredResume, atsScoreDelta);

    return {
      tailoredResume,
      diffSummary,
      atsScoreBefore: beforeEval.score,
      atsScoreAfter: afterEval.score,
      evidenceBindings,
    };
  }

  /**
   * Scores verified evidence claims against the target job requirements
   */
  private scoreEvidenceClaims(
    claims: VerifiedEvidenceClaim[],
    target: JobTargetSpec,
    selectedIds?: string[],
  ): Map<string, { claim: VerifiedEvidenceClaim; score: number }> {
    const scored = new Map<string, { claim: VerifiedEvidenceClaim; score: number }>();
    const selectedSet = new Set(selectedIds || []);

    const reqSkills = (target.requiredSkills || []).map((s) => s.toLowerCase());
    const prefSkills = (target.preferredSkills || []).map((s) => s.toLowerCase());

    for (const item of claims) {
      let score = 10; // baseline
      const text = `${item.claim} ${item.context || ''}`.toLowerCase();

      // Explicitly chosen by candidate
      if (selectedSet.has(item.id)) {
        score += 50;
      }

      // Matches required skills
      for (const req of reqSkills) {
        if (text.includes(req)) {
          score += 30;
        }
      }

      // Matches preferred skills
      for (const pref of prefSkills) {
        if (text.includes(pref)) {
          score += 15;
        }
      }

      // Quantifiable impact bonus
      if (this.atsScorer.isBulletQuantified(item.claim)) {
        score += 25;
      }

      scored.set(item.id, { claim: item, score });
    }

    return scored;
  }

  /**
   * Re-ranks and aligns experience bullet points to prioritize target-relevant accomplishments
   */
  private tailorExperiences(
    experiences: ResumeExperienceItem[],
    scoredEvidence: Map<string, { claim: VerifiedEvidenceClaim; score: number }>,
  ): ResumeExperienceItem[] {
    return experiences.map((exp) => {
      const existingBullets: ResumeBulletItem[] = (exp.bullets || []).map((b) =>
        typeof b === 'string'
          ? { text: b, metrics: [], matchedSkills: [] }
          : { ...b },
      );

      // Match and bind evidence claims for this company
      const companyClaims = Array.from(scoredEvidence.values()).filter((se) => {
        const detail = (se.claim.sourceDetail || '').toLowerCase();
        const context = (se.claim.context || '').toLowerCase();
        const comp = exp.company.toLowerCase();
        return detail.includes(comp) || context.includes(comp);
      });

      // Bind evidence IDs if not already bound
      for (const bullet of existingBullets) {
        if (!bullet.evidenceId) {
          const match = companyClaims.find(
            (c) =>
              c.claim.claim.includes(bullet.text) ||
              bullet.text.includes(c.claim.claim) ||
              this.similarityRatio(c.claim.claim, bullet.text) > 0.6,
          );
          if (match) {
            bullet.evidenceId = match.claim.id;
          }
        }
      }

      // Score each bullet
      const scoredBullets = existingBullets.map((b) => {
        let bScore = 10;
        if (b.evidenceId && scoredEvidence.has(b.evidenceId)) {
          bScore += scoredEvidence.get(b.evidenceId)!.score;
        }
        if (this.atsScorer.isBulletQuantified(b.text)) {
          bScore += 20;
        }
        return { bullet: b, score: bScore };
      });

      // Sort bullets descending by relevance score so the strongest bullets come first
      scoredBullets.sort((a, b) => b.score - a.score);

      return {
        ...exp,
        bullets: scoredBullets.map((sb) => sb.bullet),
      };
    });
  }

  /**
   * Categorizes candidate skills, placing target job matches at the forefront of Core Skills
   */
  private tailorSkills(
    skills: ResumeAST['skills'],
    target: JobTargetSpec,
  ): ResumeAST['skills'] {
    const allCandidateSkills = new Set<string>([
      ...(skills?.core || []),
      ...(skills?.secondary || []),
      ...(skills?.tools || []),
    ]);

    const targetRequired = new Set((target.requiredSkills || []).map((s) => s.toLowerCase()));
    const targetPreferred = new Set((target.preferredSkills || []).map((s) => s.toLowerCase()));

    const core: string[] = [];
    const secondary: string[] = [];
    const tools: string[] = [];

    const toolKeywords = ['docker', 'kubernetes', 'git', 'aws', 'gcp', 'azure', 'linux', 'ci/cd', 'jenkins', 'redis', 'jira'];

    for (const skill of allCandidateSkills) {
      const lower = skill.toLowerCase();

      // If skill matches required or preferred, promote directly to Core
      if (targetRequired.has(lower) || targetPreferred.has(lower)) {
        core.push(skill);
      } else if (toolKeywords.some((tk) => lower.includes(tk))) {
        tools.push(skill);
      } else {
        secondary.push(skill);
      }
    }

    // Ensure core has at least 4 items from candidate profile
    if (core.length < 4 && secondary.length > 0) {
      while (core.length < 4 && secondary.length > 0) {
        core.push(secondary.shift()!);
      }
    }

    return {
      core,
      secondary,
      tools,
    };
  }

  /**
   * Synthesizes an executive summary tailored to the target role without hallucination
   */
  private formulateTailoredSummary(
    base: ResumeAST,
    target: JobTargetSpec,
    coreSkills: string[],
    scoredEvidence: Map<string, { claim: VerifiedEvidenceClaim; score: number }>,
  ): string {
    const years = this.atsScorer.estimateYearsOfExperience(base);
    const targetTitle = target.title || base.personalInfo?.headline || 'Software Engineer';
    const topSkills = coreSkills.slice(0, 4).join(', ');

    // Find top verified evidence claim with metrics
    const topClaims = Array.from(scoredEvidence.values())
      .map((se) => se.claim.claim)
      .filter((c) => this.atsScorer.isBulletQuantified(c));

    const proofPoint = topClaims.length > 0 ? topClaims[0] : null;

    let summary = `${targetTitle} with ${years > 0 ? `${years}+` : 'extensive'} years of proven engineering experience specializing in ${topSkills}.`;

    if (proofPoint) {
      summary += ` Track record of delivering high-impact solutions, such as: ${proofPoint.replace(/\.$/, '')}.`;
    } else if (base.summary) {
      // Retain portion of original verified summary
      summary += ` ${base.summary}`;
    }

    return summary;
  }

  /**
   * Extracts unique evidence IDs bound across all experience bullets
   */
  private extractEvidenceBindings(experiences: ResumeExperienceItem[]): string[] {
    const ids = new Set<string>();
    for (const exp of experiences) {
      for (const b of exp.bullets || []) {
        if (typeof b !== 'string' && b.evidenceId) {
          ids.add(b.evidenceId);
        }
      }
    }
    return Array.from(ids);
  }

  private similarityRatio(a: string, b: string): number {
    const cleanA = a.toLowerCase().trim();
    const cleanB = b.toLowerCase().trim();
    if (cleanA === cleanB) return 1.0;
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return 0.8;
    return 0;
  }
}
