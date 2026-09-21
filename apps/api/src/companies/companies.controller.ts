import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompaniesService } from './companies.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CompanyFilterSchema } from '@career-os/schemas';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List hiring companies with active job counts and filters' })
  @ApiResponse({ status: 200, description: 'Paginated hiring companies' })
  async getCompanies(@Query() query: any) {
    const filter = CompanyFilterSchema.parse(query);
    return this.companiesService.getCompanies(filter);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get company profile and latest active job openings' })
  @ApiResponse({ status: 200, description: 'Company details and recent postings' })
  async getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(id);
  }

  @Public()
  @Get(':id/jobs')
  @ApiOperation({ summary: 'Get open jobs for a specific company' })
  @ApiResponse({ status: 200, description: 'Paginated jobs for the company' })
  async getCompanyJobs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.companiesService.getCompanyJobs(
      id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
