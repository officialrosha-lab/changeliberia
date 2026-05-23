import { Module } from '@nestjs/common';
import { ContactDirectoryService } from './contact-directory.service';
import { SmartRoutingService } from './routing/smart-routing.service';
import { AdminDirectoryController } from './admin-directory.controller';
import { BulkImportService } from '../bulk-import/bulk-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, ActivityModule],
  providers: [
    ContactDirectoryService,
    SmartRoutingService,
    BulkImportService,
  ],
  controllers: [AdminDirectoryController],
  exports: [
    ContactDirectoryService,
    SmartRoutingService,
    BulkImportService,
  ],
})
export class ContactDirectoryModule {}
