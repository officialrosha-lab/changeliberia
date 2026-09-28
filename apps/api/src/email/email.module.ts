import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailPreferenceService } from './services/email-preference.service';
import { EmailEventService } from './services/email-event.service';
import { EmailScheduleService } from './services/email-schedule.service';
import { PlunkProvider } from './providers/plunk.provider';
import { EmailController, AdminEmailController } from './controllers/email.controller';
import { PlunkWebhookController } from './webhooks/plunk-webhook.controller';

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
    PlunkProvider,
  ],
  controllers: [EmailController, AdminEmailController, PlunkWebhookController],
  exports: [
    EmailService,
    EmailTemplateService,
    EmailTrackingService,
    EmailPreferenceService,
    EmailEventService,
    EmailScheduleService,
    PlunkProvider,
  ],
})
export class EmailModule {}
