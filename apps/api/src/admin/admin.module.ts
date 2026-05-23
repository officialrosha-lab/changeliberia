import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationModule } from '../verification/verification.module';
import { EventsModule } from '../events/events.module';
import { PaymentModule } from '../payments/payment.module';
import { ActivityModule } from '../activity/activity.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminController } from './admin.controller';
import { StripeAdminController } from './stripe-admin.controller';
import { FacebookAdminController } from './facebook-admin.controller';
import { FacebookPixelService } from '../facebook/facebook-pixel.service';
import { FacebookService } from '../facebook/facebook.service';
import { FacebookSDKService } from '../facebook/facebook-sdk.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { GrowthService } from '../whatsapp/growth.service';
import { AdminSocialMediaService } from './admin-social-media.service';

@Module({
  imports: [AuthModule, VerificationModule, PrismaModule, EventsModule, PaymentModule, ActivityModule],
  controllers: [
    AdminController,
    AdminSettingsController,
    StripeAdminController,
    FacebookAdminController,
  ],
  providers: [
    FacebookPixelService,
    FacebookService,
    FacebookSDKService,
    WhatsAppService,
    GrowthService,
    AdminSocialMediaService,
  ],
})
export class AdminModule {}
