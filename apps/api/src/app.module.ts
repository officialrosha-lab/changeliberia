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
import { SystemSettingsModule } from './admin/system-settings.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ActivityModule } from './activity/activity.module';
import { PollsModule } from './polls/polls.module';
import { MessagesModule } from './messages/messages.module';
import { StakeholderGroupModule } from './stakeholder-groups/stakeholder-group.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { OfficialsModule } from './officials/officials.module';
import { EndorsementsModule } from './endorsements/endorsements.module';
import { PushModule } from './push/push.module';
import { ChangeLiberiaGraphQLModule } from './graphql/graphql.module';

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
    PollsModule, // Civic Pulse: Polling & Public Sentiment
    MessagesModule, // Phase 1: Internal Messaging
    StakeholderGroupModule, // Phase 1: Stakeholder Groups
    BroadcastModule, // Phase 1: Broadcast messaging
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
    SystemSettingsModule,
    FeedbackModule,
    ActivityModule,
    OfficialsModule, // Public Officials Portal
    EndorsementsModule, // Public Officials Portal: community leader endorsements
    PushModule, // Web push notifications
    ChangeLiberiaGraphQLModule, // Read-only GraphQL API for research/civil-society consumers
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
