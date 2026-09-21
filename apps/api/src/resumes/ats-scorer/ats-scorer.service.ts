import { Injectable } from '@nestjs/common';
import type {
  ResumeAST,
  AtsScoreResult,
  AtsScoreBreakdown,
  AtsCategoryScore,
  SeniorityLevel,
} from '@career-os/types';

export interface JobTargetSpec {
  title?: string;
  companyName?: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  seniority?: SeniorityLevel | string;
  experienceMinYears?: number;
  description?: string;
}

const SKILL_SYNONYMS: Record<string, string[]> = {
  postgresql: ['postgres', 'pgsql', 'psql'],
  postgres: ['postgresql', 'pgsql', 'psql'],
  react: ['react.js', 'reactjs'],
  'react.js': ['react', 'reactjs'],
  reactjs: ['react', 'react.js'],
  'node.js': ['node', 'nodejs'],
  node: ['node.js', 'nodejs'],
  nodejs: ['node', 'node.js'],
  typescript: ['ts'],
  ts: ['typescript'],
  javascript: ['js'],
  js: ['javascript'],
  golang: ['go'],
  go: ['golang'],
  'amazon web services': ['aws'],
  aws: ['amazon web services'],
  'google cloud': ['gcp', 'google cloud platform'],
  gcp: ['google cloud', 'google cloud platform'],
  kubernetes: ['k8s'],
  k8s: ['kubernetes'],
  docker: ['containerization', 'containers'],
  'ci/cd': ['cicd', 'continuous integration', 'continuous delivery'],
  cicd: ['ci/cd', 'continuous integration'],
  rest: ['restful', 'rest api', 'restful api'],
  'rest api': ['rest', 'restful api'],
  graphql: ['gql'],
  'c++': ['cpp'],
  'c#': ['csharp', '.net', 'dotnet'],
  '.net': ['dotnet', 'c#', 'csharp'],
};

// Regex patterns to detect quantifiable metrics in bullet points (stateless, no /g flag)
const METRIC_PATTERNS = [
  /\b\d+(\.\d+)?\s?%/, // percentages (e.g. 45%, 99.9%)
  /[$₹€£]\s?\d+(,\d+)*(\.\d+)?\s?[kKmMbB]?/i, // currency ($120k, ₹40L, $1.2M)
  /\b\d+(,\d+)*(\.\d+)?\s?(million|billion|lakh|crore|k|m|b)\b/i, // scale amounts
  /\b\d+(\.\d+)?x\b/i, // multipliers (e.g. 10x, 3.5x)
  /\b\d+\+?\s?(ms|milliseconds|seconds|mins|minutes|hours)\b/i, // latency or time reduction
  /\b\d{1,3}(,\d{3})+\+?\b/, // formatted large numbers (e.g. 10,000+)
  /\b(reduced|increased|improved|boosted|cut|saved|generated|scaled)\b.*\b\d+/i, // action + numbers
];

@Injectable()
export class AtsScorerService {
  /**
   * Evaluates a resume against a target job specification and returns a transparent 0-100% score with breakdown
   */
  evaluate(resume: ResumeAST, target: JobTargetSpec): AtsScoreResult {
    // 1. Required Skills Score (35% weight)
    const reqSkillsEval = this.evaluateRequiredSkills(resume, target.requiredSkills || []);

    // 2. Preferred Skills Score (15% weight)
    const prefSkillsEval = this.evaluatePreferredSkills(resume, target.preferredSkills || []);

    // 3. Experience & Seniority Alignment (20% weight)
    const expAlignmentEval = this.evaluateExperienceAlignment(resume, target);

    // 4. Quantifiable Impact & Metrics (15% weight)
    const impactEval = this.evaluateQuantifiableImpact(resume);

    // 5. Formatting & Structure Hygiene (15% weight)
    const formattingEval = this.evaluateFormattingHygiene(resume);

    // Compute Overall Weighted Score
    const overallScore = Math.round(
      reqSkillsEval.weightedScore +
        prefSkillsEval.weightedScore +
        expAlignmentEval.weightedScore +
        impactEval.weightedScore +
        formattingEval.weightedScore,
    );

    // Generate actionable improvement suggestions
    const recommendations = this.generateRecommendations({
      reqSkills: reqSkillsEval,
      prefSkills: prefSkillsEval,
      exp: expAlignmentEval,
      impact: impactEval,
      format: formattingEval,
      target,
    });

    const breakdown: AtsScoreBreakdown = {
      overallScore,
      requiredSkills: reqSkillsEval,
      preferredSkills: prefSkillsEval,
      experienceAlignment: expAlignmentEval,
      quantifiableImpact: impactEval,
      formattingHygiene: formattingEval,
      recommendations,
    };

    return {
      score: overallScore,
      breakdown,
      assessedAt: new Date(),
      jobTitle: target.title,
      companyName: target.companyName,
    };
  }

  /**
   * Evaluates Required Skills Coverage (Weight: 35%)
   */
  private evaluateRequiredSkills(
    resume: ResumeAST,
    requiredSkills: string[],
  ): AtsCategoryScore & { matched: string[]; missing: string[] } {
    const weight = 0.35;
    if (!requiredSkills || requiredSkills.length === 0) {
      return {
        score: 100,
        weight,
        weightedScore: Math.round(100 * weight),
        details: 'No specific required skills declared in target posting',
        matched: [],
        missing: [],
      };
    }

    const candidateSkills = this.getAllCandidateSkills(resume);
    const matched: string[] = [];
    const missing: string[] = [];

    for (const req of requiredSkills) {
      if (this.hasSkillMatch(req, candidateSkills)) {
        matched.push(req);
      } else {
        missing.push(req);
      }
    }

    const ratio = matched.length / requiredSkills.length;
    const score = Math.round(ratio * 100);

    return {
      score,
      weight,
      weightedScore: Math.round(score * weight),
      details: `${matched.length} of ${requiredSkills.length} required skills matched (${score}%)`,
      matched,
      missing,
    };
  }

  /**
   * Evaluates Preferred / Nice-to-have Skills Coverage (Weight: 15%)
   */
  private evaluatePreferredSkills(
    resume: ResumeAST,
    preferredSkills: string[],
  ): AtsCategoryScore & { matched: string[]; missing: string[] } {
    const weight = 0.15;
    if (!preferredSkills || preferredSkills.length === 0) {
      return {
        score: 100,
        weight,
        weightedScore: Math.round(100 * weight),
        details: 'No preferred skills listed',
        matched: [],
        missing: [],
      };
    }

    const candidateSkills = this.getAllCandidateSkills(resume);
    const matched: string[] = [];
    const missing: string[] = [];

    for (const pref of preferredSkills) {
      if (this.hasSkillMatch(pref, candidateSkills)) {
        matched.push(pref);
      } else {
        missing.push(pref);
      }
    }

    const ratio = matched.length / preferredSkills.length;
    const score = Math.round(ratio * 100);

    return {
      score,
      weight,
      weightedScore: Math.round(score * weight),
      details: `${matched.length} of ${preferredSkills.length} bonus skills matched (${score}%)`,
      matched,
      missing,
    };
  }

  /**
   * Evaluates Experience & Seniority Alignment (Weight: 20%)
   */
  private evaluateExperienceAlignment(
    resume: ResumeAST,
    target: JobTargetSpec,
  ): AtsCategoryScore & { candidateYears: number; requiredYears: number; seniorityMatch: boolean } {
    const weight = 0.2;
    const candidateYears = this.estimateYearsOfExperience(resume);
    const requiredYears = target.experienceMinYears || 0;

    let score = 70; // baseline

    // Years comparison
    if (requiredYears > 0) {
      if (candidateYears >= requiredYears) {
        score += 20;
      } else if (candidateYears >= requiredYears * 0.7) {
        score += 10;
      } else {
        score -= 20;
      }
    } else {
      score += 15;
    }

    // Seniority check
    const seniorityMatch = this.checkSeniorityMatch(resume, target.seniority);
    if (seniorityMatch) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      weight,
      weightedScore: Math.round(score * weight),
      details: `${candidateYears} years experience vs ${requiredYears || 'open'} years required`,
      candidateYears,
      requiredYears,
      seniorityMatch,
    };
  }

  /**
   * Evaluates Quantifiable Impact & Metrics (Weight: 15%)
   */
  private evaluateQuantifiableImpact(
    resume: ResumeAST,
  ): AtsCategoryScore & { quantifiedBulletCount: number; totalBulletCount: number; impactRatio: number } {
    const weight = 0.15;
    const bullets = this.getAllExperienceBullets(resume);

    if (bullets.length === 0) {
      return {
        score: 40,
        weight,
        weightedScore: Math.round(40 * weight),
        details: 'No experience bullets found',
        quantifiedBulletCount: 0,
        totalBulletCount: 0,
        impactRatio: 0,
      };
    }

    let quantifiedCount = 0;
    for (const b of bullets) {
      if (this.isBulletQuantified(b)) {
        quantifiedCount++;
      }
    }

    const impactRatio = quantifiedCount / bullets.length;
    // 50%+ bullets with metrics is considered stellar (100 pts)
    const score = Math.min(100, Math.round((impactRatio / 0.5) * 100));

    return {
      score,
      weight,
      weightedScore: Math.round(score * weight),
      details: `${quantifiedCount} of ${bullets.length} bullets include quantifiable metrics (${Math.round(impactRatio * 100)}%)`,
      quantifiedBulletCount: quantifiedCount,
      totalBulletCount: bullets.length,
      impactRatio: Math.round(impactRatio * 100) / 100,
    };
  }

  /**
   * Evaluates Formatting & Structural Hygiene (Weight: 15%)
   */
  private evaluateFormattingHygiene(
    resume: ResumeAST,
  ): AtsCategoryScore & { hasContactInfo: boolean; hasSummary: boolean; hasStandardSections: boolean } {
    const weight = 0.15;
    let score = 0;

    // Contact info check
    const hasEmail = Boolean(resume.personalInfo?.email);
    const hasName = Boolean(resume.personalInfo?.fullName);
    const hasContact = hasEmail && hasName;
    if (hasContact) score += 30;

    // Summary check (concise 20 - 150 words)
    const summaryWords = resume.summary ? resume.summary.trim().split(/\s+/).length : 0;
    const hasSummary = summaryWords >= 15 && summaryWords <= 200;
    if (hasSummary) score += 25;

    // Standard sections check
    const hasExp = (resume.experiences || []).length > 0;
    const hasSkills = Boolean(resume.skills?.core?.length);
    const hasEdu = (resume.education || []).length > 0;
    const hasStandardSections = hasExp && hasSkills;

    if (hasExp) score += 25;
    if (hasSkills) score += 10;
    if (hasEdu) score += 10;

    score = Math.min(100, score);

    return {
      score,
      weight,
      weightedScore: Math.round(score * weight),
      details: `Contact info: ${hasContact ? 'OK' : 'Missing'}, Summary: ${hasSummary ? 'OK' : 'Suboptimal'}, Sections: ${hasStandardSections ? 'Complete' : 'Incomplete'}`,
      hasContactInfo: hasContact,
      hasSummary,
      hasStandardSections,
    };
  }

  /**
   * Generates actionable recommendations based on lowest category scores
   */
  private generateRecommendations(data: {
    reqSkills: { missing: string[]; score: number };
    prefSkills: { missing: string[]; score: number };
    exp: { candidateYears: number; requiredYears: number; seniorityMatch: boolean };
    impact: { impactRatio: number; score: number };
    format: { hasContactInfo: boolean; hasSummary: boolean };
    target: JobTargetSpec;
  }): string[] {
    const recs: string[] = [];

    // Required skills missing
    if (data.reqSkills.missing.length > 0) {
      const topMissing = data.reqSkills.missing.slice(0, 4).join(', ');
      recs.push(`Add or emphasize missing required skill(s): ${topMissing}.`);
    }

    // Impact quantification
    if (data.impact.impactRatio < 0.35) {
      recs.push(
        'Add quantifiable metrics (e.g. %, $, latency reduction, scale numbers) to at least 2 more bullet points.',
      );
    }

    // Summary
    if (!data.format.hasSummary) {
      recs.push('Add a concise 2–3 sentence professional summary tailored to the target role.');
    }

    // Preferred skills
    if (data.prefSkills.missing.length > 0 && data.prefSkills.score < 50) {
      const topPref = data.prefSkills.missing.slice(0, 3).join(', ');
      recs.push(`Consider mentioning bonus/preferred skill(s): ${topPref} if applicable to your projects.`);
    }

    // Contact
    if (!data.format.hasContactInfo) {
      recs.push('Ensure your full name, email, and phone number are clearly visible in the header.');
    }

    if (recs.length === 0) {
      recs.push('Excellent alignment! Your resume is strongly optimized for this position.');
    }

    return recs;
  }

  /**
   * Helper: Extracts all candidate skills (from core, secondary, tools, and bullet mentions)
   */
  getAllCandidateSkills(resume: ResumeAST): Set<string> {
    const skills = new Set<string>();

    if (resume.skills?.core) {
      resume.skills.core.forEach((s) => skills.add(s.toLowerCase().trim()));
    }
    if (resume.skills?.secondary) {
      resume.skills.secondary.forEach((s) => skills.add(s.toLowerCase().trim()));
    }
    if (resume.skills?.tools) {
      resume.skills.tools.forEach((s) => skills.add(s.toLowerCase().trim()));
    }

    // Also collect from experience bullet tags
    if (resume.experiences) {
      for (const exp of resume.experiences) {
        for (const b of exp.bullets || []) {
          if (b.matchedSkills) {
            b.matchedSkills.forEach((s) => skills.add(s.toLowerCase().trim()));
          }
        }
      }
    }

    return skills;
  }

  /**
   * Helper: Checks whether target skill or any of its known synonyms exists in candidate skills
   */
  hasSkillMatch(targetSkill: string, candidateSkills: Set<string>): boolean {
    const cleanTarget = targetSkill.toLowerCase().trim();
    if (candidateSkills.has(cleanTarget)) return true;

    // Check synonyms
    const synonyms = SKILL_SYNONYMS[cleanTarget] || [];
    for (const syn of synonyms) {
      if (candidateSkills.has(syn)) return true;
    }

    // Check substring word match for compound skills (e.g. "React Native" contains "React")
    for (const cand of candidateSkills) {
      if (cand === cleanTarget || cand.includes(cleanTarget) || cleanTarget.includes(cand)) {
        if (Math.abs(cand.length - cleanTarget.length) <= 3) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper: Extracts all bullet point strings from resume experiences
   */
  getAllExperienceBullets(resume: ResumeAST): string[] {
    const bullets: string[] = [];
    if (!resume.experiences) return bullets;

    for (const exp of resume.experiences) {
      for (const b of exp.bullets || []) {
        if (typeof b === 'string') {
          bullets.push(b);
        } else if (b?.text) {
          bullets.push(b.text);
        }
      }
    }
    return bullets;
  }

  /**
   * Helper: Determines if a bullet point contains quantifiable metric evidence
   */
  isBulletQuantified(bulletText: string): boolean {
    if (!bulletText) return false;
    for (const pattern of METRIC_PATTERNS) {
      pattern.lastIndex = 0; // reset regex state
      if (pattern.test(bulletText)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper: Estimates total years of experience from experience dates
   */
  estimateYearsOfExperience(resume: ResumeAST): number {
    if (!resume.experiences || resume.experiences.length === 0) return 0;

    let totalMonths = 0;
    const currentYear = new Date().getFullYear();

    for (const exp of resume.experiences) {
      const startYear = this.extractYear(exp.startDate);
      const endYear = exp.current ? currentYear : this.extractYear(exp.endDate) || currentYear;

      if (startYear) {
        const diff = Math.max(0.5, endYear - startYear);
        totalMonths += diff * 12;
      } else {
        totalMonths += 12; // default 1 year per listed role if dates missing
      }
    }

    return Math.round((totalMonths / 12) * 10) / 10;
  }

  private extractYear(dateStr?: string): number | null {
    if (!dateStr) return null;
    const match = dateStr.match(/\b(19\d\d|20\d\d)\b/);
    return match ? parseInt(match[1], 10) : null;
  }

  private checkSeniorityMatch(resume: ResumeAST, targetSeniority?: string): boolean {
    if (!targetSeniority) return true;
    const target = targetSeniority.toUpperCase();
    const candidateHeadline = (resume.personalInfo?.headline || '').toUpperCase();
    const summary = (resume.summary || '').toUpperCase();

    if (candidateHeadline.includes(target) || summary.includes(target)) {
      return true;
    }

    const years = this.estimateYearsOfExperience(resume);
    if (target.includes('SENIOR') || target.includes('LEAD')) {
      return years >= 4;
    }
    if (target.includes('MID')) {
      return years >= 2;
    }
    if (target.includes('ENTRY') || target.includes('JUNIOR')) {
      return true;
    }

    return true;
  }
}
