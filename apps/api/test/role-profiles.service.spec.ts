import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleProfilesService } from '../src/role-profiles/role-profiles.service.js';

describe('RoleProfilesService', () => {
  let service: RoleProfilesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      roleProfile: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      userPreferences: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    };
    service = new RoleProfilesService(prismaMock);
  });

  it('should list role profiles with isDefault flag', async () => {
    prismaMock.userPreferences.findUnique.mockResolvedValue({
      defaultRoleProfileId: 'rp-1',
    });
    prismaMock.roleProfile.findMany.mockResolvedValue([
      { id: 'rp-1', targetTitle: 'Backend Engineer' },
      { id: 'rp-2', targetTitle: 'DevOps Engineer' },
    ]);

    const result = await service.getRoleProfiles('user-1');
    expect(result[0].isDefault).toBe(true);
    expect(result[1].isDefault).toBe(false);
  });

  it('should set default role profile in user preferences', async () => {
    prismaMock.roleProfile.findUnique.mockResolvedValue({
      id: 'rp-2',
      userId: 'user-1',
      deletedAt: null,
    });
    prismaMock.userPreferences.upsert.mockResolvedValue({
      userId: 'user-1',
      defaultRoleProfileId: 'rp-2',
    });

    const result = await service.setDefault('user-1', 'rp-2');
    expect(result.success).toBe(true);
    expect(result.defaultRoleProfileId).toBe('rp-2');
  });
});
