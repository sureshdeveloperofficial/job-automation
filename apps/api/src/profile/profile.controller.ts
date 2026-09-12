import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UpdateCandidateProfileSchema } from '@career-os/schemas';
import type { UpdateCandidateProfileDto } from '@career-os/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current candidate profile with health score' })
  @ApiResponse({ status: 200, description: 'Candidate profile and health metrics' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update candidate profile fields and recompute health score' })
  @ApiResponse({ status: 200, description: 'Updated candidate profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(UpdateCandidateProfileSchema)) dto: UpdateCandidateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get detailed candidate profile health score breakdown' })
  @ApiResponse({ status: 200, description: 'Profile health score breakdown and recommendations' })
  async getHealthScore(@CurrentUser('id') userId: string) {
    return this.profileService.getHealthScore(userId);
  }
}
