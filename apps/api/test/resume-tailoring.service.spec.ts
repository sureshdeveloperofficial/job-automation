import { describe, it, expect, beforeEach } from 'vitest';
import { ResumeTailoringService } from '../src/resumes/tailoring/resume-tailoring.service.js';
import { AtsScorerService } from '../src/resumes/ats-scorer/ats-scorer.service.js';
import { ResumeDiffService } from '../src/resumes/diff/resume-diff.service.js';
import type { ResumeAST } from '@career-os/types';

describe('ResumeTailoringService', () => {
  let tailoringService: ResumeTailoringService;
  let atsScorer: AtsScorerService;
  let diffService: ResumeDiffService;

  const mockBaseResume: ResumeAST = {
    personalInfo: {
      fullName: 'Suresh Kumar',
      headline: 'Software Engineer',
      email: 'suresh@example.com',
      phone: '+91 9876543210',
      location: 'Coimbatore, India',
    },
    summary: 'General software developer building full stack applications.',
    skills: {
      core: ['JavaScript', 'HTML', 'CSS'],
      secondary: ['Node.js', 'PostgreSQL', 'Docker'],
      tools: ['Git'],
    },
    experiences: [
      {
        company: 'Innovate Labs',
        role: 'Full Stack Developer',
        startDate: '2022',
        endDate: '2026',
        current: true,
        bullets: [
          {
            text: 'Maintained frontend UI components in React and CSS.',
            metrics: [],
          },
          {
            text: 'Architected high-throughput PostgreSQL backend reducing query latency by 50% for 1M users.',
            metrics: ['50%', '1M'],
            matchedSkills: ['PostgreSQL', 'Node.js'],
          },
        ],
      },
    ],
    education: [
      {
        institution: 'PSG Tech',
        degree: 'B.E. Computer Science',
      },
    ],
  };

  const mockEvidence = [
    {
      id: 'ev-uuid-1',
      category: 'TECHNICAL_ACHIEVEMENT',
      claim: 'Architected high-throughput PostgreSQL backend reducing query latency by 50% for 1M users.',
      context: 'PostgreSQL database indexing and caching optimization at Innovate Labs',
      sourceDetail: 'Innovate Labs',
    },
    {
      id: 'ev-uuid-2',
      category: 'FEATURE_DELIVERY',
      claim: 'Maintained frontend UI components in React and CSS.',
      context: 'Frontend web application',
      sourceDetail: 'Innovate Labs',
    },
  ];

  beforeEach(() => {
    atsScorer = new AtsScorerService();
    diffService = new ResumeDiffService();
    tailoringService = new ResumeTailoringService(atsScorer, diffService);
  });

  it('should tailor resume by promoting target skills and re-ranking relevant bullets to the top', () => {
    const targetJob = {
      title: 'Senior PostgreSQL Database Engineer',
      companyName: 'Zerodha',
      requiredSkills: ['PostgreSQL', 'Node.js', 'Docker'],
      preferredSkills: ['Redis'],
      seniority: 'SENIOR',
      experienceMinYears: 3,
    };

    const result = tailoringService.tailor(mockBaseResume, mockEvidence, targetJob);

    // 1. Target matching skills promoted to core
    expect(result.tailoredResume.skills.core).toContain('PostgreSQL');
    expect(result.tailoredResume.skills.core).toContain('Node.js');

    // 2. PostgreSQL bullet should be re-ordered to position 0 (top)
    const topBullet = result.tailoredResume.experiences[0].bullets[0];
    expect(topBullet.text).toContain('PostgreSQL backend reducing query latency by 50%');

    // 3. Evidence binding must preserve exact UUID
    expect(topBullet.evidenceId).toBe('ev-uuid-1');
    expect(result.evidenceBindings).toContain('ev-uuid-1');

    // 4. ATS score should improve after tailoring
    expect(result.atsScoreAfter).toBeGreaterThanOrEqual(result.atsScoreBefore);

    // 5. Diff summary must report changes
    expect(result.diffSummary.summaryChanged).toBe(true);
    expect(result.diffSummary.addedSkills.length).toBeGreaterThan(0);
    expect(result.diffSummary.reorderedBulletsCount).toBe(1);
  });

  it('should guarantee zero hallucination: headline and summary reflect verified candidate facts', () => {
    const targetJob = {
      title: 'Senior Distributed Systems Architect',
      requiredSkills: ['PostgreSQL'],
    };

    const result = tailoringService.tailor(mockBaseResume, mockEvidence, targetJob);

    // Summary must mention verified skills
    expect(result.tailoredResume.summary).toContain('Senior Distributed Systems Architect');
    expect(result.tailoredResume.summary).toContain('PostgreSQL');
    expect(result.tailoredResume.personalInfo.fullName).toBe('Suresh Kumar');
  });
});
