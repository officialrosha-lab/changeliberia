import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailPreferenceService } from './services/email-preference.service';
import { EmailEventService } from './services/email-event.service';
import { EmailScheduleService } from './services/email-schedule.service';
import { MailerooProvider } from './providers/maileroo.provider';
import { EmailController, AdminEmailController } from './controllers/email.controller';
import { MailerooWebhookController } from './webhooks/maileroo-webhook.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [
    EmailService,
    EmailTemplateService,
    EmailTrackingService,
    EmailPreferenceService,
    EmailEventService,
    EmailScheduleService,
    MailerooProvider,
  ],
  controllers: [EmailController, AdminEmailController, MailerooWebhookController],
  exports: [
    EmailService,
    EmailTemplateService,
    EmailTrackingService,
    EmailPreferenceService,
    EmailEventService,
    EmailScheduleService,
    MailerooProvider,
  ],
})
export class EmailModule {}
