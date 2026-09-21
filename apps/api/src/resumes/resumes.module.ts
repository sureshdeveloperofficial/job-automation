import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service.js';
import { ResumesController } from './resumes.controller.js';
import { ResumeParserModule } from '../resume-parser/resume-parser.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AtsScorerService } from './ats-scorer/ats-scorer.service.js';
import { ResumeDiffService } from './diff/resume-diff.service.js';
import { ResumeTailoringService } from './tailoring/resume-tailoring.service.js';
import { ResumeExportService } from './export/resume-export.service.js';
import { JdAnalyzerService } from '../jd-analysis/jd-analyzer.service.js';

@Module({
  imports: [PrismaModule, ResumeParserModule],
  controllers: [ResumesController],
  providers: [
    ResumesService,
    AtsScorerService,
    ResumeDiffService,
    ResumeTailoringService,
    ResumeExportService,
    JdAnalyzerService,
  ],
  exports: [
    ResumesService,
    AtsScorerService,
    ResumeDiffService,
    ResumeTailoringService,
    ResumeExportService,
  ],
})
export class ResumesModule {}
