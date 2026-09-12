import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service.js';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
    };
    service = new UsersService(mockPrisma);
  });

  it('should find user by id when exists', async () => {
    const mockUser = {
      id: 'usr-123',
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: 'Dev',
      role: 'CANDIDATE',
      isEmailVerified: false,
      createdAt: new Date(),
      profile: null,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

    const result = await service.findById('usr-123');
    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'usr-123', deletedAt: null },
      select: expect.any(Object),
    });
  });

  it('should throw NotFoundException when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should find user by lowercase email', async () => {
    const mockUser = { id: 'usr-1', email: 'alex@example.com' };
    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

    const result = await service.findByEmail('ALEX@EXAMPLE.COM');
    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'alex@example.com', deletedAt: null },
    });
  });
});
