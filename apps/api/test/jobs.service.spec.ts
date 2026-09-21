import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsService } from '../src/jobs/jobs.service.js';
import { JobNormalizerService } from '../src/jobs/pipeline/job-normalizer.service.js';
import { SeniorityLevel } from '@career-os/types';

describe('JobsService', () => {
  let service: JobsService;
  let prismaMock: any;
  let normalizer: JobNormalizerService;
  let deduplicationMock: any;
  let jdAnalyzerMock: any;
  let jdSnapshotMock: any;
  let greenhouseMock: any;
  let leverMock: any;
  let seedMock: any;

  beforeEach(() => {
    prismaMock = {
      job: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      company: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      candidateProfile: {
        findUnique: vi.fn(),
      },
      jDSnapshot: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    normalizer = new JobNormalizerService();

    deduplicationMock = {
      computeContentHash: vi.fn().mockReturnValue('mock-sha256-hash'),
      findDuplicate: vi.fn().mockResolvedValue({ exists: false }),
      touchJob: vi.fn().mockResolvedValue(undefined),
    };

    jdAnalyzerMock = {
      analyze: vi.fn().mockReturnValue({
        seniority: SeniorityLevel.SENIOR,
        requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        preferredSkills: ['Redis', 'Docker'],
        responsibilities: ['Build distributed systems'],
        degrees: ["Bachelor's Degree"],
        cleanedText: 'Cleaned description text',
      }),
    };

    jdSnapshotMock = {
      captureSnapshot: vi.fn().mockResolvedValue({ id: 'snap-1' }),
      getSnapshot: vi.fn().mockResolvedValue(null),
    };

    greenhouseMock = { fetchJobs: vi.fn().mockResolvedValue({ jobs: [] }) };
    leverMock = { fetchJobs: vi.fn().mockResolvedValue({ jobs: [] }) };
    seedMock = {
      fetchJobs: vi.fn().mockResolvedValue({
        jobs: [
          {
            source: 'SEED',
            sourceJobId: 'seed-1',
            companyName: 'Zoho',
            title: 'Senior Backend Engineer',
            rawDescription: 'Node.js developer',
          },
        ],
      }),
    };

    service = new JobsService(
      prismaMock,
      normalizer,
      deduplicationMock,
      jdAnalyzerMock,
      jdSnapshotMock,
      greenhouseMock,
      leverMock,
      seedMock,
    );
  });

  describe('searchJobs', () => {
    it('should query jobs with pagination and map database rows', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          companyId: 'comp-1',
          title: 'Senior Backend Engineer',
          normalizedTitle: 'Senior Backend Engineer',
          description: 'Distributed systems in Node.js',
          location: 'Coimbatore, Tamil Nadu',
          city: 'Coimbatore',
          workMode: 'HYBRID',
          employmentType: 'FULL_TIME',
          seniority: 'SENIOR',
          salaryMin: 2000000,
          salaryMax: 3000000,
          salaryCurrency: 'INR',
          salaryPeriod: 'YEARLY',
          requiredSkills: ['Node.js', 'PostgreSQL'],
          preferredSkills: ['Redis'],
          responsibilities: ['Scale services'],
          source: 'SEED',
          contentHash: 'hash-1',
          isActive: true,
          postedAt: new Date(),
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          company: {
            id: 'comp-1',
            name: 'Zoho',
            normalizedName: 'zoho',
            isHiringNow: true,
            activeJobsCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      prismaMock.job.count.mockResolvedValue(1);
      prismaMock.job.findMany.mockResolvedValue(mockJobs);

      const result = await service.searchJobs({
        query: 'backend',
        freshness: 'LAST_7_DAYS',
        page: 1,
        pageSize: 20,
        sortBy: 'postedAt',
        sortOrder: 'desc',
      });

      expect(result.total).toBe(1);
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].title).toBe('Senior Backend Engineer');
      expect(result.jobs[0].company?.name).toBe('Zoho');
    });
  });

  describe('ingestJob', () => {
    it('should resolve company, analyze JD, and create job and snapshot', async () => {
      prismaMock.company.findFirst.mockResolvedValue({
        id: 'comp-1',
        name: 'Razorpay',
        normalizedName: 'razorpay',
      });

      prismaMock.job.create.mockResolvedValue({
        id: 'job-new-1',
        companyId: 'comp-1',
        title: 'Staff Full Stack Engineer',
        normalizedTitle: 'Staff Full Stack Engineer',
        description: 'Cleaned description text',
        location: 'Bangalore, India',
        workMode: 'HYBRID',
        seniority: 'STAFF',
        contentHash: 'mock-sha256-hash',
        source: 'MANUAL',
        isActive: true,
        postedAt: new Date(),
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        company: {
          id: 'comp-1',
          name: 'Razorpay',
          normalizedName: 'razorpay',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await service.ingestJob({
        companyName: 'Razorpay',
        title: 'Staff Full Stack Engineer',
        description: 'React and Node.js microservices with PostgreSQL',
        location: 'Bangalore, India',
        workMode: 'HYBRID',
        employmentType: 'FULL_TIME',
        seniority: 'STAFF',
        salaryCurrency: 'INR',
        salaryPeriod: 'YEARLY',
        requiredSkills: ['React', 'Node.js'],
        preferredSkills: ['Redis'],
        responsibilities: ['Architect merchant dashboard'],
        experienceMinYears: 6,
        country: 'India',
        source: 'MANUAL',
      });

      expect(result.isNew).toBe(true);
      expect(result.job.id).toBe('job-new-1');
      expect(jdSnapshotMock.captureSnapshot).toHaveBeenCalledWith(
        'job-new-1',
        expect.any(String),
        expect.any(String),
        'MANUAL',
        undefined,
        undefined,
      );
      expect(prismaMock.company.update).toHaveBeenCalled();
    });
  });

  describe('syncConnectors', () => {
    it('should trigger seed connector ingestion', async () => {
      prismaMock.company.findFirst.mockResolvedValue({ id: 'comp-1', name: 'Zoho' });
      prismaMock.job.create.mockResolvedValue({
        id: 'job-seed-1',
        companyId: 'comp-1',
        title: 'Senior Backend Engineer',
        normalizedTitle: 'Senior Backend Engineer',
        description: 'Desc',
        contentHash: 'mock-sha256-hash',
        source: 'SEED',
        isActive: true,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.syncConnectors({ source: 'SEED' });
      expect(result.totalIngested).toBe(1);
      expect(result.totalNew).toBe(1);
    });
  });
});
