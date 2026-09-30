import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { AdminModule } from '../admin/admin.module';
import { PaymentModule } from '../payments/payment.module';
import { OfficialsModule } from '../officials/officials.module';
import { WorkspacePlansService } from './workspace-plans.service';
import { OrganizationsService } from './organizations.service';
import { InstitutionSubscriptionsService } from './institution-subscriptions.service';
import { WorkspacePlansController } from './workspace-plans.controller';
import { AdminWorkspacePlansController } from './admin-workspace-plans.controller';
import { OrganizationsController } from './organizations.controller';
import { InstitutionSubscriptionsController } from './institution-subscriptions.controller';

@Module({
  imports: [
    PrismaModule,
    ActivityModule,
    AdminModule,
    PaymentModule,
    OfficialsModule,
  ],
  controllers: [
    WorkspacePlansController,
    AdminWorkspacePlansController,
    OrganizationsController,
    InstitutionSubscriptionsController,
  ],
  providers: [
    WorkspacePlansService,
    OrganizationsService,
    InstitutionSubscriptionsService,
  ],
  exports: [
    WorkspacePlansService,
    OrganizationsService,
    InstitutionSubscriptionsService,
  ],
})
export class OrganizationsModule {}
