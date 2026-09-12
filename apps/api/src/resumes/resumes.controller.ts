import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ResumesService } from './resumes.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateResumeSchema } from '@career-os/schemas';
import type { CreateResumeDto } from '@career-os/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

class ParseResumeTextDto {
  text!: string;
  autoSeedEvidence?: boolean;
}

@ApiTags('resumes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('parse-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse raw resume text deterministically and extract structured data' })
  @ApiResponse({ status: 200, description: 'Parsed structured resume AST' })
  async parseText(@Body() body: ParseResumeTextDto) {
    return this.resumesService.parseText(body.text);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parse resume text, update candidate profile, and seed evidence ledger candidates',
  })
  @ApiResponse({ status: 200, description: 'Profile updated and evidence items generated' })
  async importResume(@CurrentUser('id') userId: string, @Body() body: ParseResumeTextDto) {
    return this.resumesService.importAndSyncProfile(userId, body.text, body.autoSeedEvidence ?? true);
  }

  @Get()
  @ApiOperation({ summary: 'List user resumes with active versions' })
  @ApiResponse({ status: 200, description: 'List of resumes' })
  async listResumes(@CurrentUser('id') userId: string) {
    return this.resumesService.listResumes(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new resume record' })
  @ApiResponse({ status: 201, description: 'Resume created' })
  async createResume(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateResumeSchema)) dto: CreateResumeDto,
  ) {
    return this.resumesService.createResume(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resume details by ID' })
  @ApiResponse({ status: 200, description: 'Resume details' })
  async getResume(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.getResume(userId, id);
  }
}
