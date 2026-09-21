import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompanyFilterDto } from '@career-os/schemas';
import { Company, Job } from '@career-os/types';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves paginated hiring companies with active job counts
   */
  async getCompanies(filter: CompanyFilterDto): Promise<{
    companies: Company[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
    };

    if (filter.isHiringNow !== undefined) {
      where.isHiringNow = filter.isHiringNow;
    }

    if (filter.industry) {
      where.industry = { contains: filter.industry, mode: 'insensitive' };
    }

    if (filter.query) {
      where.OR = [
        { name: { contains: filter.query, mode: 'insensitive' } },
        { industry: { contains: filter.query, mode: 'insensitive' } },
        { headquarters: { contains: filter.query, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        orderBy: [
          { activeJobsCount: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      companies: rows.map((c) => this.mapPrismaCompany(c)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /**
   * Retrieves single company with up to 10 recent open jobs
   */
  async getCompanyById(id: string): Promise<Company & { recentJobs: Job[] }> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          where: { isActive: true, deletedAt: null },
          orderBy: { postedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    return {
      ...this.mapPrismaCompany(company),
      recentJobs: company.jobs.map((j) => this.mapJob(j)),
    };
  }

  /**
   * Retrieves paginated open jobs for a specific company
   */
  async getCompanyJobs(
    companyId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ jobs: Job[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const where = {
      companyId,
      isActive: true,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: { postedAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      jobs: rows.map((j) => this.mapJob(j)),
      total,
    };
  }

  private mapJob(j: any): Job {
    return {
      id: j.id,
      companyId: j.companyId,
      title: j.title,
      normalizedTitle: j.normalizedTitle,
      description: j.description,
      location: j.location ?? undefined,
      city: j.city ?? undefined,
      state: j.state ?? undefined,
      country: j.country ?? undefined,
      workMode: (j.workMode as any) ?? undefined,
      employmentType: (j.employmentType as any) ?? undefined,
      seniority: (j.seniority as any) ?? undefined,
      salaryMin: j.salaryMin ? Number(j.salaryMin) : undefined,
      salaryMax: j.salaryMax ? Number(j.salaryMax) : undefined,
      salaryCurrency: j.salaryCurrency ?? undefined,
      salaryPeriod: j.salaryPeriod ?? undefined,
      requiredSkills: j.requiredSkills ?? [],
      preferredSkills: j.preferredSkills ?? [],
      responsibilities: j.responsibilities ?? [],
      postedAt: j.postedAt ?? undefined,
      firstSeenAt: j.firstSeenAt,
      lastSeenAt: j.lastSeenAt,
      source: j.source,
      contentHash: j.contentHash,
      status: j.status,
      isActive: j.isActive,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    };
  }

  private mapPrismaCompany(c: any): Company {
    return {
      id: c.id,
      name: c.name,
      normalizedName: c.normalizedName,
      slug: c.slug ?? undefined,
      domain: c.domain ?? undefined,
      industry: c.industry ?? undefined,
      size: c.size ?? undefined,
      headquarters: c.headquarters ?? undefined,
      employeeCount: c.employeeCount ?? undefined,
      isHiringNow: c.isHiringNow,
      activeJobsCount: c.activeJobsCount,
      careersUrl: c.careersUrl ?? undefined,
      websiteUrl: c.websiteUrl ?? undefined,
      logoUrl: c.logoUrl ?? undefined,
      description: c.description ?? undefined,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
