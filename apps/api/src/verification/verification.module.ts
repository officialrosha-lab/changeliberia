import { Module } from '@nestjs/common';
import { IdDocumentStorageService } from './id-document-storage.service';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  providers: [VerificationService, IdDocumentStorageService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
