import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailQueueService } from './email-queue.service';

@Module({
  providers: [EmailService, EmailTemplateService, EmailQueueService],
  exports: [EmailService, EmailTemplateService, EmailQueueService],
})
export class EmailModule {}
