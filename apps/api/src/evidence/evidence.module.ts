import { Module } from '@nestjs/common';
import { EvidenceService } from './evidence.service.js';
import { EvidenceController } from './evidence.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
