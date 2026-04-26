import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailTemplate } from './email.types';

/**
 * Email Service
 * Handles sending emails using Nodemailer
 * Supports various email templates for payment events
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment configuration
   */
  private initializeTransporter() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

    if (emailProvider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025', 10),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
      });
      this.logger.log(
        `Email service initialized with SMTP provider: ${process.env.SMTP_HOST}`,
      );
    } else if (emailProvider === 'sendgrid') {
      // SendGrid configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY || '',
        },
      });
      this.logger.log('Email service initialized with SendGrid provider');
    } else {
      // Development mode - use MailHog or similar
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
      });
      this.logger.log('Email service initialized with development provider');
    }
  }

  /**
   * Send email using template
   */
  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@liberianvoices.org',
        to: template.recipientEmail,
        subject: template.subject,
        html: template.htmlContent,
        text: template.textContent,
        replyTo: process.env.EMAIL_REPLY_TO || 'support@liberianvoices.org',
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully: ${template.templateType} to ${template.recipientEmail} (MessageID: ${info.messageId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email (${template.templateType}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(templates: EmailTemplate[]): Promise<number> {
    let successCount = 0;

    for (const template of templates) {
      const success = await this.sendEmail(template);
      if (success) {
        successCount++;
      }
    }

    this.logger.log(
      `Sent ${successCount}/${templates.length} emails successfully`,
    );
    return successCount;
  }

  /**
   * Verify email service connectivity
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error(
        `Email service connection failed: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
