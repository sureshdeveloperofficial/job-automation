import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  UpdateCandidateProfileDto,
  CandidateExperienceItemDto,
  CandidateEducationItemDto,
} from '@career-os/schemas';
import type { ProfileHealthScore } from '@career-os/types';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    let profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        evidence: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      profile = await this.prisma.candidateProfile.create({
        data: {
          userId,
          workModes: ['REMOTE', 'HYBRID'],
        },
        include: {
          evidence: true,
        },
      });
    }

    const health = await this.calculateHealthScore(userId, profile);
    return {
      ...profile,
      health,
    };
  }

  async updateProfile(userId: string, dto: UpdateCandidateProfileDto) {
    let profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.candidateProfile.create({
        data: {
          userId,
        },
      });
    }

    const updated = await this.prisma.candidateProfile.update({
      where: { userId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.linkedinUrl !== undefined && { linkedinUrl: dto.linkedinUrl }),
        ...(dto.githubUrl !== undefined && { githubUrl: dto.githubUrl }),
        ...(dto.portfolioUrl !== undefined && { portfolioUrl: dto.portfolioUrl }),
        ...(dto.yearsOfExperience !== undefined && { yearsOfExperience: dto.yearsOfExperience }),
        ...(dto.noticePeriodDays !== undefined && { noticePeriodDays: dto.noticePeriodDays }),
        ...(dto.currentSalary !== undefined && { currentSalary: dto.currentSalary }),
        ...(dto.expectedSalaryMin !== undefined && { expectedSalaryMin: dto.expectedSalaryMin }),
        ...(dto.expectedSalaryMax !== undefined && { expectedSalaryMax: dto.expectedSalaryMax }),
        ...(dto.salaryCurrency !== undefined && { salaryCurrency: dto.salaryCurrency }),
        ...(dto.workModes !== undefined && { workModes: dto.workModes }),
        ...(dto.skills !== undefined && { skills: dto.skills }),
        ...(dto.experiences !== undefined && { experiences: dto.experiences as any }),
        ...(dto.education !== undefined && { education: dto.education as any }),
        ...(dto.certifications !== undefined && { certifications: dto.certifications }),
        ...(dto.projects !== undefined && { projects: dto.projects as any }),
        ...(dto.onboardingStep !== undefined && { onboardingStep: dto.onboardingStep }),
        ...(dto.isOnboardingCompleted !== undefined && { isOnboardingCompleted: dto.isOnboardingCompleted }),
      },
      include: {
        evidence: true,
      },
    });

    const health = await this.calculateHealthScore(userId, updated);
    await this.prisma.candidateProfile.update({
      where: { userId },
      data: { profileHealthScore: health.score },
    });

    return {
      ...updated,
      profileHealthScore: health.score,
      health,
    };
  }

  async getHealthScore(userId: string): Promise<ProfileHealthScore> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        evidence: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    return this.calculateHealthScore(userId, profile);
  }

  public async calculateHealthScore(userId: string, profile: any): Promise<ProfileHealthScore> {
    const recommendations: string[] = [];
    const completedItems: string[] = [];
    const pendingItems: string[] = [];

    // 1. Personal & Contact (20 points)
    let personalScore = 0;
    if (profile.title) {
      personalScore += 5;
      completedItems.push('Target title provided');
    } else {
      pendingItems.push('Add a target professional headline/title');
      recommendations.push('Specify your target title (e.g. Senior Backend Engineer) for accurate job matching.');
    }

    if (profile.location) {
      personalScore += 5;
      completedItems.push('Location provided');
    } else {
      pendingItems.push('Add your primary location');
    }

    if (profile.phone) {
      personalScore += 5;
      completedItems.push('Phone number on file');
    } else {
      pendingItems.push('Add your phone number for recruiter outreach');
    }

    if (profile.linkedinUrl || profile.githubUrl) {
      personalScore += 5;
      completedItems.push('Social profile linked (LinkedIn / GitHub)');
    } else {
      pendingItems.push('Link your LinkedIn or GitHub profile');
      recommendations.push('Connect your LinkedIn or GitHub URL to strengthen application trust.');
    }

    // 2. Experience (25 points)
    let experienceScore = 0;
    const experiences = (profile.experiences as CandidateExperienceItemDto[]) || [];
    if (experiences.length > 0) {
      experienceScore = 25;
      completedItems.push(`${experiences.length} work experience role(s) added`);
    } else {
      pendingItems.push('Add at least one work experience history block');
      recommendations.push('List your previous roles and quantified accomplishments.');
    }

    // 3. Skills (20 points)
    let skillsScore = 0;
    const skills = profile.skills || [];
    if (skills.length >= 5) {
      skillsScore = 20;
      completedItems.push(`${skills.length} technical skills listed`);
    } else if (skills.length > 0) {
      skillsScore = Math.round((skills.length / 5) * 20);
      pendingItems.push(`Add ${5 - skills.length} more skills to reach recommended minimum of 5`);
    } else {
      pendingItems.push('Add core technical skills');
      recommendations.push('Tag at least 5 core technical skills to unlock automated skill-gap analysis.');
    }

    // 4. Education (15 points)
    let educationScore = 0;
    const education = (profile.education as CandidateEducationItemDto[]) || [];
    if (education.length > 0) {
      educationScore = 15;
      completedItems.push('Education / academic background added');
    } else {
      pendingItems.push('Add your degree and academic institution');
      recommendations.push('Include your highest educational qualification or certifications.');
    }

    // 5. Evidence Verification (20 points)
    let evidenceScore = 0;
    const evidenceList = profile.evidence || (await this.prisma.candidateEvidence.findMany({ where: { userId } }));
    const verifiedCount = evidenceList.filter((e: any) => e.status === 'VERIFIED').length;
    const totalEvidence = evidenceList.length;

    if (totalEvidence > 0 && verifiedCount > 0) {
      const ratio = verifiedCount / totalEvidence;
      evidenceScore = Math.min(20, Math.round(ratio * 15 + Math.min(verifiedCount * 2.5, 5)));
      completedItems.push(`${verifiedCount} evidence claim(s) verified`);
    } else if (totalEvidence > 0) {
      evidenceScore = 5;
      pendingItems.push(`${totalEvidence} evidence claims pending verification`);
      recommendations.push('Verify pending evidence claims in your Evidence Ledger to unlock fact-backed resume tailoring.');
    } else {
      pendingItems.push('Add evidence claims to back up skills');
      recommendations.push('Import a resume or manually add evidence records to back your achievements.');
    }

    const totalScore = Math.min(100, personalScore + experienceScore + skillsScore + educationScore + evidenceScore);

    return {
      score: totalScore,
      breakdown: {
        personalInfo: personalScore,
        experience: experienceScore,
        skills: skillsScore,
        education: educationScore,
        evidence: evidenceScore,
      },
      recommendations,
      completedItems,
      pendingItems,
    };
  }
}
