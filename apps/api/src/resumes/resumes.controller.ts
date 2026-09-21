/// <reference types="multer" />
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResumesService } from './resumes.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateResumeSchema, ScoreResumeSchema, TailorResumeSchema } from '@career-os/schemas';
import type { CreateResumeDto, ScoreResumeDto, TailorResumeDto } from '@career-os/schemas';
import { ResumeTemplateStyle } from '@career-os/types';
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

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload a resume file (PDF, DOCX, TXT) to Cloudinary, parse text, and sync profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('name') resumeName?: string,
    @Query('autoSeedEvidence') autoSeedEvidence?: string,
  ) {
    return this.resumesService.uploadAndParseResume(
      userId,
      file,
      resumeName,
      autoSeedEvidence !== 'false',
    );
  }

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

  @Get('variants')
  @ApiOperation({ summary: 'List all tailored resume variants and versions for candidate' })
  @ApiResponse({ status: 200, description: 'List of resume variants' })
  async listVariants(@CurrentUser('id') userId: string) {
    return this.resumesService.listVariants(userId);
  }

  @Get('variants/:id')
  @ApiOperation({ summary: 'Get a specific resume variant by version ID' })
  @ApiResponse({ status: 200, description: 'Resume variant details' })
  async getVariant(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.getVariant(userId, id);
  }

  @Get('variants/:id/diff')
  @ApiOperation({ summary: 'Get visual diff for a resume variant against its base version' })
  @ApiResponse({ status: 200, description: 'Resume diff breakdown' })
  async getVariantDiff(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.getVariantDiff(userId, id);
  }

  @Get('variants/:id/export')
  @ApiOperation({ summary: 'Export resume variant as semantic ATS HTML, plain text, or structured JSON' })
  @ApiResponse({ status: 200, description: 'Exported resume document' })
  async exportVariant(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('format') format?: 'html' | 'text' | 'json',
    @Query('template') template?: ResumeTemplateStyle,
  ) {
    return this.resumesService.exportVariant(
      userId,
      id,
      format || 'html',
      template || ResumeTemplateStyle.MODERN,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List user master resumes with active versions' })
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

  @Post(':id/score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate deterministic ATS score against target job or custom description' })
  @ApiResponse({ status: 200, description: 'ATS score evaluation result' })
  async scoreResume(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ScoreResumeSchema)) dto: ScoreResumeDto,
  ) {
    return this.resumesService.scoreResume(userId, id, dto);
  }

  @Post(':id/tailor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate evidence-backed tailored resume variant for target job' })
  @ApiResponse({ status: 200, description: 'Tailored resume variant created' })
  async tailorResume(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TailorResumeSchema)) dto: TailorResumeDto,
  ) {
    return this.resumesService.tailorResume(userId, id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resume details by ID' })
  @ApiResponse({ status: 200, description: 'Resume details' })
  async getResume(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.getResume(userId, id);
  }
}
