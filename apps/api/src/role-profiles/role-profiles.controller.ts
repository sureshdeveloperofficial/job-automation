import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RoleProfilesService } from './role-profiles.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  CreateRoleProfileSchema,
  UpdateRoleProfileSchema,
} from '@career-os/schemas';
import type {
  CreateRoleProfileDto,
  UpdateRoleProfileDto,
} from '@career-os/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@ApiTags('role-profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('role-profiles')
export class RoleProfilesController {
  constructor(private readonly roleProfilesService: RoleProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List all target role profiles for candidate' })
  @ApiResponse({ status: 200, description: 'List of role profiles' })
  async getRoleProfiles(@CurrentUser('id') userId: string) {
    return this.roleProfilesService.getRoleProfiles(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new target role profile' })
  @ApiResponse({ status: 201, description: 'Role profile created' })
  async createRoleProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateRoleProfileSchema)) dto: CreateRoleProfileDto,
  ) {
    return this.roleProfilesService.createRoleProfile(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role profile by ID' })
  @ApiResponse({ status: 200, description: 'Role profile details' })
  async getRoleProfile(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.roleProfilesService.getRoleProfile(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a role profile' })
  @ApiResponse({ status: 200, description: 'Updated role profile' })
  async updateRoleProfile(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoleProfileSchema)) dto: UpdateRoleProfileDto,
  ) {
    return this.roleProfilesService.updateRoleProfile(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role profile' })
  @ApiResponse({ status: 200, description: 'Role profile deleted' })
  async deleteRoleProfile(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.roleProfilesService.deleteRoleProfile(userId, id);
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set this role profile as the active default target' })
  @ApiResponse({ status: 200, description: 'Default role profile updated' })
  async setDefault(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.roleProfilesService.setDefault(userId, id);
  }
}
