import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';
import { JobNormalizerService } from './pipeline/job-normalizer.service.js';
import { JobDeduplicationService } from './pipeline/job-deduplication.service.js';
import { JdAnalyzerService } from '../jd-analysis/jd-analyzer.service.js';
import { JdSnapshotService } from '../jd-analysis/jd-snapshot.service.js';
import { ConnectorsModule } from '../connectors/connectors.module.js';

@Module({
  imports: [ConnectorsModule],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobNormalizerService,
    JobDeduplicationService,
    JdAnalyzerService,
    JdSnapshotService,
  ],
  exports: [
    JobsService,
    JobNormalizerService,
    JobDeduplicationService,
    JdAnalyzerService,
    JdSnapshotService,
  ],
})
export class JobsModule {}
