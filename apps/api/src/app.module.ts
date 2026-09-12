import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { HealthModule } from './health/health.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { EvidenceModule } from './evidence/evidence.module.js';
import { RoleProfilesModule } from './role-profiles/role-profiles.module.js';
import { ResumesModule } from './resumes/resumes.module.js';
import { ResumeParserModule } from './resume-parser/resume-parser.module.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
          : undefined,
      },
    }),
    // Config — loaded from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),
          limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
        },
      ],
    }),

    // Queue system
    BullModule.forRoot({
      connection: {
        url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
      },
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    HealthModule,
    ProfileModule,
    EvidenceModule,
    RoleProfilesModule,
    ResumesModule,
    ResumeParserModule,
  ],
})
export class AppModule {}
