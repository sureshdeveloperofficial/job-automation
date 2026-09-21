import { Injectable, Logger } from '@nestjs/common';
import { ConnectorCapability, WorkMode, EmploymentType } from '@career-os/types';
import { JobConnector, RawJobPayload, ConnectorFetchResult } from './connector.interface.js';

interface GreenhouseJobResponse {
  id: number;
  title: string;
  updated_at: string;
  location: { name: string };
  absolute_url: string;
  content?: string;
  departments?: Array<{ id: number; name: string }>;
  offices?: Array<{ id: number; name: string; location: string }>;
}

@Injectable()
export class GreenhouseConnector extends JobConnector {
  private readonly logger = new Logger(GreenhouseConnector.name);
  readonly id = 'GREENHOUSE';
  readonly name = 'Greenhouse Public Board Connector';
  readonly capabilities = [
    ConnectorCapability.JOB_SEARCH,
    ConnectorCapability.JOB_DETAILS,
    ConnectorCapability.COMPANY_JOBS,
    ConnectorCapability.RAW_JD_CAPTURE,
  ];

  private readonly defaultBoards = ['stripe', 'figma', 'gitlab', 'hashicorp'];

  async fetchJobs(options?: {
    companyIdentifier?: string;
    query?: string;
    limit?: number;
  }): Promise<ConnectorFetchResult> {
    const boards = options?.companyIdentifier ? [options.companyIdentifier] : this.defaultBoards;
    const limit = options?.limit ?? 50;
    const jobs: RawJobPayload[] = [];

    for (const board of boards) {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;
        this.logger.log(`Fetching public Greenhouse jobs for board "${board}"...`);

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
          this.logger.warn(`Greenhouse board "${board}" responded with HTTP ${response.status}`);
          continue;
        }

        const data = (await response.json()) as { jobs?: GreenhouseJobResponse[] };
        const rawJobs = data.jobs ?? [];

        for (const raw of rawJobs) {
          if (jobs.length >= limit) break;

          const locationName = raw.location?.name ?? 'Remote';
          const isRemote = /remote/i.test(locationName) || /remote/i.test(raw.title);
          const isHybrid = /hybrid/i.test(locationName);

          const workMode = isRemote ? WorkMode.REMOTE : isHybrid ? WorkMode.HYBRID : WorkMode.ONSITE;

          jobs.push({
            source: this.id,
            sourceJobId: String(raw.id),
            sourceUrl: raw.absolute_url,
            applicationUrl: raw.absolute_url,
            companyName: board.charAt(0).toUpperCase() + board.slice(1),
            title: raw.title,
            rawDescription: raw.content ?? raw.title,
            location: locationName,
            country: isRemote ? 'Global' : 'USA',
            workMode,
            employmentType: EmploymentType.FULL_TIME,
            postedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(),
            metadata: {
              departments: raw.departments?.map((d) => d.name),
              greenhouseId: raw.id,
            },
          });
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch Greenhouse board "${board}": ${err.message}`);
      }
    }

    return {
      jobs,
      totalFetched: jobs.length,
    };
  }
}
