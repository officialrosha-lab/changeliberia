import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { ActivityModule } from '../activity/activity.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookService } from './payment-webhook.service';
import { WebhookEventHandlerService } from './webhook-event-handler.service';
import { MoMoModule } from './momo.module';
import { StripeProviderAdapter } from './providers/stripe-provider.adapter';
import { MoMoProviderAdapter } from './providers/momo-provider.adapter';
import { DecimalConsistencyScheduler } from './decimal-consistency.scheduler';

@Module({
  imports: [PrismaModule, EmailModule, ActivityModule, MoMoModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentWebhookService,
    WebhookEventHandlerService,
    StripeProviderAdapter,
    MoMoProviderAdapter,
    DecimalConsistencyScheduler,
  ],
  exports: [
    PaymentService,
    PaymentWebhookService,
    StripeProviderAdapter,
    MoMoProviderAdapter,
  ],
})
export class PaymentModule {}
