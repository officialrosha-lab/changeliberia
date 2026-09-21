import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailPreferenceService } from './services/email-preference.service';
import { EmailEventService } from './services/email-event.service';
import { EmailScheduleService } from './services/email-schedule.service';
import { ResendProvider } from './providers/resend.provider';
import { EmailController, AdminEmailController } from './controllers/email.controller';
import { ResendWebhookController } from './webhooks/resend-webhook.controller';

@Module({
  providers: [
    EmailService,
    EmailTemplateService,
    EmailTrackingService,
    EmailPreferenceService,
    EmailEventService,
    EmailScheduleService,
    ResendProvider,
  ],
  controllers: [EmailController, AdminEmailController, ResendWebhookController],
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
