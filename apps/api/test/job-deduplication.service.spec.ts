import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDeduplicationService } from '../src/jobs/pipeline/job-deduplication.service.js';

describe('JobDeduplicationService', () => {
  let service: JobDeduplicationService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      job: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new JobDeduplicationService(prismaMock);
  });

  it('should generate consistent SHA-256 content hashes regardless of formatting', () => {
    const hash1 = service.computeContentHash(
      'Zoho Corporation',
      'Senior Backend Engineer',
      'Coimbatore',
      '<p>Architect high-throughput microservices using Node.js.</p>',
    );
    const hash2 = service.computeContentHash(
      'zoho corporation',
      'senior backend engineer',
      'coimbatore',
      '<div>Architect high-throughput microservices using Node.js.</div>',
    );
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string
  });

  it('should recognize duplicate by source and sourceJobId', async () => {
    prismaMock.job.findUnique.mockResolvedValue({ id: 'job-123' });

    const result = await service.findDuplicate('comp-1', 'hash-xyz', 'GREENHOUSE', 'gh-456');
    expect(result.exists).toBe(true);
    expect(result.jobId).toBe('job-123');
  });

  it('should recognize duplicate by contentHash within same company', async () => {
    prismaMock.job.findUnique.mockResolvedValue(null);
    prismaMock.job.findFirst.mockResolvedValue({ id: 'job-789' });

    const result = await service.findDuplicate('comp-1', 'hash-xyz', 'MANUAL');
    expect(result.exists).toBe(true);
    expect(result.jobId).toBe('job-789');
  });

  it('should touch lastSeenAt for existing job', async () => {
    await service.touchJob('job-123');
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job-123' },
      data: expect.objectContaining({
        lastSeenAt: expect.any(Date),
      }),
    });
  });
});
