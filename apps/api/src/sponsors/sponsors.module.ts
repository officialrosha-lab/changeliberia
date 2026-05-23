import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { ActivityModule } from '../activity/activity.module';
import { AdminSponsorsController, SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';

@Module({
  imports: [PrismaModule, RbacModule, ActivityModule],
  providers: [SponsorsService],
  controllers: [SponsorsController, AdminSponsorsController],
})
export class SponsorsModule {}
