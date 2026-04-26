import { Injectable, Logger } from '@nestjs/common';
import {
  EmailTemplate,
  EmailTemplateType,
  PaymentConfirmationData,
  PaymentFailedData,
  SubscriptionData,
  RefundData,
} from './email.types';

/**
 * Email Template Generator
 * Creates HTML and text email templates for payment webhook events
 */
@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly appUrl = process.env.APP_URL || 'https://liberianvoices.org';
  private readonly appName = 'Liberian Voices';

  /**
   * Generate payment confirmation email
   */
  generatePaymentConfirmation(
    recipientEmail: string,
    recipientName: string,
    data: PaymentConfirmationData,
  ): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);
    const formattedDate = data.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      templateType: 'payment_confirmation',
      recipientEmail,
      recipientName,
      subject: `Payment Confirmation - ${formattedAmount}`,
      htmlContent: this.buildPaymentConfirmationHTML(
        recipientName,
        formattedAmount,
        data.petitionTitle,
        data.transactionId,
        formattedDate,
      ),
      textContent: this.buildPaymentConfirmationText(
        recipientName,
        formattedAmount,
        data.petitionTitle,
        data.transactionId,
        formattedDate,
      ),
      data,
    };
  }

  /**
   * Generate payment failed email
   */
  generatePaymentFailed(
    recipientEmail: string,
    recipientName: string,
    data: PaymentFailedData,
  ): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);

    return {
      templateType: 'payment_failed',
      recipientEmail,
      recipientName,
      subject: `Payment Failed - We Need Your Help`,
      htmlContent: this.buildPaymentFailedHTML(
        recipientName,
        formattedAmount,
        data.reason,
        data.retryUrl,
      ),
      textContent: this.buildPaymentFailedText(
        recipientName,
        formattedAmount,
        data.reason,
      ),
      data,
    };
  }

  /**
   * Generate subscription welcome email
   */
  generateSubscriptionWelcome(
    recipientEmail: string,
    recipientName: string,
    data: SubscriptionData,
  ): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);
    const nextBillingDate = data.nextBillingDate?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      templateType: 'subscription_welcome',
      recipientEmail,
      recipientName,
      subject: `Welcome to Our Recurring Donation Program!`,
      htmlContent: this.buildSubscriptionWelcomeHTML(
        recipientName,
        formattedAmount,
        data.interval,
        nextBillingDate,
        data.petitionTitle,
      ),
      textContent: this.buildSubscriptionWelcomeText(
        recipientName,
        formattedAmount,
        data.interval,
      ),
      data,
    };
  }

  /**
   * Generate subscription receipt email
   */
  generateSubscriptionReceipt(
    recipientEmail: string,
    recipientName: string,
    data: SubscriptionData,
  ): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);

    return {
      templateType: 'subscription_receipt',
      recipientEmail,
      recipientName,
      subject: `Your Recurring Donation Receipt`,
      htmlContent: this.buildSubscriptionReceiptHTML(
        recipientName,
        formattedAmount,
        data.interval,
        data.petitionTitle,
      ),
      textContent: this.buildSubscriptionReceiptText(
        recipientName,
        formattedAmount,
        data.interval,
      ),
      data,
    };
  }

  /**
   * Generate subscription cancellation email
   */
  generateSubscriptionCancellation(
    recipientEmail: string,
    recipientName: string,
    data: SubscriptionData,
  ): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);

    return {
      templateType: 'subscription_cancelled',
      recipientEmail,
      recipientName,
      subject: `Your Recurring Donation Has Been Cancelled`,
      htmlContent: this.buildSubscriptionCancellationHTML(
        recipientName,
        formattedAmount,
        data.interval,
      ),
      textContent: this.buildSubscriptionCancellationText(
        recipientName,
        formattedAmount,
        data.interval,
      ),
      data,
    };
  }

  /**
   * Generate refund email
   */
  generateRefund(
    recipientEmail: string,
    recipientName: string,
    data: RefundData,
  ): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount, data.currency);

    return {
      templateType: 'refund_notification',
      recipientEmail,
      recipientName,
      subject: `Refund Processed - ${formattedAmount}`,
      htmlContent: this.buildRefundHTML(
        recipientName,
        formattedAmount,
        data.reason,
        data.originalTransactionId,
      ),
      textContent: this.buildRefundText(
        recipientName,
        formattedAmount,
        data.reason,
      ),
      data,
    };
  }

  // HTML Template Builders

  private buildPaymentConfirmationHTML(
    name: string,
    amount: string,
    petitionTitle: string | undefined,
    transactionId: string,
    date: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
    .highlight { background-color: #f0f0f0; padding: 10px; border-left: 4px solid #27ae60; }
    a { color: #3498db; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <p>Thank you for your generous donation! We're grateful for your support.</p>
      <div class="highlight">
        <p><strong>Payment Details:</strong></p>
        <p>Amount: <strong>${amount}</strong></p>
        <p>Date: ${date}</p>
        <p>Transaction ID: ${transactionId}</p>
        ${petitionTitle ? `<p>Petition: ${petitionTitle}</p>` : ''}
      </div>
      <p>Your contribution will help us make a real difference in Liberia. Thank you for standing with us!</p>
      <p><a href="${this.appUrl}/dashboard">View your contributions</a></p>
      <p>Best regards,<br/>The ${this.appName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 ${this.appName}. All rights reserved.</p>
      <p>If you have any questions, please contact us at support@liberianvoices.org</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildPaymentConfirmationText(
    name: string,
    amount: string,
    petitionTitle: string | undefined,
    transactionId: string,
    date: string,
  ): string {
    return `
Payment Confirmation

Dear ${name},

Thank you for your generous donation! We're grateful for your support.

PAYMENT DETAILS:
Amount: ${amount}
Date: ${date}
Transaction ID: ${transactionId}
${petitionTitle ? `Petition: ${petitionTitle}` : ''}

Your contribution will help us make a real difference in Liberia. Thank you for standing with us!

View your contributions: ${this.appUrl}/dashboard

Best regards,
The ${this.appName} Team

---
If you have any questions, please contact us at support@liberianvoices.org
    `.trim();
  }

  private buildPaymentFailedHTML(
    name: string,
    amount: string,
    reason: string,
    retryUrl?: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
    .alert { background-color: #fff3cd; padding: 10px; border-left: 4px solid #e74c3c; margin: 10px 0; }
    .button { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 3px; margin: 10px 0; }
    a { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <div class="alert">
        <p><strong>Your payment of ${amount} could not be processed.</strong></p>
        <p>Reason: ${reason}</p>
      </div>
      <p>Don't worry! We understand that payment issues happen. Please try again using a different payment method or contact your bank for more information.</p>
      ${
        retryUrl
          ? `<p><a href="${retryUrl}" class="button">Try Payment Again</a></p>`
          : '<p><a href="' +
            this.appUrl +
            '/payments" class="button">Retry Payment</a></p>'
      }
      <p>If you continue to experience issues, please contact us at support@liberianvoices.org for assistance.</p>
      <p>Thank you for your patience and support!</p>
      <p>Best regards,<br/>The ${this.appName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 ${this.appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildPaymentFailedText(
    name: string,
    amount: string,
    reason: string,
  ): string {
    return `
Payment Failed

Dear ${name},

Your payment of ${amount} could not be processed.
Reason: ${reason}

Don't worry! We understand that payment issues happen. Please try again using a different payment method or contact your bank for more information.

Retry Payment: ${this.appUrl}/payments

If you continue to experience issues, please contact us at support@liberianvoices.org for assistance.

Thank you for your patience and support!

Best regards,
The ${this.appName} Team

---
If you have any questions, please contact us at support@liberianvoices.org
    `.trim();
  }

  private buildSubscriptionWelcomeHTML(
    name: string,
    amount: string,
    interval: string,
    nextBillingDate: string | undefined,
    petitionTitle?: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
    .highlight { background-color: #f0f0f0; padding: 10px; border-left: 4px solid #27ae60; }
    a { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Our Recurring Donation Program!</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <p>Thank you for setting up a recurring donation! Your commitment to making a difference in Liberia is truly inspiring.</p>
      <div class="highlight">
        <p><strong>Your Recurring Donation:</strong></p>
        <p>Amount: <strong>${amount} ${interval}</strong></p>
        ${nextBillingDate ? `<p>Next billing date: ${nextBillingDate}</p>` : ''}
        ${petitionTitle ? `<p>Supporting: ${petitionTitle}</p>` : ''}
      </div>
      <p>You can manage your subscription at any time from your dashboard. Thank you for your continued support!</p>
      <p><a href="${this.appUrl}/dashboard">Visit Your Dashboard</a></p>
      <p>Best regards,<br/>The ${this.appName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 ${this.appName}. All rights reserved.</p>
      <p>If you have any questions, please contact us at support@liberianvoices.org</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildSubscriptionWelcomeText(
    name: string,
    amount: string,
    interval: string,
  ): string {
    return `
Welcome to Our Recurring Donation Program!

Dear ${name},

Thank you for setting up a recurring donation! Your commitment to making a difference in Liberia is truly inspiring.

YOUR RECURRING DONATION:
Amount: ${amount} ${interval}

You can manage your subscription at any time from your dashboard. Thank you for your continued support!

Visit Your Dashboard: ${this.appUrl}/dashboard

Best regards,
The ${this.appName} Team

---
If you have any questions, please contact us at support@liberianvoices.org
    `.trim();
  }

  private buildSubscriptionReceiptHTML(
    name: string,
    amount: string,
    interval: string,
    petitionTitle?: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
    .highlight { background-color: #f0f0f0; padding: 10px; border-left: 4px solid #27ae60; }
    a { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recurring Donation Receipt</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <p>Thank you for your recurring donation! Your payment has been processed successfully.</p>
      <div class="highlight">
        <p><strong>Payment Details:</strong></p>
        <p>Amount: <strong>${amount}</strong></p>
        <p>Frequency: ${interval}</p>
        ${petitionTitle ? `<p>Supporting: ${petitionTitle}</p>` : ''}
      </div>
      <p>Your donation is making a real impact. We appreciate your continued support!</p>
      <p><a href="${this.appUrl}/dashboard">View Your Subscriptions</a></p>
      <p>Best regards,<br/>The ${this.appName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 ${this.appName}. All rights reserved.</p>
      <p>If you have any questions, please contact us at support@liberianvoices.org</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildSubscriptionReceiptText(
    name: string,
    amount: string,
    interval: string,
  ): string {
    return `
Recurring Donation Receipt

Dear ${name},

Thank you for your recurring donation! Your payment has been processed successfully.

PAYMENT DETAILS:
Amount: ${amount}
Frequency: ${interval}

Your donation is making a real impact. We appreciate your continued support!

View Your Subscriptions: ${this.appUrl}/dashboard

Best regards,
The ${this.appName} Team

---
If you have any questions, please contact us at support@liberianvoices.org
    `.trim();
  }

  private buildSubscriptionCancellationHTML(
    name: string,
    amount: string,
    interval: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #95a5a6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
    .alert { background-color: #ecf0f1; padding: 10px; border-left: 4px solid #95a5a6; }
    a { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recurring Donation Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <div class="alert">
        <p>Your recurring donation of <strong>${amount} ${interval}</strong> has been cancelled.</p>
      </div>
      <p>We understand that circumstances change, and we respect your decision. If you'd like to set up another recurring donation in the future, we'd love to have you back.</p>
      <p><a href="${this.appUrl}/petitions">Browse Petitions</a></p>
      <p>Thank you for your past support!</p>
      <p>Best regards,<br/>The ${this.appName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 ${this.appName}. All rights reserved.</p>
      <p>If you have any questions, please contact us at support@liberianvoices.org</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildSubscriptionCancellationText(
    name: string,
    amount: string,
    interval: string,
  ): string {
    return `
Recurring Donation Cancelled

Dear ${name},

Your recurring donation of ${amount} ${interval} has been cancelled.

We understand that circumstances change, and we respect your decision. If you'd like to set up another recurring donation in the future, we'd love to have you back.

Browse Petitions: ${this.appUrl}/petitions

Thank you for your past support!

Best regards,
The ${this.appName} Team

---
If you have any questions, please contact us at support@liberianvoices.org
    `.trim();
  }

  private buildRefundHTML(
    name: string,
    amount: string,
    reason: string,
    transactionId: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
    .highlight { background-color: #f0f0f0; padding: 10px; border-left: 4px solid #f39c12; }
    a { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Processed</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <p>We have processed your refund as requested.</p>
      <div class="highlight">
        <p><strong>Refund Details:</strong></p>
        <p>Amount: <strong>${amount}</strong></p>
        <p>Reason: ${reason}</p>
        <p>Original Transaction ID: ${transactionId}</p>
        <p>The refund should appear in your account within 3-5 business days.</p>
      </div>
      <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
      <p><a href="${this.appUrl}/support">Contact Support</a></p>
      <p>Best regards,<br/>The ${this.appName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 ${this.appName}. All rights reserved.</p>
      <p>If you have any questions, please contact us at support@liberianvoices.org</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private buildRefundText(
    name: string,
    amount: string,
    reason: string,
  ): string {
    return `
Refund Processed

Dear ${name},

We have processed your refund as requested.

REFUND DETAILS:
Amount: ${amount}
Reason: ${reason}

The refund should appear in your account within 3-5 business days.

If you have any questions or concerns, please don't hesitate to contact us.

Contact Support: ${this.appUrl}/support

Best regards,
The ${this.appName} Team

---
If you have any questions, please contact us at support@liberianvoices.org
    `.trim();
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(amount / 100); // Stripe amounts are in cents
  }
}
