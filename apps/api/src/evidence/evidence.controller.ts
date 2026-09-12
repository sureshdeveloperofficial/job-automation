import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EvidenceService } from './evidence.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  CreateEvidenceSchema,
  UpdateEvidenceSchema,
  VerifyEvidenceSchema,
  BulkVerifyEvidenceSchema,
  EvidenceFilterSchema,
} from '@career-os/schemas';
import type {
  CreateEvidenceDto,
  UpdateEvidenceDto,
  VerifyEvidenceDto,
  BulkVerifyEvidenceDto,
  EvidenceFilterDto,
} from '@career-os/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@ApiTags('evidence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get()
  @ApiOperation({ summary: 'List candidate evidence records with status filters' })
  @ApiResponse({ status: 200, description: 'List of evidence records and status breakdown' })
  async getEvidence(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(EvidenceFilterSchema)) query: EvidenceFilterDto,
  ) {
    return this.evidenceService.getEvidence(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new candidate evidence record' })
  @ApiResponse({ status: 201, description: 'Created evidence record' })
  async createEvidence(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateEvidenceSchema)) dto: CreateEvidenceDto,
  ) {
    return this.evidenceService.createEvidence(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing evidence record' })
  @ApiResponse({ status: 200, description: 'Updated evidence record' })
  async updateEvidence(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEvidenceSchema)) dto: UpdateEvidenceDto,
  ) {
    return this.evidenceService.updateEvidence(userId, id, dto);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify or reject an evidence record' })
  @ApiResponse({ status: 200, description: 'Verified evidence status updated' })
  async verifyEvidence(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(VerifyEvidenceSchema)) dto: VerifyEvidenceDto,
  ) {
    return this.evidenceService.verifyEvidence(userId, id, dto);
  }

  @Post('bulk-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk verify or reject multiple evidence records' })
  @ApiResponse({ status: 200, description: 'Bulk verification count' })
  async bulkVerify(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(BulkVerifyEvidenceSchema)) dto: BulkVerifyEvidenceDto,
  ) {
    return this.evidenceService.bulkVerify(userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an evidence record' })
  @ApiResponse({ status: 200, description: 'Evidence record deleted' })
  async deleteEvidence(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.evidenceService.deleteEvidence(userId, id);
  }
}
