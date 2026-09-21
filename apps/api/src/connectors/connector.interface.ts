import { ConnectorCapability, WorkMode, EmploymentType, SeniorityLevel } from '@career-os/types';

export interface RawJobPayload {
  source: string;
  sourceJobId: string;
  sourceUrl?: string;
  applicationUrl?: string;
  companyName: string;
  title: string;
  rawDescription: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  seniority?: SeniorityLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: 'YEARLY' | 'MONTHLY' | 'HOURLY';
  postedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ConnectorFetchResult {
  jobs: RawJobPayload[];
  totalFetched: number;
  cursor?: string;
  hasMore?: boolean;
}

export abstract class JobConnector {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capabilities: ConnectorCapability[];

  abstract fetchJobs(options?: {
    companyIdentifier?: string;
    query?: string;
    limit?: number;
  }): Promise<ConnectorFetchResult>;
}
