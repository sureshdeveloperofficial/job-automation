import { Module } from '@nestjs/common';
import { RoleProfilesService } from './role-profiles.service.js';
import { RoleProfilesController } from './role-profiles.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RoleProfilesController],
  providers: [RoleProfilesService],
  exports: [RoleProfilesService],
})
export class RoleProfilesModule {}
