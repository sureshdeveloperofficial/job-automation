import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobNormalizerService } from './pipeline/job-normalizer.service.js';
import { JobDeduplicationService } from './pipeline/job-deduplication.service.js';
import { JdAnalyzerService } from '../jd-analysis/jd-analyzer.service.js';
import { JdSnapshotService } from '../jd-analysis/jd-snapshot.service.js';
import { GreenhouseConnector } from '../connectors/greenhouse.connector.js';
import { LeverConnector } from '../connectors/lever.connector.js';
import { SeedJobConnector } from '../connectors/seed.connector.js';
import { JobSearchFilterDto, IngestJobDto } from '@career-os/schemas';
import { Job, JobDetails, WorkMode, EmploymentType, SeniorityLevel } from '@career-os/types';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: JobNormalizerService,
    private readonly deduplication: JobDeduplicationService,
    private readonly jdAnalyzer: JdAnalyzerService,
    private readonly jdSnapshot: JdSnapshotService,
    private readonly greenhouseConnector: GreenhouseConnector,
    private readonly leverConnector: LeverConnector,
    private readonly seedConnector: SeedJobConnector,
  ) {}

  /**
   * Multi-facet job search with freshness, location, salary, work mode, and text filtering
   */
  async searchJobs(filter: JobSearchFilterDto, _userId?: string): Promise<{
    jobs: Job[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    // Text / keyword search across title, normalizedTitle, and description
    if (filter.query) {
      where.OR = [
        { title: { contains: filter.query, mode: 'insensitive' } },
        { normalizedTitle: { contains: filter.query, mode: 'insensitive' } },
        { description: { contains: filter.query, mode: 'insensitive' } },
        { company: { name: { contains: filter.query, mode: 'insensitive' } } },
      ];
    }

    // Location / City filter
    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    } else if (filter.location) {
      where.OR = [
        ...(where.OR ?? []),
        { location: { contains: filter.location, mode: 'insensitive' } },
        { city: { contains: filter.location, mode: 'insensitive' } },
        { state: { contains: filter.location, mode: 'insensitive' } },
      ];
    }

    // Work modes filter (Remote, Hybrid, Onsite)
    if (filter.workModes && filter.workModes.length > 0) {
      where.workMode = { in: filter.workModes };
    }

    // Employment types filter
    if (filter.employmentTypes && filter.employmentTypes.length > 0) {
      where.employmentType = { in: filter.employmentTypes };
    }

    // Seniority levels filter
    if (filter.seniorities && filter.seniorities.length > 0) {
      where.seniority = { in: filter.seniorities };
    }

    // Freshness filter
    if (filter.freshness) {
      const now = new Date();
      let cutOffHours = 24 * 7; // Default 7 days
      if (filter.freshness === 'LAST_24H') cutOffHours = 24;
      else if (filter.freshness === 'LAST_3_DAYS') cutOffHours = 24 * 3;
      else if (filter.freshness === 'LAST_7_DAYS') cutOffHours = 24 * 7;
      else if (filter.freshness === 'LAST_30_DAYS') cutOffHours = 24 * 30;

      const cutOffDate = new Date(now.getTime() - cutOffHours * 3600 * 1000);
      where.postedAt = { gte: cutOffDate };
    }

    // Salary min / max filter
    if (filter.salaryMin !== undefined) {
      where.salaryMax = { gte: filter.salaryMin };
    }
    if (filter.salaryMax !== undefined) {
      where.salaryMin = { lte: filter.salaryMax };
    }

    // Company filter
    if (filter.companyId) {
      where.companyId = filter.companyId;
    } else if (filter.companyName) {
      where.company = { name: { contains: filter.companyName, mode: 'insensitive' } };
    }

    // Skills filter
    if (filter.skills && filter.skills.length > 0) {
      where.requiredSkills = { hasSome: filter.skills };
    }

    // Sorting
    let orderBy: any = { postedAt: 'desc' };
    if (filter.sortBy === 'salary') {
      orderBy = { salaryMax: filter.sortOrder ?? 'desc' };
    } else if (filter.sortBy === 'postedAt') {
      orderBy = { postedAt: filter.sortOrder ?? 'desc' };
    }

    const [total, rows] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        include: {
          company: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    const mappedJobs: Job[] = rows.map((j) => this.mapPrismaJob(j));

    return {
      jobs: mappedJobs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /**
   * Retrieves single job details with immutable snapshot and match readiness
   */
  async getJobById(id: string, userId?: string): Promise<JobDetails> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        jdSnapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }

    const mapped = this.mapPrismaJob(job);
    const snapshot = job.jdSnapshots[0];

    let matchReadiness = undefined;
    if (userId) {
      const profile = await this.prisma.candidateProfile.findUnique({
        where: { userId },
        select: { skills: true },
      });

      const candidateSkills = (profile?.skills ?? []).map((s) => s.toLowerCase());
      const jobRequired = (job.requiredSkills ?? []).map((s) => s.toLowerCase());

      const matched = jobRequired.filter((s) => candidateSkills.includes(s));
      const missing = jobRequired.filter((s) => !candidateSkills.includes(s));
      const matchScore = jobRequired.length > 0
        ? Math.round((matched.length / jobRequired.length) * 100)
        : 85;

      matchReadiness = {
        matchedSkills: matched,
        missingSkills: missing,
        matchScore,
      };
    }

    return {
      ...mapped,
      company: {
        id: job.company.id,
        name: job.company.name,
        normalizedName: job.company.normalizedName,
        slug: job.company.slug ?? undefined,
        domain: job.company.domain ?? undefined,
        industry: job.company.industry ?? undefined,
        size: job.company.size ?? undefined,
        headquarters: job.company.headquarters ?? undefined,
        employeeCount: job.company.employeeCount ?? undefined,
        isHiringNow: job.company.isHiringNow,
        activeJobsCount: job.company.activeJobsCount,
        careersUrl: job.company.careersUrl ?? undefined,
        websiteUrl: job.company.websiteUrl ?? undefined,
        logoUrl: job.company.logoUrl ?? undefined,
        description: job.company.description ?? undefined,
        createdAt: job.company.createdAt,
        updatedAt: job.company.updatedAt,
      },
      snapshot: snapshot
        ? {
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
          }
        : undefined,
      matchReadiness,
    };
  }

  /**
   * Retrieves immutable snapshot and content hash for verification
   */
  async getJobSnapshot(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        contentHash: true,
        source: true,
        sourceJobId: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }

    const snapshot = await this.jdSnapshot.getSnapshot(id);
    return {
      job,
      snapshot,
    };
  }

  /**
   * Ingests a single job posting through the normalization and deduplication pipeline
   */
  async ingestJob(
    payload: Partial<IngestJobDto> & { companyName: string; title: string; description: string },
  ): Promise<{ job: Job; isNew: boolean }> {
    // 1. Resolve canonical company
    const normalizedCompanyName = payload.companyName.trim().toLowerCase();
    let company = await this.prisma.company.findFirst({
      where: { normalizedName: normalizedCompanyName },
    });

    if (!company) {
      const slug = normalizedCompanyName.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      company = await this.prisma.company.create({
        data: {
          name: payload.companyName.trim(),
          normalizedName: normalizedCompanyName,
          slug,
          isHiringNow: true,
          activeJobsCount: 0,
        },
      });
    }

    // 2. Normalize title and JD attributes
    const normalizedTitle = this.normalizer.normalizeTitle(payload.title);
    const analysis = this.jdAnalyzer.analyze(payload.title, payload.description);

    // Parse salary if not provided
    let salaryMin = payload.salaryMin;
    let salaryMax = payload.salaryMax;
    let salaryCurrency = payload.salaryCurrency ?? 'INR';
    let salaryPeriod = payload.salaryPeriod ?? 'YEARLY';

    if (!salaryMin && !salaryMax) {
      const parsedSalary = this.normalizer.parseSalary(payload.description);
      if (parsedSalary) {
        salaryMin = parsedSalary.min;
        salaryMax = parsedSalary.max;
        salaryCurrency = parsedSalary.currency ?? salaryCurrency;
        salaryPeriod = parsedSalary.period ?? salaryPeriod;
      }
    }

    // Parse experience
    let experienceMin = payload.experienceMinYears ?? 0;
    let experienceMax = payload.experienceMaxYears;
    if (experienceMin === 0) {
      const parsedExp = this.normalizer.parseExperience(payload.description);
      experienceMin = parsedExp.minYears;
      experienceMax = parsedExp.maxYears;
    }

    // 3. Compute deterministic content hash & check deduplication
    const locationStr = payload.location || payload.city || '';
    const contentHash = this.deduplication.computeContentHash(
      company.name,
      normalizedTitle,
      locationStr,
      payload.description,
    );

    const dupCheck = await this.deduplication.findDuplicate(
      company.id,
      contentHash,
      payload.source,
      payload.sourceJobId,
    );

    if (dupCheck.exists && dupCheck.jobId) {
      this.logger.log(`Duplicate job detected for "${payload.title}" (${dupCheck.jobId}). Touching lastSeenAt.`);
      await this.deduplication.touchJob(dupCheck.jobId);
      const existing = await this.prisma.job.findUnique({
        where: { id: dupCheck.jobId },
        include: { company: true },
      });
      return {
        job: this.mapPrismaJob(existing!),
        isNew: false,
      };
    }

    // 4. Create new Job posting row
    const created = await this.prisma.job.create({
      data: {
        companyId: company.id,
        title: payload.title,
        normalizedTitle,
        description: analysis.cleanedText,
        rawDescription: payload.rawDescription ?? payload.description,
        location: payload.location ?? (payload.city ? `${payload.city}, ${payload.country}` : 'Remote'),
        city: payload.city,
        state: payload.state,
        country: payload.country ?? 'India',
        latitude: payload.latitude,
        longitude: payload.longitude,
        workMode: (payload.workMode as WorkMode) ?? WorkMode.HYBRID,
        employmentType: (payload.employmentType as EmploymentType) ?? EmploymentType.FULL_TIME,
        seniority: (payload.seniority as SeniorityLevel) ?? analysis.seniority,
        salaryMin,
        salaryMax,
        salaryCurrency,
        salaryPeriod,
        requiredSkills: payload.requiredSkills?.length ? payload.requiredSkills : analysis.requiredSkills,
        preferredSkills: payload.preferredSkills?.length ? payload.preferredSkills : analysis.preferredSkills,
        responsibilities: payload.responsibilities?.length ? payload.responsibilities : analysis.responsibilities,
        experienceMinYears: experienceMin,
        experienceMaxYears: experienceMax,
        contentHash,
        source: payload.source ?? 'MANUAL',
        sourceJobId: payload.sourceJobId,
        sourceUrl: payload.sourceUrl,
        applicationUrl: payload.applicationUrl ?? payload.sourceUrl,
        postedAt: payload.postedAt ? new Date(payload.postedAt) : new Date(),
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    // 5. Store immutable snapshot
    await this.jdSnapshot.captureSnapshot(
      created.id,
      payload.rawDescription ?? payload.description,
      analysis.cleanedText,
      created.source,
      created.sourceJobId ?? undefined,
      created.sourceUrl ?? undefined,
    );

    // 6. Update company active job counter
    await this.prisma.company.update({
      where: { id: company.id },
      data: {
        activeJobsCount: { increment: 1 },
        isHiringNow: true,
      },
    });

    return {
      job: this.mapPrismaJob(created),
      isNew: true,
    };
  }

  /**
   * Syncs connectors (SEED, GREENHOUSE, LEVER) into database
   */
  async syncConnectors(options?: {
    source?: string;
    companyIdentifier?: string;
    limit?: number;
  }): Promise<{ totalIngested: number; totalNew: number; totalDuplicates: number }> {
    const source = (options?.source || 'SEED').toUpperCase();
    let connector = this.seedConnector as any;

    if (source === 'GREENHOUSE') connector = this.greenhouseConnector;
    else if (source === 'LEVER') connector = this.leverConnector;

    this.logger.log(`Starting connector sync for source "${source}"...`);
    const result = await connector.fetchJobs(options);

    let totalNew = 0;
    let totalDuplicates = 0;

    for (const raw of result.jobs) {
      try {
        const ingestRes = await this.ingestJob({
          companyName: raw.companyName,
          title: raw.title,
          description: raw.rawDescription,
          rawDescription: raw.rawDescription,
          location: raw.location,
          city: raw.city,
          state: raw.state,
          country: raw.country ?? 'India',
          latitude: raw.latitude,
          longitude: raw.longitude,
          workMode: raw.workMode,
          employmentType: raw.employmentType,
          seniority: raw.seniority,
          salaryMin: raw.salaryMin,
          salaryMax: raw.salaryMax,
          salaryCurrency: raw.salaryCurrency ?? 'INR',
          salaryPeriod: raw.salaryPeriod,
          source: raw.source,
          sourceJobId: raw.sourceJobId,
          sourceUrl: raw.sourceUrl,
          applicationUrl: raw.applicationUrl,
          postedAt: raw.postedAt ? raw.postedAt.toISOString() : undefined,
        });

        if (ingestRes.isNew) totalNew++;
        else totalDuplicates++;
      } catch (err: any) {
        this.logger.error(`Failed to ingest job "${raw.title}" from ${source}: ${err.message}`);
      }
    }

    return {
      totalIngested: result.jobs.length,
      totalNew,
      totalDuplicates,
    };
  }

  private mapPrismaJob(j: any): Job {
    return {
      id: j.id,
      companyId: j.companyId,
      title: j.title,
      normalizedTitle: j.normalizedTitle,
      description: j.description,
      rawDescription: j.rawDescription ?? undefined,
      location: j.location ?? undefined,
      city: j.city ?? undefined,
      state: j.state ?? undefined,
      country: j.country ?? undefined,
      latitude: j.latitude ?? undefined,
      longitude: j.longitude ?? undefined,
      workMode: j.workMode ?? undefined,
      employmentType: j.employmentType ?? undefined,
      seniority: j.seniority ?? undefined,
      salaryMin: j.salaryMin ? Number(j.salaryMin) : undefined,
      salaryMax: j.salaryMax ? Number(j.salaryMax) : undefined,
      salaryCurrency: j.salaryCurrency ?? undefined,
      salaryPeriod: j.salaryPeriod ?? undefined,
      requiredSkills: j.requiredSkills ?? [],
      preferredSkills: j.preferredSkills ?? [],
      responsibilities: j.responsibilities ?? [],
      experienceMinYears: j.experienceMinYears ?? 0,
      experienceMaxYears: j.experienceMaxYears ?? undefined,
      postedAt: j.postedAt ?? undefined,
      firstSeenAt: j.firstSeenAt,
      lastSeenAt: j.lastSeenAt,
      source: j.source,
      sourceJobId: j.sourceJobId ?? undefined,
      sourceUrl: j.sourceUrl ?? undefined,
      applicationUrl: j.applicationUrl ?? undefined,
      contentHash: j.contentHash,
      status: j.status,
      isActive: j.isActive,
      company: j.company
        ? {
            id: j.company.id,
            name: j.company.name,
            normalizedName: j.company.normalizedName,
            slug: j.company.slug ?? undefined,
            domain: j.company.domain ?? undefined,
            industry: j.company.industry ?? undefined,
            size: j.company.size ?? undefined,
            headquarters: j.company.headquarters ?? undefined,
            employeeCount: j.company.employeeCount ?? undefined,
            isHiringNow: j.company.isHiringNow,
            activeJobsCount: j.company.activeJobsCount,
            careersUrl: j.company.careersUrl ?? undefined,
            websiteUrl: j.company.websiteUrl ?? undefined,
            logoUrl: j.company.logoUrl ?? undefined,
            description: j.company.description ?? undefined,
            createdAt: j.company.createdAt,
            updatedAt: j.company.updatedAt,
          }
        : undefined,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    };
  }
}
