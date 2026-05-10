import { Injectable, Logger, Optional } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import {
  EmailTemplate,
  PaymentConfirmationData,
  PaymentFailedData,
  SubscriptionData,
  RefundData,
} from './email.types';

/**
 * Email Queue Service
 * Provides methods to queue and send emails for webhook events
 * Called from WebhookEventHandlerService
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @Optional() private readonly emailService: EmailService | null,
    @Optional() private readonly templateService: EmailTemplateService | null,
  ) {}

  /**
   * Queue payment confirmation email
   */
  async queuePaymentConfirmation(
    recipientEmail: string,
    recipientName: string,
    data: PaymentConfirmationData,
  ): Promise<boolean> {
    try {
      const template = this.templateService.generatePaymentConfirmation(
        recipientEmail,
        recipientName,
        data,
      );
      return this.sendEmailAsync(template);
    } catch (error) {
      this.logger.error(
        `Failed to queue payment confirmation email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * Queue payment failed email
   */
  async queuePaymentFailed(
    recipientEmail: string,
    recipientName: string,
    data: PaymentFailedData,
  ): Promise<boolean> {
    try {
      const template = this.templateService.generatePaymentFailed(
        recipientEmail,
        recipientName,
        data,
      );
      return this.sendEmailAsync(template);
    } catch (error) {
      this.logger.error(
        `Failed to queue payment failed email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * Queue subscription welcome email
   */
  async queueSubscriptionWelcome(
    recipientEmail: string,
    recipientName: string,
    data: SubscriptionData,
  ): Promise<boolean> {
    try {
      const template = this.templateService.generateSubscriptionWelcome(
        recipientEmail,
        recipientName,
        data,
      );
      return this.sendEmailAsync(template);
    } catch (error) {
      this.logger.error(
        `Failed to queue subscription welcome email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * Queue subscription receipt email
   */
  async queueSubscriptionReceipt(
    recipientEmail: string,
    recipientName: string,
    data: SubscriptionData,
  ): Promise<boolean> {
    try {
      const template = this.templateService.generateSubscriptionReceipt(
        recipientEmail,
        recipientName,
        data,
      );
      return this.sendEmailAsync(template);
    } catch (error) {
      this.logger.error(
        `Failed to queue subscription receipt email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * Queue subscription cancellation email
   */
  async queueSubscriptionCancellation(
    recipientEmail: string,
    recipientName: string,
    data: SubscriptionData,
  ): Promise<boolean> {
    try {
      const template = this.templateService.generateSubscriptionCancellation(
        recipientEmail,
        recipientName,
        data,
      );
      return this.sendEmailAsync(template);
    } catch (error) {
      this.logger.error(
        `Failed to queue subscription cancellation email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * Queue refund email
   */
  async queueRefund(
    recipientEmail: string,
    recipientName: string,
    data: RefundData,
  ): Promise<boolean> {
    try {
      const template = this.templateService.generateRefund(
        recipientEmail,
        recipientName,
        data,
      );
      return this.sendEmailAsync(template);
    } catch (error) {
      this.logger.error(
        `Failed to queue refund email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * Send email asynchronously
   * Does not await - email is sent in background
   */
  private async sendEmailAsync(template: EmailTemplate): Promise<boolean> {
    // In production, this would queue to a message broker (Redis, RabbitMQ)
    // For now, we send synchronously but catch errors gracefully
    if (!this.emailService) {
      this.logger.warn('EmailService not available - cannot send email');
      return false;
    }

    try {
      const success = await this.emailService.sendEmail(template);
      if (!success) {
        this.logger.warn(
          `Email failed to send: ${template.templateType} to ${template.recipientEmail}`,
        );
        // In production, you might retry or queue for later delivery
      }
      return success;
    } catch (error) {
      this.logger.error(
        `Error sending email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }
}
