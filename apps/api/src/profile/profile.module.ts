import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { ProfileController } from './profile.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
