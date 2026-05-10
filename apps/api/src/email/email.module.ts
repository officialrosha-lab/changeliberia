import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { BULL_EMAIL_QUEUE } from './email.constants';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailPreferenceService } from './services/email-preference.service';
import { EmailEventService } from './services/email-event.service';
import { EmailScheduleService } from './services/email-schedule.service';
import { ResendProvider } from './providers/resend.provider';
import { EmailProcessor } from './processors/email.processor';
import { EmailController } from './controllers/email.controller';
import { ResendWebhookController } from './webhooks/resend-webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BULL_EMAIL_QUEUE,
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [
    EmailService,
    EmailTemplateService,
    EmailTrackingService,
    EmailPreferenceService,
    EmailEventService,
    EmailScheduleService,
    ResendProvider,
    EmailProcessor,
  ],
  controllers: [EmailController, ResendWebhookController],
  exports: [
    EmailService,
    EmailTemplateService,
    EmailTrackingService,
    EmailPreferenceService,
    EmailEventService,
    EmailScheduleService,
    ResendProvider,
  ],
})
export class EmailModule {}
