/// <reference types="multer" />
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ResumeParserService } from '../resume-parser/resume-parser.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import type { CreateResumeDto } from '@career-os/schemas';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ResumeParserService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Uploads resume document to Cloudinary, extracts text, synchronizes profile and seeds evidence
   */
  async uploadAndParseResume(
    userId: string,
    file: Express.Multer.File,
    resumeName?: string,
    autoSeedEvidence = true,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No resume file provided');
    }

    // 1. Extract text from uploaded document
    const rawText = await this.parser.extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);

    // 2. Upload document to Cloudinary storage
    const uploadResult = await this.cloudinary.uploadDocument(
      file.buffer,
      file.originalname,
      'job-automation/resumes',
    );

    // 3. Deterministically parse and sync candidate profile
    const syncResult = await this.importAndSyncProfile(userId, rawText, autoSeedEvidence);

    // 4. Create Resume and ResumeVersion record with Cloudinary fileKey
    const resume = await this.prisma.resume.create({
      data: {
        userId,
        name: resumeName || file.originalname.replace(/\.[^/.]+$/, ''),
        type: 'MASTER',
        versions: {
          create: {
            version: 1,
            fileKey: uploadResult.secureUrl,
            mimeType: file.mimetype,
            fileSizeBytes: file.size || uploadResult.bytes,
            isActive: true,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return {
      resume,
      cloudinary: {
        publicId: uploadResult.publicId,
        url: uploadResult.secureUrl,
        bytes: uploadResult.bytes,
      },
      parsed: syncResult.parsed,
      seededEvidenceCount: syncResult.seededEvidenceCount,
      message: `Resume uploaded to Cloudinary successfully. Extracted ${syncResult.parsed.skills.length} skills and seeded ${syncResult.seededEvidenceCount} evidence candidates.`,
    };
  }


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
