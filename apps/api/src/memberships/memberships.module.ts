import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';
import { AdminModule } from '../admin/admin.module';
import { PaymentModule } from '../payments/payment.module';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { AdminMembershipsController } from './admin-memberships.controller';

@Module({
  imports: [PrismaModule, ActivityModule, AdminModule, PaymentModule],
  controllers: [MembershipsController, AdminMembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
