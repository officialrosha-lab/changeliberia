import { Module } from '@nestjs/common';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';
import { FileUploadService } from './file-upload.service';
import { VersionHistoryService } from './version-history.service';
import { ContentSchedulingService } from './content-scheduling.service';
import { CMSAnalyticsService } from './cms-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  providers: [
    CMSService,
    FileUploadService,
    VersionHistoryService,
    ContentSchedulingService,
    CMSAnalyticsService,
  ],
  controllers: [CMSController],
  exports: [CMSService, FileUploadService, VersionHistoryService, ContentSchedulingService, CMSAnalyticsService],
})
export class CMSModule {}
