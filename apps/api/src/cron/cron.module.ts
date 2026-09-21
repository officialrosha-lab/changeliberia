import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { FraudModule } from '../fraud/fraud.module';
import { CMSModule } from '../cms/cms.module';
import { MessagesModule } from '../messages/messages.module';
import { PetitionsModule } from '../petitions/petitions.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [FraudModule, CMSModule, MessagesModule, PetitionsModule, EmailModule],
  controllers: [CronController],
})
export class CronModule {}
