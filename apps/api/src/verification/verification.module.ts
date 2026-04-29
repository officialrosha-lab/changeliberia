import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { IdDocumentStorageService } from './id-document-storage.service';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [SmsModule],
  providers: [VerificationService, IdDocumentStorageService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
