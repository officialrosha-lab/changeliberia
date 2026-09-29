import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { GeographyService } from './geography.service';
import { GeographyController } from './geography.controller';
import { AdminGeographyController } from './admin-geography.controller';

@Module({
  imports: [PrismaModule, ActivityModule],
  providers: [GeographyService],
  controllers: [GeographyController, AdminGeographyController],
  exports: [GeographyService],
})
export class GeographyModule {}
