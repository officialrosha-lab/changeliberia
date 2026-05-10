import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetitionsModule } from './petitions/petitions.module';
import { SignaturesModule } from './signatures/signatures.module';
import { VerificationModule } from './verification/verification.module';
import { FraudModule } from './fraud/fraud.module';
import { AdminModule } from './admin/admin.module';
import { CaptchaModule } from './captcha/captcha.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { GovernmentModule } from './government/government.module';
import { FacebookModule } from './facebook/facebook.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentModule } from './payments/payment.module';
import { RbacModule } from './rbac/rbac.module';
import { ContactDirectoryModule } from './contact-directory/contact-directory.module';
import { ModeratorModule } from './moderator/moderator.module';
import { CMSModule } from './cms/cms.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { MembershipModule } from './membership/membership.module';
import { SupportersModule } from './supporters/supporters.module';
import { AmbassadorsModule } from './ambassadors/ambassadors.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    EventsModule,
    NotificationsModule,
    RbacModule,
    ContactDirectoryModule,
    ModeratorModule,
    CMSModule,
    SponsorsModule,
    MembershipModule,
    SupportersModule,
    AmbassadorsModule,
    AuthModule,
    UsersModule,
    EmailModule, // Import EmailModule before GovernmentModule
    PetitionsModule,
    SignaturesModule,
    VerificationModule,
    FraudModule,
    AdminModule,
    CaptchaModule,
    WhatsAppModule,
    GovernmentModule,
    FacebookModule,
    AnalyticsModule,
    PaymentModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
