import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service.js';
import { ResumesController } from './resumes.controller.js';
import { ResumeParserModule } from '../resume-parser/resume-parser.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, ResumeParserModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}
