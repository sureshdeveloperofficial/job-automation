import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobsService } from './jobs.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { JobSearchFilterSchema, IngestJobSchema } from '@career-os/schemas';
import type { IngestJobDto } from '@career-os/schemas';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search and discover jobs with multi-facet filters' })
  @ApiResponse({ status: 200, description: 'Filtered jobs list with pagination metadata' })
  async searchJobs(@Query() query: any, @Req() req: any) {
    const filter = JobSearchFilterSchema.parse(query);
    const userId = req.user?.id;
    const result = await this.jobsService.searchJobs(filter, userId);
    return result;
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get detailed job posting with requirements and match readiness' })
  @ApiResponse({ status: 200, description: 'Single job details' })
  async getJobById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.jobsService.getJobById(id, userId);
  }

  @Public()
  @Get(':id/snapshot')
  @ApiOperation({ summary: 'Get immutable raw snapshot and cryptographic content hash' })
  @ApiResponse({ status: 200, description: 'Immutable snapshot verification' })
  async getJobSnapshot(@Param('id') id: string) {
    return this.jobsService.getJobSnapshot(id);
  }

  @Post('ingest')
  @ApiOperation({ summary: 'Manually ingest a job posting through normalizer pipeline' })
  @ApiResponse({ status: 201, description: 'Job ingested successfully' })
  async ingestJob(@Body() body: IngestJobDto) {
    const valid = IngestJobSchema.parse(body);
    return this.jobsService.ingestJob(valid);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Trigger connector sync (SEED, GREENHOUSE, LEVER)' })
  @ApiResponse({ status: 200, description: 'Connector sync summary' })
  async syncConnectors(
    @Query('source') source?: string,
    @Query('company') company?: string,
    @Query('limit') limit?: number,
  ) {
    return this.jobsService.syncConnectors({
      source,
      companyIdentifier: company,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
