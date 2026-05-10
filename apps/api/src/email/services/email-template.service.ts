import { Injectable, Logger } from '@nestjs/common';
import { EmailType } from '@prisma/client';
import {
  EmailTemplateProps,
} from '../templates/index';

export interface RenderedTemplate {
  html: string;
  text: string;
  subject: string;
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  /**
   * Render a template to HTML and text
   * Note: This is a simplified implementation that generates basic HTML.
   * For production, consider using proper email templating (EJS, Handlebars, etc.)
   */
  async renderTemplate(
    templateType: EmailType,
    props: EmailTemplateProps[EmailType],
  ): Promise<RenderedTemplate> {
    try {
      const subject = this.getSubjectForType(templateType);
      const html = this.generateHtmlForTemplate(templateType, props);
      const text = this.generateTextForTemplate(templateType, props);

      return { html, text, subject };
    } catch (error) {
      this.logger.error(
        `Failed to render template ${templateType}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Get subject line for email type
   */
  getSubjectForType(templateType: EmailType): string {
    const subjects: Record<EmailType, string> = {
      [EmailType.WELCOME]: 'Welcome to Change Liberia',
      [EmailType.VERIFY_EMAIL]: 'Verify your email address',
      [EmailType.PASSWORD_RESET]: 'Reset your password',
      [EmailType.PASSWORD_RESET_CONFIRMATION]: 'Password reset successful',
      [EmailType.PETITION_APPROVED]: 'Your petition has been approved',
      [EmailType.PETITION_REJECTED]: 'Your petition submission',
      [EmailType.MILESTONE_REACHED]: 'Petition milestone reached!',
      [EmailType.GOVERNMENT_SUBMISSION]: 'Petition submitted to government',
      [EmailType.OFFICIAL_RESPONSE]: 'Government response to your petition',
      [EmailType.WELCOME_TO_MOVEMENT]: 'Welcome to the movement',
      [EmailType.AMBASSADOR_UPDATE]: 'Ambassador update',
      [EmailType.COMMENT_REPLY]: 'You have a new reply',
      [EmailType.SIGNATURE_RECEIVED]: 'Thank you for your signature',
      [EmailType.WEEKLY_DIGEST]: 'Your weekly digest',
      [EmailType.DONATION_RECEIVED]: 'Thank you for your donation',
    };
    return subjects[templateType] || 'Notification from Change Liberia';
  }

  /**
   * Generate basic HTML for template
   * This is a placeholder that generates valid HTML
   */
  private generateHtmlForTemplate(
    templateType: EmailType,
    props: any,
  ): string {
    const recipientName = props?.recipientName || 'User';
    const appUrl = 'https://changeliberia.org';

    // Basic HTML wrapper with styling
    const header = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Change Liberia</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Building change together</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello ${recipientName},</p>
    `;

    const footer = `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>© 2025 Change Liberia. All rights reserved.</p>
            <p><a href="${appUrl}" style="color: #059669; text-decoration: none;">Visit our website</a></p>
          </div>
        </div>
      </div>
    `;

    // Template-specific content
    let content = '';
    switch (templateType) {
      case EmailType.WELCOME:
        content = `
          <p>Welcome to Change Liberia! We're excited to have you join our community.</p>
          <p>You can now create petitions, sign existing ones, and make your voice heard.</p>
          <p><a href="${props?.verifyUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a></p>
        `;
        break;

      case EmailType.VERIFY_EMAIL:
        content = `
          <p>Please verify your email address to complete your registration.</p>
          <p>Your verification code is: <strong>${props?.verificationCode || 'XXXXXX'}</strong></p>
          <p><a href="${props?.verifyUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
          <p style="font-size: 12px; color: #6b7280;">This code expires in 24 hours.</p>
        `;
        break;

      case EmailType.PASSWORD_RESET:
        content = `
          <p>We received a request to reset your password.</p>
          <p><a href="${props?.resetUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p style="font-size: 12px; color: #6b7280;">This link expires in ${props?.expiresIn || 60} minutes.</p>
        `;
        break;

      case EmailType.PASSWORD_RESET_CONFIRMATION:
        content = `
          <p>Your password has been successfully reset.</p>
          <p>You can now log in with your new password.</p>
          <p style="font-size: 12px; color: #6b7280;">If you didn't request this change, please contact us immediately.</p>
        `;
        break;

      case EmailType.PETITION_APPROVED:
        content = `
          <p>Great news! Your petition <strong>"${props?.petitionTitle || 'New Petition'}"</strong> has been approved.</p>
          <p>It is now live and people can sign it to support your cause.</p>
          <p><a href="${props?.petitionUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Petition</a></p>
        `;
        break;

      case EmailType.PETITION_REJECTED:
        content = `
          <p>Your petition submission was reviewed and could not be approved at this time.</p>
          <p><strong>Reason:</strong> ${props?.rejectionReason || 'Please review our guidelines'}</p>
          <p>You may submit a revised version or contact our support team for more information.</p>
        `;
        break;

      case EmailType.MILESTONE_REACHED:
        content = `
          <p>Congratulations! Your petition <strong>"${props?.petitionTitle || 'Petition'}"</strong> has reached a milestone:</p>
          <p style="font-size: 18px; color: #059669; font-weight: bold;">${props?.currentSignatures || 0} signatures</p>
          <p><a href="${props?.petitionUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Petition</a></p>
        `;
        break;

      case EmailType.WEEKLY_DIGEST:
        content = `
          <p>Here are this week's trending petitions:</p>
          <ul style="list-style: none; padding: 0;">
            ${props?.topPetitions?.map((p: any) => `
              <li style="padding: 10px; background: #f9fafb; margin: 10px 0; border-left: 4px solid #059669;">
                <strong>${p.title}</strong><br>
                ${p.signatureCount} signatures
              </li>
            `).join('') || '<li>No petitions available</li>'}
          </ul>
        `;
        break;

      case EmailType.DONATION_RECEIVED:
        content = `
          <p>Thank you for your generous donation of <strong>${props?.currency || '$'}${props?.donationAmount || 0}</strong> to <strong>"${props?.petitionTitle || 'our cause'}"</strong>.</p>
          <p>Your contribution makes a real difference in creating change.</p>
          <p style="font-size: 12px; color: #6b7280;">Receipt #: ${props?.receiptNumber || 'N/A'}</p>
        `;
        break;

      default:
        content = `
          <p>You have received a notification from Change Liberia.</p>
          <p><a href="${appUrl}" style="color: #059669; text-decoration: none;">View Details</a></p>
        `;
    }

    return header + content + footer;
  }

  /**
   * Generate plain text version of template
   */
  private generateTextForTemplate(
    templateType: EmailType,
    props: any,
  ): string {
    const recipientName = props?.recipientName || 'User';
    const appUrl = 'https://changeliberia.org';

    let text = `Hello ${recipientName},\n\n`;

    switch (templateType) {
      case EmailType.WELCOME:
        text += 'Welcome to Change Liberia! We\'re excited to have you join our community.\n\nYou can now create petitions, sign existing ones, and make your voice heard.\n\nVisit: ' + (props?.verifyUrl || appUrl);
        break;

      case EmailType.VERIFY_EMAIL:
        text += `Please verify your email address to complete your registration.\n\nYour verification code is: ${props?.verificationCode || 'XXXXXX'}\n\nThis code expires in 24 hours.`;
        break;

      case EmailType.PASSWORD_RESET:
        text += `We received a request to reset your password.\n\nReset your password: ${props?.resetUrl || appUrl}\n\nThis link expires in ${props?.expiresIn || 60} minutes.`;
        break;

      default:
        text += 'You have received a notification from Change Liberia.\n\nVisit: ' + appUrl;
    }

    text += `\n\n---\nChange Liberia\nBuilding change together\n${appUrl}`;
    return text;
  }

  /**
   * Extract text content from HTML (simple version)
   */
  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }
}

