import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { ActivityModule } from '../activity/activity.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookService } from './payment-webhook.service';
import { WebhookEventHandlerService } from './webhook-event-handler.service';
import { MoMoModule } from './momo.module';

@Module({
  imports: [PrismaModule, EmailModule, ActivityModule, MoMoModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentWebhookService,
    WebhookEventHandlerService,
  ],
  exports: [PaymentService, PaymentWebhookService],
})
export class PaymentModule {}
