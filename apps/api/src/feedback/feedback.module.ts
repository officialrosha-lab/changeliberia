import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { EmailService } from '../email/email.service';

// The legacy nodemailer EmailService (src/email/email.service.ts) is a
// standalone zero-dependency injectable not provided by EmailModule (which
// exports the newer template-registry EmailService from services/), so it
// is provided here directly.
@Module({
  controllers: [FeedbackController],
  providers: [EmailService],
})
export class FeedbackModule {}
