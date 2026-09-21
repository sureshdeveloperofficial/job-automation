import { Injectable } from '@nestjs/common';
import type { ResumeAST, ResumeDiff, ResumeDiffChange } from '@career-os/types';

@Injectable()
export class ResumeDiffService {
  /**
   * Computes a structural, bullet-by-bullet and skill-by-skill diff between a base resume and tailored variant
   */
  computeDiff(base: ResumeAST, tailored: ResumeAST, atsScoreDelta = 0): ResumeDiff {
    const changes: ResumeDiffChange[] = [];

    // 1. Summary diff
    const summaryChanged = (base.summary || '').trim() !== (tailored.summary || '').trim();
    if (summaryChanged) {
      changes.push({
        section: 'summary',
        type: 'MODIFIED',
        description: 'Professional summary tailored specifically to target position and domain requirements',
        details: {
          previous: base.summary,
          current: tailored.summary,
        },
      });
    }

    // 2. Skills diff
    const baseSkills = new Set((base.skills?.core || []).map((s) => s.toLowerCase()));

    const addedToCore = (tailored.skills?.core || []).filter(
      (s) => !baseSkills.has(s.toLowerCase()),
    );

    if (addedToCore.length > 0) {
      changes.push({
        section: 'skills',
        type: 'ADDED',
        description: `Promoted ${addedToCore.length} matching skills to core competencies`,
        details: { addedSkills: addedToCore },
      });
    }

    // 3. Experience & Bullet diff
    let reorderedBulletsCount = 0;
    let evidenceClaimsLinked = 0;

    const baseExpMap = new Map<string, string[]>();
    (base.experiences || []).forEach((exp) => {
      baseExpMap.set(
        exp.company.toLowerCase(),
        (exp.bullets || []).map((b) => (typeof b === 'string' ? b : b.text)),
      );
    });

    (tailored.experiences || []).forEach((exp) => {
      const baseBullets = baseExpMap.get(exp.company.toLowerCase()) || [];
      const currentBullets = (exp.bullets || []).map((b) => (typeof b === 'string' ? b : b.text));

      // Check evidence linking
      (exp.bullets || []).forEach((b) => {
        if (typeof b !== 'string' && b.evidenceId) {
          evidenceClaimsLinked++;
        }
      });

      // Check reordering or alterations
      let isReordered = false;
      if (baseBullets.length > 0 && currentBullets.length > 0) {
        if (baseBullets[0] !== currentBullets[0]) {
          isReordered = true;
          reorderedBulletsCount++;
        }
      }

      if (isReordered) {
        changes.push({
          section: 'experience',
          type: 'REORDERED',
          description: `Reordered top achievement bullets for ${exp.company} to align with target role priorities`,
          details: { company: exp.company },
        });
      }
    });

    return {
      addedSkills: addedToCore,
      reorderedBulletsCount,
      evidenceClaimsLinked,
      summaryChanged,
      atsScoreDelta,
      changes,
    };
  }
}
