import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { ActivityModule } from '../activity/activity.module';
import { IdDocumentStorageService } from './id-document-storage.service';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [SmsModule, ActivityModule],
  providers: [VerificationService, IdDocumentStorageService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
