import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { JDSnapshot } from '@career-os/types';

@Injectable()
export class JdSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Captures an immutable snapshot of raw and cleaned JD content
   */
  async captureSnapshot(
    jobId: string,
    rawJd: string,
    cleanedText: string,
    source: string,
    sourceJobId?: string,
    sourceUrl?: string,
  ): Promise<JDSnapshot> {
    const contentHash = crypto
      .createHash('sha256')
      .update(cleanedText || rawJd)
      .digest('hex');

    const snapshot = await this.prisma.jDSnapshot.create({
      data: {
        jobId,
        rawJd,
        rawHtml: rawJd,
        cleanedText,
        normalizedJd: cleanedText,
        contentHash,
        source,
        sourceJobId,
        sourceUrl,
      },
    });

    return {
      id: snapshot.id,
      jobId: snapshot.jobId,
      rawJd: snapshot.rawJd,
      rawHtml: snapshot.rawHtml ?? undefined,
      cleanedText: snapshot.cleanedText ?? undefined,
      normalizedJd: snapshot.normalizedJd ?? undefined,
      contentHash: snapshot.contentHash,
      capturedAt: snapshot.capturedAt,
      source: snapshot.source,
      sourceJobId: snapshot.sourceJobId ?? undefined,
      sourceUrl: snapshot.sourceUrl ?? undefined,
    };
  }

  /**
   * Retrieves the latest snapshot for a specific job
   */
  async getSnapshot(jobId: string): Promise<JDSnapshot | null> {
    const snapshot = await this.prisma.jDSnapshot.findFirst({
      where: { jobId },
      orderBy: { capturedAt: 'desc' },
    });

    if (!snapshot) return null;

    return {
      id: snapshot.id,
      jobId: snapshot.jobId,
      rawJd: snapshot.rawJd,
      rawHtml: snapshot.rawHtml ?? undefined,
      cleanedText: snapshot.cleanedText ?? undefined,
      normalizedJd: snapshot.normalizedJd ?? undefined,
      contentHash: snapshot.contentHash,
      capturedAt: snapshot.capturedAt,
      source: snapshot.source,
      sourceJobId: snapshot.sourceJobId ?? undefined,
      sourceUrl: snapshot.sourceUrl ?? undefined,
    };
  }
}
