/// <reference types="multer" />
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ResumeParserService } from '../resume-parser/resume-parser.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { AtsScorerService, type JobTargetSpec } from './ats-scorer/ats-scorer.service.js';
import { ResumeTailoringService } from './tailoring/resume-tailoring.service.js';
import { ResumeDiffService } from './diff/resume-diff.service.js';
import { ResumeExportService } from './export/resume-export.service.js';
import { JdAnalyzerService } from '../jd-analysis/jd-analyzer.service.js';
import type {
  CreateResumeDto,
  ScoreResumeDto,
  TailorResumeDto,
} from '@career-os/schemas';
import { ResumeTemplateStyle } from '@career-os/types';
import type {
  ResumeAST,
  ResumeVariant,
} from '@career-os/types';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ResumeParserService,
    private readonly cloudinary: CloudinaryService,
    private readonly atsScorer: AtsScorerService,
    private readonly tailoringService: ResumeTailoringService,
    private readonly diffService: ResumeDiffService,
    private readonly exportService: ResumeExportService,
    private readonly jdAnalyzer: JdAnalyzerService,
  ) {}

  /**
   * Uploads resume document to Cloudinary, extracts text, synchronizes profile, and seeds evidence
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
    const rawText = await this.parser.extractTextFromBuffer(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    // 2. Upload document to Cloudinary storage
    const uploadResult = await this.cloudinary.uploadDocument(
      file.buffer,
      file.originalname,
      'job-automation/resumes',
    );

    // 3. Deterministically parse and sync candidate profile
    const syncResult = await this.importAndSyncProfile(userId, rawText, autoSeedEvidence);

    // 4. Initial structured AST
    const initialAst: ResumeAST = {
      personalInfo: {
        fullName: syncResult.parsed.personalInfo.name || file.originalname.replace(/\.[^/.]+$/, ''),
        email: syncResult.parsed.personalInfo.email || '',
        phone: syncResult.parsed.personalInfo.phone,
        location: syncResult.parsed.personalInfo.location,
        linkedinUrl: syncResult.parsed.personalInfo.linkedinUrl,
        githubUrl: syncResult.parsed.personalInfo.githubUrl,
      },
      summary: syncResult.parsed.personalInfo.summary || '',
      skills: {
        core: syncResult.parsed.skills.slice(0, 8),
        secondary: syncResult.parsed.skills.slice(8, 20),
        tools: syncResult.parsed.skills.slice(20),
      },
      experiences: (syncResult.parsed.experiences || []).map((exp: any) => ({
        company: exp.company || 'Company',
        role: exp.role || exp.title || 'Engineer',
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        current: exp.isCurrent ?? exp.current ?? false,
        bullets: (exp.bullets || []).map((b: any) => ({
          text: typeof b === 'string' ? b : b.text,
          metrics: typeof b === 'string' ? [] : b.metrics || [],
          matchedSkills: typeof b === 'string' ? [] : b.matchedSkills || [],
        })),
      })),
      education: (syncResult.parsed.education || []).map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field || edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
      })),
      projects: (syncResult.parsed.projects || []).map((proj: any) => ({
        name: proj.name,
        description: proj.description,
        url: proj.url,
        bullets: proj.bullets || proj.technologies || [],
      })),
      certifications: syncResult.parsed.certifications,
    };

    // 5. Create Resume and ResumeVersion record with Cloudinary fileKey and structuredData
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
            structuredData: initialAst as any,
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

  // ─── Phase 4: ATS Scoring & Tailoring ─────────────────────────────────────────

  /**
   * Evaluates ATS compatibility score for a resume against a target Job ID or custom JD text
   */
  async scoreResume(userId: string, resumeId: string, dto: ScoreResumeDto) {
    const resume = await this.getResume(userId, resumeId);
    const resumeAst = await this.getOrReconstructResumeAst(userId, resume);

    const targetSpec = await this.resolveJobTargetSpec(dto);
    const evaluation = this.atsScorer.evaluate(resumeAst, targetSpec);

    // If scoring against a known job, update the active version's score
    const activeVersion = resume.versions?.[0];
    if (activeVersion && dto.jobId) {
      await this.prisma.resumeVersion.update({
        where: { id: activeVersion.id },
        data: {
          atsScore: evaluation.score,
          atsBreakdown: evaluation.breakdown as any,
          targetJobId: dto.jobId,
          targetCompany: targetSpec.companyName,
        },
      });
    }

    return evaluation;
  }

  /**
   * Tailors a resume for a target job description backed strictly by verified candidate evidence
   */
  async tailorResume(userId: string, resumeId: string, dto: TailorResumeDto) {
    const resume = await this.getResume(userId, resumeId);
    const baseAst = await this.getOrReconstructResumeAst(userId, resume);

    // 1. Fetch verified evidence claims for user
    const evidenceClaims = await this.prisma.candidateEvidence.findMany({
      where: {
        userId,
        status: 'VERIFIED',
      },
      select: {
        id: true,
        claim: true,
        category: true,
        context: true,
        sourceDetail: true,
      },
    });

    // 2. Resolve target job specification
    const targetSpec = await this.resolveJobTargetSpec(dto);

    // 3. Execute deterministic tailoring pipeline
    const result = this.tailoringService.tailor(baseAst, evidenceClaims, targetSpec, {
      ...dto,
      templateStyle: (dto.templateStyle as ResumeTemplateStyle) || ResumeTemplateStyle.MODERN,
    });

    // 4. Find latest version number
    const latestVersion = resume.versions?.[0]?.version || 1;
    const newVersionNumber = latestVersion + 1;

    // 5. Generate ATS HTML representation
    const atsHtml = this.exportService.generateHtml(
      result.tailoredResume,
      (dto.templateStyle as ResumeTemplateStyle) || ResumeTemplateStyle.MODERN,
    );

    // 6. Create new tailored ResumeVersion in database
    const newVersion = await this.prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        version: newVersionNumber,
        fileKey: `inline://tailored-v${newVersionNumber}`,
        mimeType: 'application/json',
        fileSizeBytes: Buffer.byteLength(JSON.stringify(result.tailoredResume)),
        atsScore: result.atsScoreAfter,
        structuredData: result.tailoredResume as any,
        targetJobId: dto.jobId,
        targetCompany: targetSpec.companyName || dto.targetCompanyName,
        atsBreakdown: this.atsScorer.evaluate(result.tailoredResume, targetSpec).breakdown as any,
        diffSummary: result.diffSummary as any,
        evidenceBindings: result.evidenceBindings,
        isActive: true,
      },
    });

    return {
      version: newVersion,
      tailoredResume: result.tailoredResume,
      diffSummary: result.diffSummary,
      atsScoreBefore: result.atsScoreBefore,
      atsScoreAfter: result.atsScoreAfter,
      evidenceBindings: result.evidenceBindings,
      htmlPreview: atsHtml,
    };
  }

  /**
   * Lists all tailored variants and versions for a user
   */
  async listVariants(userId: string): Promise<ResumeVariant[]> {
    const versions = await this.prisma.resumeVersion.findMany({
      where: {
        resume: { userId, deletedAt: null },
        OR: [
          { targetJobId: { not: null } },
          { atsScore: { not: null } },
          { resume: { type: 'TAILORED' } },
        ],
      },
      include: {
        resume: true,
        targetJob: {
          include: { company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return versions.map((v) => ({
      id: v.id,
      resumeId: v.resumeId,
      version: v.version,
      name: `${v.resume.name} (v${v.version})`,
      type: v.resume.type as any,
      targetJobId: v.targetJobId || undefined,
      targetJobTitle: v.targetJob?.title,
      targetCompany: v.targetCompany || v.targetJob?.company?.name,
      atsScore: v.atsScore || undefined,
      atsBreakdown: (v.atsBreakdown as any) || undefined,
      structuredData: (v.structuredData as any) || undefined,
      diffSummary: (v.diffSummary as any) || undefined,
      evidenceBindings: v.evidenceBindings,
      fileKey: v.fileKey,
      createdAt: v.createdAt,
    }));
  }

  /**
   * Retrieves a single resume variant by its version ID
   */
  async getVariant(userId: string, variantId: string) {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: variantId },
      include: {
        resume: true,
        targetJob: {
          include: { company: true },
        },
      },
    });

    if (!version || version.resume.deletedAt) {
      throw new NotFoundException('Variant not found');
    }

    if (version.resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return version;
  }

  /**
   * Retrieves or computes the visual diff between this variant and the base version
   */
  async getVariantDiff(userId: string, variantId: string) {
    const variant = await this.getVariant(userId, variantId);

    if (variant.diffSummary) {
      return variant.diffSummary;
    }

    // Fallback: Compute diff against version 1
    const baseVersion = await this.prisma.resumeVersion.findFirst({
      where: { resumeId: variant.resumeId, version: 1 },
    });

    if (!baseVersion || !baseVersion.structuredData || !variant.structuredData) {
      return {
        addedSkills: [],
        reorderedBulletsCount: 0,
        evidenceClaimsLinked: 0,
        summaryChanged: false,
        atsScoreDelta: 0,
        changes: [],
      };
    }

    return this.diffService.computeDiff(
      baseVersion.structuredData as any,
      variant.structuredData as any,
      (variant.atsScore || 0) - (baseVersion.atsScore || 0),
    );
  }

  /**
   * Exports a resume variant as semantic ATS HTML, plain text, or structured JSON
   */
  async exportVariant(
    userId: string,
    variantId: string,
    format: 'html' | 'text' | 'json' = 'html',
    template: ResumeTemplateStyle = ResumeTemplateStyle.MODERN,
  ) {
    const variant = await this.getVariant(userId, variantId);
    const ast = (variant.structuredData as any) || (await this.getOrReconstructResumeAst(userId, variant.resume));

    if (format === 'json') {
      return ast;
    }

    if (format === 'text') {
      return {
        text: this.exportService.generatePlainText(ast),
        filename: `${variant.resume.name}-v${variant.version}.txt`,
      };
    }

    return {
      html: this.exportService.generateHtml(ast, template),
      filename: `${variant.resume.name}-v${variant.version}.html`,
    };
  }

  /**
   * Helper: Resolves target job specification from either a Job ID or custom input
   */
  private async resolveJobTargetSpec(
    dto: ScoreResumeDto | TailorResumeDto,
  ): Promise<JobTargetSpec> {
    if (dto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: dto.jobId },
        include: { company: true },
      });

      if (job) {
        return {
          title: job.title,
          companyName: job.company?.name,
          requiredSkills: job.requiredSkills || [],
          preferredSkills: job.preferredSkills || [],
          seniority: job.seniority || undefined,
          experienceMinYears: job.experienceMinYears || 0,
          description: job.description,
        };
      }
    }

    // Fallback: Parse custom job description deterministically
    const rawJd = dto.customJobDescription || '';
    const analysis = this.jdAnalyzer.analyze(dto.targetRoleTitle || 'Software Engineer', rawJd);

    return {
      title: dto.targetRoleTitle || 'Software Engineer',
      companyName: dto.targetCompanyName || 'Target Company',
      requiredSkills: analysis.requiredSkills,
      preferredSkills: analysis.preferredSkills,
      seniority: analysis.seniority,
      description: rawJd,
    };
  }

  /**
   * Helper: Returns structured ResumeAST from stored version or reconstructs from CandidateProfile
   */
  private async getOrReconstructResumeAst(userId: string, resume: any): Promise<ResumeAST> {
    const latestVersion = resume.versions?.[0];
    if (latestVersion?.structuredData) {
      return latestVersion.structuredData as ResumeAST;
    }

    // Reconstruct from candidate profile
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!profile) {
      throw new BadRequestException('Candidate profile not found to reconstruct resume');
    }

    const skills = profile.skills || [];
    const experiences = (profile.experiences as any[]) || [];
    const education = (profile.education as any[]) || [];
    const projects = (profile.projects as any[]) || [];

    return {
      personalInfo: {
        fullName: `${profile.user.firstName} ${profile.user.lastName}`,
        headline: profile.title || 'Software Engineer',
        email: profile.user.email,
        phone: profile.phone || undefined,
        location: profile.location || undefined,
        linkedinUrl: profile.linkedinUrl || undefined,
        githubUrl: profile.githubUrl || undefined,
      },
      summary: profile.summary || '',
      skills: {
        core: skills.slice(0, 8),
        secondary: skills.slice(8, 20),
        tools: skills.slice(20),
      },
      experiences: experiences.map((exp) => ({
        company: exp.company || 'Company',
        role: exp.role || 'Role',
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        current: exp.current,
        bullets: (exp.bullets || []).map((b: any) =>
          typeof b === 'string'
            ? { text: b, metrics: [], matchedSkills: [] }
            : { text: b.text || '', metrics: b.metrics || [], matchedSkills: b.matchedSkills || [] },
        ),
      })),
      education: education.map((edu) => ({
        institution: edu.institution || 'University',
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
      })),
      projects: projects.map((p) => ({
        name: p.name || 'Project',
        description: p.description,
        url: p.url,
        bullets: p.highlights || [],
      })),
      certifications: profile.certifications || [],
    };
  }
}
