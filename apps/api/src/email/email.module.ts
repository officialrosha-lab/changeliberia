import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { EmailTrackingService } from './services/email-tracking.service';
import { EmailPreferenceService } from './services/email-preference.service';
import { EmailEventService } from './services/email-event.service';
import { EmailScheduleService } from './services/email-schedule.service';
import { MailerooProvider } from './providers/maileroo.provider';
import {
  EmailController,
  AdminEmailController,
} from './controllers/email.controller';
import { MailerooWebhookController } from './webhooks/maileroo-webhook.controller';

@Module({
  // ScheduleModule.forRoot() is already registered once, globally, in
  // AppModule — registering it again here (as this module previously did)
  // created a second ScheduleExplorer that re-scanned every @Cron-decorated
  // provider app-wide and registered a second CronJob for each one, so
  // EVERY cron job in the app (not just this module's) silently fired
  // twice per tick. Confirmed live: a single on-demand constituency report
  // request was picked up and fully processed twice within the same
  // minute (duplicate files, duplicate emails). Do not re-add forRoot()
  // here; ScheduleModule's `global: true` already makes SchedulerRegistry
  // injectable everywhere without a second registration.
  imports: [],
  providers: [
    EmailService,
    EmailTemplateService,
    EmailTrackingService,
    EmailPreferenceService,
    EmailEventService,
    EmailScheduleService,
    MailerooProvider,
  ],
  controllers: [
    EmailController,
    AdminEmailController,
    MailerooWebhookController,
  ],
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
