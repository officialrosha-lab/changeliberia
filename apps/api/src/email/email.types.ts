/**
 * Email service types and interfaces
 */

export type EmailTemplateType =
  | 'payment_confirmation'
  | 'payment_failed'
  | 'subscription_welcome'
  | 'subscription_receipt'
  | 'subscription_cancelled'
  | 'refund_notification'
  | 'petition_to_institution'
  | 'petition_routing_confirmation'
  | 'email_verification'
  | 'password_reset'
  | 'password_reset_confirmation'
  | 'feedback_notification';

export interface EmailTemplate {
  templateType: EmailTemplateType;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  data?: Record<string, any>;
}

export interface PaymentConfirmationData {
  amount: number;
  currency: string;
  petitionTitle?: string;
  transactionId: string;
  date: Date;
}

export interface PaymentFailedData {
  amount: number;
  currency: string;
  reason: string;
  retryUrl?: string;
}

export interface SubscriptionData {
  amount: number;
  currency: string;
  interval: string;
  petitionTitle?: string;
  nextBillingDate?: Date;
}

export interface RefundData {
  amount: number;
  currency: string;
  reason: string;
  originalTransactionId: string;
}
