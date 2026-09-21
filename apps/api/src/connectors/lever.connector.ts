import { Injectable, Logger } from '@nestjs/common';
import { ConnectorCapability, WorkMode, EmploymentType } from '@career-os/types';
import { JobConnector, RawJobPayload, ConnectorFetchResult } from './connector.interface.js';

interface LeverJobPosting {
  id: string;
  text: string;
  description?: string;
  descriptionPlain?: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  categories?: {
    commitment?: string;
    location?: string;
    team?: string;
    workplaceType?: string;
  };
}

@Injectable()
export class LeverConnector extends JobConnector {
  private readonly logger = new Logger(LeverConnector.name);
  readonly id = 'LEVER';
  readonly name = 'Lever Public Postings Connector';
  readonly capabilities = [
    ConnectorCapability.JOB_SEARCH,
    ConnectorCapability.JOB_DETAILS,
    ConnectorCapability.COMPANY_JOBS,
    ConnectorCapability.RAW_JD_CAPTURE,
  ];

  private readonly defaultCompanies = ['netflix', 'spotify', 'automattic', 'courier'];

  async fetchJobs(options?: {
    companyIdentifier?: string;
    query?: string;
    limit?: number;
  }): Promise<ConnectorFetchResult> {
    const companies = options?.companyIdentifier ? [options.companyIdentifier] : this.defaultCompanies;
    const limit = options?.limit ?? 50;
    const jobs: RawJobPayload[] = [];

    for (const company of companies) {
      try {
        const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`;
        this.logger.log(`Fetching public Lever postings for company "${company}"...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'AICareerOS-JobIngest/1.0',
            Accept: 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          this.logger.warn(`Lever company "${company}" responded with HTTP ${response.status}`);
          continue;
        }

        const rawList = (await response.json()) as LeverJobPosting[];
        if (!Array.isArray(rawList)) continue;

        for (const raw of rawList) {
          if (jobs.length >= limit) break;

          const locationName = raw.categories?.location ?? 'Remote';
          const workplaceType = (raw.categories?.workplaceType ?? '').toLowerCase();
          const isRemote = workplaceType === 'remote' || /remote/i.test(locationName) || /remote/i.test(raw.text);
          const isHybrid = workplaceType === 'hybrid' || /hybrid/i.test(locationName);

          const workMode = isRemote ? WorkMode.REMOTE : isHybrid ? WorkMode.HYBRID : WorkMode.ONSITE;

          const commitment = (raw.categories?.commitment ?? '').toLowerCase();
          const employmentType = commitment.includes('contract')
            ? EmploymentType.CONTRACT
            : commitment.includes('part')
              ? EmploymentType.PART_TIME
              : commitment.includes('intern')
                ? EmploymentType.INTERNSHIP
                : EmploymentType.FULL_TIME;

          jobs.push({
            source: this.id,
            sourceJobId: raw.id,
            sourceUrl: raw.hostedUrl,
            applicationUrl: raw.applyUrl || raw.hostedUrl,
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            title: raw.text,
            rawDescription: raw.descriptionPlain || raw.description || raw.text,
            location: locationName,
            country: isRemote ? 'Global' : 'USA',
            workMode,
            employmentType,
            postedAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
            metadata: {
              team: raw.categories?.team,
              leverId: raw.id,
            },
          });
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch Lever company "${company}": ${err.message}`);
      }
    }

    return {
      jobs,
      totalFetched: jobs.length,
    };
  }
}
