import { BadRequestException, Body, Controller, Logger, Post } from '@nestjs/common';
import { EmailService } from '../email/email.service';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Controller('feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Submit feedback from visitors
   */
  @Post()
  async submitFeedback(
    @Body('name') name: string,
    @Body('email') email?: string,
    @Body('message') message?: string,
    @Body('source') source?: string,
    @Body('timestamp') timestamp?: string,
  ) {
    if (!name?.trim()) {
      throw new BadRequestException('Name is required');
    }
    if (!message?.trim()) {
      throw new BadRequestException('Message is required');
    }

    // Always log — the durable fallback if email transport is down/unconfigured
    this.logger.log(
      `Feedback received from ${name} (${email || 'no-email'}): ${message.substring(0, 100)}...`,
    );

    const recipient = process.env.FEEDBACK_EMAIL || process.env.EMAIL_REPLY_TO;
    if (recipient) {
      const safeName = escapeHtml(name.trim());
      const safeEmail = escapeHtml(email?.trim() || 'not provided');
      const safeMessage = escapeHtml(message.trim());
      const safeSource = escapeHtml(source || 'floating-widget');
      const sent = await this.emailService.sendEmail({
        templateType: 'feedback_notification',
        recipientEmail: recipient,
        subject: `New feedback from ${name.trim()}`,
        htmlContent: `
          <h2>New feedback submitted on Change Liberia</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Source:</strong> ${safeSource}</p>
          <p><strong>Submitted:</strong> ${escapeHtml(timestamp || new Date().toISOString())}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap;">${safeMessage}</p>
        `,
        textContent: `New feedback from ${name.trim()} (${email || 'no-email'}) via ${source || 'floating-widget'}:\n\n${message.trim()}`,
      });
      if (!sent) {
        this.logger.warn('Feedback email delivery failed; feedback preserved in logs only');
      }
    } else {
      this.logger.warn(
        'FEEDBACK_EMAIL / EMAIL_REPLY_TO not configured; feedback preserved in logs only',
      );
    }

    return {
      success: true,
      message: 'Thank you for your feedback! We appreciate your input and will review it shortly.',
    };
  }
}
