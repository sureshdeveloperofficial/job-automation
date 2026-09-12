import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateEvidenceDto,
  UpdateEvidenceDto,
  VerifyEvidenceDto,
  BulkVerifyEvidenceDto,
  EvidenceFilterDto,
} from '@career-os/schemas';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvidence(userId: string, filters?: EvidenceFilterDto) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = {
        contains: filters.category,
        mode: 'insensitive',
      };
    }

    if (filters?.search) {
      where.OR = [
        { claim: { contains: filters.search, mode: 'insensitive' } },
        { context: { contains: filters.search, mode: 'insensitive' } },
        { sourceDetail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.candidateEvidence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const counts = await this.prisma.candidateEvidence.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const statusCounts = {
      PENDING: 0,
      VERIFIED: 0,
      REJECTED: 0,
    };

    for (const c of counts) {
      statusCounts[c.status as keyof typeof statusCounts] = c._count;
    }

    return {
      items,
      total: items.length,
      counts: statusCounts,
    };
  }

  async createEvidence(userId: string, dto: CreateEvidenceDto) {
    let profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.candidateProfile.create({
        data: { userId },
      });
    }

    return this.prisma.candidateEvidence.create({
      data: {
        userId,
        profileId: profile.id,
        category: dto.category,
        claim: dto.claim,
        context: dto.context,
        source: dto.source as any,
        sourceDetail: dto.sourceDetail,
        confidenceScore: dto.confidenceScore ?? 1.0,
        status: 'PENDING',
      },
    });
  }

  async updateEvidence(userId: string, id: string, dto: UpdateEvidenceDto) {
    const evidence = await this.prisma.candidateEvidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence record not found');
    }

    if (evidence.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this evidence');
    }

    return this.prisma.candidateEvidence.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.claim !== undefined && { claim: dto.claim }),
        ...(dto.context !== undefined && { context: dto.context }),
        ...(dto.source !== undefined && { source: dto.source as any }),
        ...(dto.sourceDetail !== undefined && { sourceDetail: dto.sourceDetail }),
        ...(dto.confidenceScore !== undefined && { confidenceScore: dto.confidenceScore }),
      },
    });
  }

  async verifyEvidence(userId: string, id: string, dto: VerifyEvidenceDto) {
    const evidence = await this.prisma.candidateEvidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence record not found');
    }

    if (evidence.userId !== userId) {
      throw new ForbiddenException('You do not have permission to verify this evidence');
    }

    return this.prisma.candidateEvidence.update({
      where: { id },
      data: {
        status: dto.status as any,
        verifierNotes: dto.verifierNotes,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
      },
    });
  }

  async bulkVerify(userId: string, dto: BulkVerifyEvidenceDto) {
    const res = await this.prisma.candidateEvidence.updateMany({
      where: {
        id: { in: dto.ids },
        userId,
      },
      data: {
        status: dto.status as any,
        verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
      },
    });

    return {
      updatedCount: res.count,
      status: dto.status,
    };
  }

  async deleteEvidence(userId: string, id: string) {
    const evidence = await this.prisma.candidateEvidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence record not found');
    }

    if (evidence.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this evidence');
    }

    await this.prisma.candidateEvidence.delete({
      where: { id },
    });

    return { deleted: true, id };
  }
}
