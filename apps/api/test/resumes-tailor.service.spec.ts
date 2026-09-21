import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResumesService } from '../src/resumes/resumes.service.js';
import { AtsScorerService } from '../src/resumes/ats-scorer/ats-scorer.service.js';
import { ResumeTailoringService } from '../src/resumes/tailoring/resume-tailoring.service.js';
import { ResumeDiffService } from '../src/resumes/diff/resume-diff.service.js';
import { ResumeExportService } from '../src/resumes/export/resume-export.service.js';
import { JdAnalyzerService } from '../src/jd-analysis/jd-analyzer.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import type { ResumeParserService } from '../src/resume-parser/resume-parser.service.js';
import type { CloudinaryService } from '../src/storage/cloudinary.service.js';
import type { ResumeAST } from '@career-os/types';

describe('ResumesService (Phase 4 Tailoring & Version Control)', () => {
  let service: ResumesService;
  let prismaMock: any;
  let parserMock: any;
  let cloudinaryMock: any;

  const mockAst: ResumeAST = {
    personalInfo: {
      fullName: 'Suresh Kumar',
      email: 'suresh@example.com',
      headline: 'Backend Developer',
    },
    summary: 'Backend developer with experience in Node.js and SQL.',
    skills: {
      core: ['Node.js', 'SQL'],
      secondary: ['PostgreSQL', 'Docker'],
      tools: ['Git'],
    },
    experiences: [
      {
        company: 'Innovate Labs',
        role: 'Backend Developer',
        startDate: '2022',
        endDate: '2026',
        current: true,
        bullets: [
          { text: 'Built REST APIs in Node.js serving 500k daily requests.', metrics: ['500k'] },
        ],
      },
    ],
    education: [
      {
        institution: 'PSG Tech',
        degree: 'B.Tech IT',
      },
    ],
  };

  const mockResume = {
    id: 'resume-uuid-1',
    userId: 'user-uuid-1',
    name: 'Master Resume',
    type: 'MASTER',
    deletedAt: null,
    versions: [
      {
        id: 'version-uuid-1',
        resumeId: 'resume-uuid-1',
        version: 1,
        fileKey: 'https://cloudinary.com/resume.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 24000,
        structuredData: mockAst,
        isActive: true,
      },
    ],
  };

  beforeEach(() => {
    prismaMock = {
      resume: {
        findUnique: vi.fn().mockResolvedValue(mockResume),
        findMany: vi.fn().mockResolvedValue([mockResume]),
        create: vi.fn(),
      },
      resumeVersion: {
        create: vi.fn().mockImplementation(({ data }) => ({
          id: 'version-uuid-2',
          ...data,
          createdAt: new Date(),
        })),
        update: vi.fn().mockResolvedValue({ id: 'version-uuid-1' }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'version-uuid-2',
            resumeId: 'resume-uuid-1',
            version: 2,
            targetJobId: 'job-uuid-1',
            targetCompany: 'Razorpay',
            atsScore: 92,
            evidenceBindings: ['ev-1'],
            fileKey: 'inline://tailored-v2',
            createdAt: new Date(),
            resume: mockResume,
            targetJob: { title: 'Senior Backend Engineer', company: { name: 'Razorpay' } },
          },
        ]),
        findUnique: vi.fn().mockResolvedValue({
          id: 'version-uuid-2',
          resumeId: 'resume-uuid-1',
          version: 2,
          structuredData: mockAst,
          targetCompany: 'Razorpay',
          atsScore: 92,
          diffSummary: {
            addedSkills: ['PostgreSQL'],
            reorderedBulletsCount: 1,
            evidenceClaimsLinked: 1,
            summaryChanged: true,
            atsScoreDelta: 15,
            changes: [],
          },
          resume: mockResume,
          targetJob: { title: 'Senior Backend Engineer', company: { name: 'Razorpay' } },
        }),
      },
      candidateEvidence: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ev-1',
            claim: 'Built REST APIs in Node.js serving 500k daily requests.',
            category: 'SYSTEM_PERFORMANCE',
            context: 'Innovate Labs backend',
            sourceDetail: 'Innovate Labs',
          },
        ]),
      },
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'job-uuid-1',
          title: 'Senior Backend Engineer',
          company: { name: 'Razorpay' },
          requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
          preferredSkills: ['Redis'],
          seniority: 'SENIOR',
          experienceMinYears: 3,
        }),
      },
    };

    parserMock = {};
    cloudinaryMock = {};

    const atsScorer = new AtsScorerService();
    const diffService = new ResumeDiffService();
    const tailoringService = new ResumeTailoringService(atsScorer, diffService);
    const exportService = new ResumeExportService();
    const jdAnalyzer = new JdAnalyzerService();

    service = new ResumesService(
      prismaMock as PrismaService,
      parserMock as ResumeParserService,
      cloudinaryMock as CloudinaryService,
      atsScorer,
      tailoringService,
      diffService,
      exportService,
      jdAnalyzer,
    );
  });

  it('should score a resume deterministically against a target job', async () => {
    const result = await service.scoreResume('user-uuid-1', 'resume-uuid-1', {
      jobId: 'job-uuid-1',
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.breakdown.requiredSkills.matched).toContain('Node.js');
    expect(prismaMock.resumeVersion.update).toHaveBeenCalled();
  });

  it('should generate an evidence-backed tailored resume variant and create a new ResumeVersion', async () => {
    const result = await service.tailorResume('user-uuid-1', 'resume-uuid-1', {
      jobId: 'job-uuid-1',
      targetCompanyName: 'Razorpay',
      templateStyle: 'MODERN',
    });

    expect(result.version.version).toBe(2);
    expect(result.tailoredResume.skills.core).toContain('PostgreSQL');
    expect(result.tailoredResume.personalInfo.headline).toBe('Senior Backend Engineer');
    expect(result.htmlPreview).toContain('Senior Backend Engineer');
    expect(prismaMock.resumeVersion.create).toHaveBeenCalled();
  });

  it('should list variants and export semantic ATS HTML and plain ASCII text', async () => {
    const variants = await service.listVariants('user-uuid-1');
    expect(variants.length).toBe(1);
    expect(variants[0].targetCompany).toBe('Razorpay');

    const htmlExport = await service.exportVariant('user-uuid-1', 'version-uuid-2', 'html');
    expect(htmlExport.html).toContain('<!DOCTYPE html>');
    expect(htmlExport.html).toContain('Suresh Kumar');

    const textExport = await service.exportVariant('user-uuid-1', 'version-uuid-2', 'text');
    expect(textExport.text).toContain('SURESH KUMAR');
    expect(textExport.text).toContain('PROFESSIONAL EXPERIENCE');
  });
});
