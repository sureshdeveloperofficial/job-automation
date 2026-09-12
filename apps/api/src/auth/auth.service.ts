import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SignUpDto, SignInDto } from '@career-os/schemas';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: SignUpDto): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        profile: {
          create: {
            profileHealthScore: 0,
          },
        },
        preferences: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  async signIn(dto: SignInDto): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  async refresh(token: string): Promise<TokenPair> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, role: true, deletedAt: true } } },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token expired, please sign in again');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );
  }

  async signOut(token: string): Promise<void> {
    await this.prisma.refreshToken
      .update({
        where: { token },
        data: { isRevoked: true },
      })
      .catch(() => {
        // Token not found is not an error on sign out
      });
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<TokenPair> {
    const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
    const jwtExpiry = this.config.get<string>('JWT_EXPIRY', '15m');
    const refreshExpiryDays = parseInt(
      this.config.get<string>('REFRESH_TOKEN_EXPIRY_DAYS', '7'),
      10,
    );

    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: (jwtExpiry as any),
    });

    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
