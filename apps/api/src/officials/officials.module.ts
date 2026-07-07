import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { ActivityModule } from '../activity/activity.module';
import { OfficialsService } from './officials.service';
import { OfficialInboxService } from './official-inbox.service';
import { ResponseWorkflowService } from './response-workflow.service';
import { OfficialStaffService } from './official-staff.service';
import { OfficialOwnershipGuard } from './guards/official-ownership.guard';
import { OfficialsController } from './officials.controller';
import { OfficialProfileController } from './official-profile.controller';
import { AdminOfficialsController } from './admin-officials.controller';
import { OfficialStaffController } from './official-staff.controller';

@Module({
  imports: [PrismaModule, RbacModule, ActivityModule],
  providers: [
    OfficialsService,
    OfficialInboxService,
    ResponseWorkflowService,
    OfficialStaffService,
    OfficialOwnershipGuard,
  ],
  controllers: [
    OfficialsController,
    OfficialProfileController,
    AdminOfficialsController,
    OfficialStaffController,
  ],
  exports: [OfficialsService, ResponseWorkflowService],
})
export class OfficialsModule {}
