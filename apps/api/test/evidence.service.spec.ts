import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvidenceService } from '../src/evidence/evidence.service.js';

describe('EvidenceService', () => {
  let service: EvidenceService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      candidateProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      candidateEvidence: {
        findMany: vi.fn(),
        groupBy: vi.fn().mockResolvedValue([
          { status: 'PENDING', _count: 3 },
          { status: 'VERIFIED', _count: 5 },
        ]),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new EvidenceService(prismaMock);
  });

  it('should list evidence items and status counts', async () => {
    const mockItems = [
      { id: '1', claim: 'Built NestJS service', status: 'VERIFIED' },
      { id: '2', claim: 'Scaled Redis cache', status: 'PENDING' },
    ];
    prismaMock.candidateEvidence.findMany.mockResolvedValue(mockItems);

    const result = await service.getEvidence('user-1');
    expect(result.items).toEqual(mockItems);
    expect(result.counts.VERIFIED).toBe(5);
    expect(result.counts.PENDING).toBe(3);
  });

  it('should verify evidence claim and set verifiedAt timestamp', async () => {
    prismaMock.candidateEvidence.findUnique.mockResolvedValue({
      id: 'e-1',
      userId: 'user-1',
      status: 'PENDING',
    });
    prismaMock.candidateEvidence.update.mockResolvedValue({
      id: 'e-1',
      userId: 'user-1',
      status: 'VERIFIED',
      verifiedAt: new Date(),
    });

    const result = await service.verifyEvidence('user-1', 'e-1', {
      status: 'VERIFIED',
      verifierNotes: 'Verified via GitHub PR #42',
    });

    expect(result.status).toBe('VERIFIED');
    expect(prismaMock.candidateEvidence.update).toHaveBeenCalledWith({
      where: { id: 'e-1' },
      data: expect.objectContaining({
        status: 'VERIFIED',
        verifierNotes: 'Verified via GitHub PR #42',
      }),
    });
  });
});
