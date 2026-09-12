import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateRoleProfileDto, UpdateRoleProfileDto } from '@career-os/schemas';

@Injectable()
export class RoleProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleProfiles(userId: string) {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    const profiles = await this.prisma.roleProfile.findMany({
      where: {
        userId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return profiles.map((p) => ({
      ...p,
      isDefault: preferences?.defaultRoleProfileId === p.id,
    }));
  }

  async getRoleProfile(userId: string, id: string) {
    const profile = await this.prisma.roleProfile.findUnique({
      where: { id },
    });

    if (!profile || profile.deletedAt) {
      throw new NotFoundException('Role profile not found');
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    return {
      ...profile,
      isDefault: preferences?.defaultRoleProfileId === profile.id,
    };
  }

  async createRoleProfile(userId: string, dto: CreateRoleProfileDto) {
    const profile = await this.prisma.roleProfile.create({
      data: {
        userId,
        name: dto.name,
        targetTitle: dto.targetTitle,
        preferredTitles: dto.preferredTitles,
        seniority: dto.seniority,
        requiredSkills: dto.requiredSkills,
        preferredSkills: dto.preferredSkills,
        industries: dto.industries,
        excludedRoles: dto.excludedRoles,
        locations: dto.locations,
        workModes: dto.workModes as any,
        employmentTypes: dto.employmentTypes as any,
        salaryMin: dto.salaryMin !== undefined ? dto.salaryMin : null,
        salaryMax: dto.salaryMax !== undefined ? dto.salaryMax : null,
        salaryCurrency: dto.salaryCurrency || 'USD',
        preferredResumeId: dto.preferredResumeId,
      },
    });

    // Check if user has a default role profile yet; if not, set this as default
    let preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.userPreferences.create({
        data: {
          userId,
          defaultRoleProfileId: profile.id,
        },
      });
    } else if (!preferences.defaultRoleProfileId) {
      await this.prisma.userPreferences.update({
        where: { userId },
        data: { defaultRoleProfileId: profile.id },
      });
    }

    return {
      ...profile,
      isDefault: preferences?.defaultRoleProfileId === profile.id,
    };
  }

  async updateRoleProfile(userId: string, id: string, dto: UpdateRoleProfileDto) {
    await this.getRoleProfile(userId, id);

    const updated = await this.prisma.roleProfile.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetTitle !== undefined && { targetTitle: dto.targetTitle }),
        ...(dto.preferredTitles !== undefined && { preferredTitles: dto.preferredTitles }),
        ...(dto.seniority !== undefined && { seniority: dto.seniority }),
        ...(dto.requiredSkills !== undefined && { requiredSkills: dto.requiredSkills }),
        ...(dto.preferredSkills !== undefined && { preferredSkills: dto.preferredSkills }),
        ...(dto.industries !== undefined && { industries: dto.industries }),
        ...(dto.excludedRoles !== undefined && { excludedRoles: dto.excludedRoles }),
        ...(dto.locations !== undefined && { locations: dto.locations }),
        ...(dto.workModes !== undefined && { workModes: dto.workModes as any }),
        ...(dto.employmentTypes !== undefined && { employmentTypes: dto.employmentTypes as any }),
        ...(dto.salaryMin !== undefined && { salaryMin: dto.salaryMin }),
        ...(dto.salaryMax !== undefined && { salaryMax: dto.salaryMax }),
        ...(dto.salaryCurrency !== undefined && { salaryCurrency: dto.salaryCurrency }),
        ...(dto.preferredResumeId !== undefined && { preferredResumeId: dto.preferredResumeId }),
      },
    });

    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    return {
      ...updated,
      isDefault: preferences?.defaultRoleProfileId === updated.id,
    };
  }

  async deleteRoleProfile(userId: string, id: string) {
    await this.getRoleProfile(userId, id);

    await this.prisma.roleProfile.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Clear default if it was this one
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    if (preferences?.defaultRoleProfileId === id) {
      await this.prisma.userPreferences.update({
        where: { userId },
        data: { defaultRoleProfileId: null },
      });
    }

    return { deleted: true, id };
  }

  async setDefault(userId: string, id: string) {
    await this.getRoleProfile(userId, id);

    await this.prisma.userPreferences.upsert({
      where: { userId },
      update: { defaultRoleProfileId: id },
      create: {
        userId,
        defaultRoleProfileId: id,
      },
    });

    return { success: true, defaultRoleProfileId: id };
  }
}
