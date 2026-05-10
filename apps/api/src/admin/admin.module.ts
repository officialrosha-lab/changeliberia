import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';
import { EventsModule } from '../events/events.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminController } from './admin.controller';
import { StripeAdminController } from './stripe-admin.controller';
import { FacebookAdminController } from './facebook-admin.controller';
import { PaymentService } from '../payments/payment.service';
import { FacebookPixelService } from '../facebook/facebook-pixel.service';
import { FacebookService } from '../facebook/facebook.service';

@Module({
  imports: [AuthModule, VerificationModule, PrismaModule, EventsModule],
  controllers: [
    AdminController,
    AdminSettingsController,
    StripeAdminController,
    FacebookAdminController,
  ],
  providers: [PaymentService, FacebookPixelService, FacebookService],
})
export class AdminModule {}
