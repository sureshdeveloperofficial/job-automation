import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ResumeParserService } from '../resume-parser/resume-parser.service.js';
import type { CreateResumeDto } from '@career-os/schemas';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ResumeParserService,
  ) {}

  parseText(rawText: string) {
    return this.parser.parseText(rawText);
  }

  async importAndSyncProfile(userId: string, rawText: string, autoSeedEvidence = true) {
    const parsed = this.parser.parseText(rawText);

    // 1. Fetch or create candidate profile
    let profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.candidateProfile.create({
        data: { userId },
      });
    }

    // 2. Merge extracted skills with existing
    const existingSkills = profile.skills || [];
    const mergedSkills = Array.from(new Set([...existingSkills, ...parsed.skills]));

    // 3. Update candidate profile with parsed data
    await this.prisma.candidateProfile.update({
      where: { userId },
      data: {
        ...(parsed.personalInfo.name && !profile.title && { title: 'Software Engineer' }),
        ...(parsed.personalInfo.phone && !profile.phone && { phone: parsed.personalInfo.phone }),
        ...(parsed.personalInfo.location && !profile.location && { location: parsed.personalInfo.location }),
        ...(parsed.personalInfo.linkedinUrl && !profile.linkedinUrl && { linkedinUrl: parsed.personalInfo.linkedinUrl }),
        ...(parsed.personalInfo.githubUrl && !profile.githubUrl && { githubUrl: parsed.personalInfo.githubUrl }),
        ...(parsed.personalInfo.summary && !profile.summary && { summary: parsed.personalInfo.summary }),
        skills: mergedSkills,
        experiences: parsed.experiences as any,
        education: parsed.education as any,
        certifications: parsed.certifications,
        projects: parsed.projects as any,
      },
    });

    // 4. Optionally seed suggested evidence as PENDING items
    let seededCount = 0;
    if (autoSeedEvidence && parsed.suggestedEvidence.length > 0) {
      for (const ev of parsed.suggestedEvidence) {
        // Prevent duplicate claims for the same user
        const existing = await this.prisma.candidateEvidence.findFirst({
          where: {
            userId,
            claim: ev.claim,
          },
        });

        if (!existing) {
          await this.prisma.candidateEvidence.create({
            data: {
              userId,
              profileId: profile.id,
              category: ev.category,
              claim: ev.claim,
              context: ev.context,
              source: 'RESUME',
              sourceDetail: ev.sourceDetail || 'Resume Parser Import',
              confidenceScore: ev.confidenceScore || 0.85,
              status: 'PENDING',
            },
          });
          seededCount++;
        }
      }
    }

    return {
      parsed,
      seededEvidenceCount: seededCount,
      message: `Successfully parsed resume, updated profile, and generated ${seededCount} evidence candidates for verification.`,
    };
  }

  async listResumes(userId: string) {
    return this.prisma.resume.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        versions: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createResume(userId: string, dto: CreateResumeDto) {
    return this.prisma.resume.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type as any,
        roleProfileId: dto.roleProfileId,
      },
    });
  }

  async getResume(userId: string, id: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!resume || resume.deletedAt) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return resume;
  }
}
