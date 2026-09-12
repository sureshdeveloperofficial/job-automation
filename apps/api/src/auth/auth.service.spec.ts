import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock-access-token'),
    };

    mockConfig = {
      getOrThrow: vi.fn().mockReturnValue('super-secret-key'),
      get: vi.fn().mockImplementation((key: string, def: string) => def),
    };

    service = new AuthService(mockPrisma, mockJwtService, mockConfig);
  });

  describe('signUp', () => {
    it('should throw ConflictException if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'usr-1', email: 'test@example.com' });

      await expect(
        service.signUp({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password and create user with tokens on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never);

      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'usr-new',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
      });

      const result = await service.signUp({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.user.id).toBe('usr-new');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBeDefined();
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.signIn({
          email: 'notfound@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'usr-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      });
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(
        service.signIn({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user and tokens on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'usr-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
        passwordHash: 'hashed-password',
      });
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.signIn({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBeDefined();
    });
  });
});
