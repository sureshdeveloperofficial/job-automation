import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileService } from '../src/profile/profile.service.js';

describe('ProfileService', () => {
  let service: ProfileService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      candidateProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      candidateEvidence: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    service = new ProfileService(prismaMock);
  });

  it('should calculate accurate health score with all fields filled', async () => {
    const fullProfile = {
      title: 'Senior Backend Engineer',
      location: 'San Francisco, CA',
      phone: '555-123-4567',
      linkedinUrl: 'https://linkedin.com/in/test',
      experiences: [{ title: 'Engineer', company: 'Acme', bullets: ['Built API'] }],
      skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
      education: [{ degree: 'BS CS', institution: 'UC Berkeley' }],
      evidence: [
        { id: '1', status: 'VERIFIED', claim: 'Built API' },
        { id: '2', status: 'VERIFIED', claim: 'Scaled Redis' },
      ],
    };

    const health = await service.calculateHealthScore('user-1', fullProfile);
    expect(health.score).toBe(100);
    expect(health.breakdown.personalInfo).toBe(20);
    expect(health.breakdown.experience).toBe(25);
    expect(health.breakdown.skills).toBe(20);
    expect(health.breakdown.education).toBe(15);
    expect(health.breakdown.evidence).toBe(20);
    expect(health.completedItems.length).toBeGreaterThan(0);
  });

  it('should reflect lower score and actionable recommendations for empty profile', async () => {
    const emptyProfile = {
      title: null,
      location: null,
      phone: null,
      linkedinUrl: null,
      experiences: [],
      skills: [],
      education: [],
      evidence: [],
    };

    const health = await service.calculateHealthScore('user-2', emptyProfile);
    expect(health.score).toBe(0);
    expect(health.recommendations.length).toBeGreaterThan(0);
    expect(health.pendingItems.length).toBeGreaterThan(0);
  });
});
