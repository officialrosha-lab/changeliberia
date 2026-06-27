import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MoMoService } from './providers/momo.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class MoMoWebhookService {
  private readonly logger = new Logger(MoMoWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly momoService: MoMoService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  /**
   * Handle MoMo webhook events
   */
  async handleWebhook(payload: any, signature?: string): Promise<void> {
    try {
      this.logger.debug(`Received MoMo webhook: ${JSON.stringify(payload)}`);

      // Signature is required in production; always verified when MOMO_WEBHOOK_SECRET is set
      if (!this.verifyWebhookSignature(payload, signature)) {
        this.logger.error('Invalid or missing webhook signature');
        throw new Error('Invalid webhook signature');
      }

      const { externalId, status, transactionId, reason } = payload;

      // Handle different event types
      if (payload.eventType === 'requestToPay' || payload.status) {
        await this.handlePaymentStatusUpdate(externalId, status, transactionId, reason);
      } else if (payload.eventType === 'preApproval') {
        await this.handlePreApprovalUpdate(externalId, status);
      } else if (payload.eventType === 'payment') {
        await this.handleSubscriptionPayment(externalId, status, transactionId, reason);
      } else {
        this.logger.warn(`Unknown webhook event type: ${payload.eventType}`);
      }
    } catch (error) {
      this.logger.error('Failed to handle MoMo webhook', error);
      throw error;
    }
  }

  /**
   * Handle payment status updates
   */
  private async handlePaymentStatusUpdate(
    externalId: string,
    status: string,
    transactionId?: string,
    reason?: string,
  ): Promise<void> {
    // Find payment by external ID
    const payment = await this.prisma.payment.findFirst({
      where: { momoExternalId: externalId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for external ID: ${externalId}`);
      return;
    }

    let newStatus: PaymentStatus;
    let failureReason: string | undefined;

    switch (status.toUpperCase()) {
      case 'SUCCESSFUL':
        newStatus = 'COMPLETED';
        break;
      case 'FAILED':
        newStatus = 'FAILED';
        failureReason = reason || 'Payment declined by user';
        break;
      case 'PENDING':
        newStatus = 'PENDING';
        break;
      default:
        this.logger.warn(`Unknown payment status: ${status}`);
        return;
    }

    // Update payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        momoStatus: status,
        momoTransactionId: transactionId,
        momoErrorMessage: failureReason,
        completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    this.logger.debug(`Updated payment ${payment.id} status to ${newStatus}`);

    this.activityLogger.logAsync({
      userId: payment.userId ?? undefined,
      action: newStatus === 'COMPLETED' ? 'PAYMENT_COMPLETED' : 'PAYMENT_FAILED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `MoMo payment ${newStatus.toLowerCase()} for payment ${payment.id}`,
      status: newStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      errorMessage: failureReason,
      changes: {
        momoExternalId: externalId,
        momoStatus: status,
      },
    });
  }

  /**
   * Handle pre-approval status updates
   */
  private async handlePreApprovalUpdate(
    externalId: string,
    status: string,
  ): Promise<void> {
    // Find subscription by pre-approval ID
    const subscription = await this.prisma.subscription.findFirst({
      where: { momoPreapprovalId: externalId },
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for pre-approval ID: ${externalId}`);
      return;
    }

    // Update pre-approval authorization
    const authUpdate = await this.prisma.moMoSubscriptionAuthorization.updateMany({
      where: { preapprovalId: externalId },
      data: {
        status: status.toUpperCase() === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      },
    });

    // Update subscription status
    if (status.toUpperCase() === 'APPROVED') {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' as SubscriptionStatus },
      });
      this.logger.debug(`Activated subscription ${subscription.id}`);
    } else {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED' as SubscriptionStatus },
      });
      this.logger.debug(`Cancelled subscription ${subscription.id} due to pre-approval rejection`);
    }
  }

  /**
   * Handle subscription payment updates
   */
  private async handleSubscriptionPayment(
    externalId: string,
    status: string,
    transactionId?: string,
    reason?: string,
  ): Promise<void> {
    // Find subscription payment by external ID
    const payment = await this.prisma.payment.findFirst({
      where: { momoExternalId: externalId },
    });

    if (!payment) {
      this.logger.warn(`Subscription payment not found for external ID: ${externalId}`);
      return;
    }

    let newStatus: PaymentStatus;
    let failureReason: string | undefined;

    switch (status.toUpperCase()) {
      case 'SUCCESSFUL':
        newStatus = 'COMPLETED';
        break;
      case 'FAILED':
        newStatus = 'FAILED';
        failureReason = reason || 'Subscription payment failed';
        break;
      case 'PENDING':
        newStatus = 'PENDING';
        break;
      default:
        this.logger.warn(`Unknown subscription payment status: ${status}`);
        return;
    }

    // Update payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        momoStatus: status,
        momoTransactionId: transactionId,
        momoErrorMessage: failureReason,
        completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // If successful, update subscription billing dates
    if (newStatus === 'COMPLETED' && payment.subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
      });

      if (subscription) {
        const nextBillingDate = this.calculateNextBillingDate(subscription.interval);
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: subscription.nextBillingDate || new Date(),
            currentPeriodEnd: nextBillingDate,
            nextBillingDate,
          },
        });
      }
    }

    this.logger.debug(`Updated subscription payment ${payment.id} status to ${newStatus}`);

    this.activityLogger.logAsync({
      userId: payment.userId ?? undefined,
      action: newStatus === 'COMPLETED' ? 'SUBSCRIPTION_PAYMENT_COMPLETED' : 'SUBSCRIPTION_PAYMENT_FAILED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `MoMo subscription payment ${newStatus.toLowerCase()} for payment ${payment.id}`,
      status: newStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      changes: {
        momoExternalId: externalId,
        momoStatus: status,
      },
    });
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature?: string): boolean {
    const secret = process.env.MOMO_WEBHOOK_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MOMO_WEBHOOK_SECRET is required in production');
      }
      this.logger.warn('MoMo webhook secret not configured - skipping signature verification (development only)');
      return true;
    }

    if (!signature) {
      if (process.env.NODE_ENV === 'production') {
        return false;
      }
      this.logger.warn('MoMo webhook signature missing (development only - skipping)');
      return true;
    }

    const expectedSignature = this.momoService.generateWebhookSignature(payload, secret);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Calculate next billing date for subscription
   */
  private calculateNextBillingDate(interval: string): Date {
    const now = new Date();
    switch (interval) {
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  }
}