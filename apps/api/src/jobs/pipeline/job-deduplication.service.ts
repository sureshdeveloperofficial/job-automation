import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JobDeduplicationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a deterministic SHA-256 content hash for duplicate detection
   */
  computeContentHash(company: string, title: string, location: string, description: string): string {
    const cleanCompany = (company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanTitle = (title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanLocation = (location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    // Strip HTML and take normalized first 500 chars of body
    const cleanBody = (description || '')
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);

    const payload = `${cleanCompany}|${cleanTitle}|${cleanLocation}|${cleanBody}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Checks if a duplicate job posting exists by sourceJobId or content hash
   */
  async findDuplicate(
    companyId: string,
    contentHash: string,
    source?: string,
    sourceJobId?: string,
  ): Promise<{ exists: boolean; jobId?: string }> {
    // 1. Check unique source + sourceJobId
    if (source && sourceJobId) {
      const bySource = await this.prisma.job.findUnique({
        where: {
          source_sourceJobId: {
            source,
            sourceJobId,
          },
        },
        select: { id: true },
      });
      if (bySource) {
        return { exists: true, jobId: bySource.id };
      }
    }

    // 2. Check content hash within company
    const byHash = await this.prisma.job.findFirst({
      where: {
        companyId,
        contentHash,
        isActive: true,
      },
      select: { id: true },
    });

    if (byHash) {
      return { exists: true, jobId: byHash.id };
    }

    return { exists: false };
  }

  /**
   * Updates lastSeenAt on an existing duplicate job listing
   */
  async touchJob(jobId: string): Promise<void> {
    await this.prisma.job.update({
      where: { id: jobId },
      data: { lastSeenAt: new Date() },
    });
  }
}
