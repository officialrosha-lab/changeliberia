import { Injectable, Logger } from '@nestjs/common';
import { EmailType } from '@prisma/client';
import {
  EmailTemplateProps,
  WelcomeEmailProps,
  VerifyEmailProps,
  PasswordResetEmailProps,
  PetitionApprovedProps,
  PetitionRejectedProps,
  MilestoneReachedProps,
  WeeklyDigestProps,
  DonationReceivedProps,
  MessageNotificationProps,
  BroadcastNotificationProps,
  OfficialVerifiedProps,
  OfficialRejectedProps,
  ConstituencyReportReadyProps,
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
  renderTemplate(
    templateType: EmailType,
    props: EmailTemplateProps,
  ): RenderedTemplate {
    try {
      const subject = this.getSubjectForType(templateType);
      const html = this.generateHtmlForTemplate(templateType, props);
      const text = this.generateTextForTemplate(templateType, props);

      return { html, text, subject };
    } catch (error) {
      this.logger.error(
        `Failed to render template ${templateType}: ${error instanceof Error ? error.message : String(error)}`,
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
      [EmailType.PETITION_MILESTONE_REACHED]: 'Petition milestone reached!',
      [EmailType.GOVERNMENT_SUBMISSION]: 'Petition submitted to government',
      [EmailType.OFFICIAL_RESPONSE]: 'Government response to your petition',
      [EmailType.WELCOME_TO_MOVEMENT]: 'Welcome to the movement',
      [EmailType.AMBASSADOR_UPDATE]: 'Ambassador update',
      [EmailType.COMMENT_REPLY]: 'You have a new reply',
      [EmailType.SIGNATURE_RECEIVED]: 'Thank you for your signature',
      [EmailType.WEEKLY_DIGEST]: 'Your weekly digest',
      [EmailType.DONATION_RECEIVED]: 'Thank you for your donation',
      [EmailType.POLL_APPROVED]: 'Your poll has been approved',
      [EmailType.POLL_REJECTED]: 'Your poll submission',
      [EmailType.MESSAGE_NOTIFICATION]: 'New message from Change Liberia',
      [EmailType.BROADCAST_NOTIFICATION]: 'Broadcast message delivered',
      [EmailType.OFFICIAL_VERIFIED]: 'Your official account has been verified',
      [EmailType.OFFICIAL_REJECTED]: 'Your official account application',
      [EmailType.CONSTITUENCY_REPORT_READY]:
        'Your constituency report is ready',
    };
    return subjects[templateType] || 'Notification from Change Liberia';
  }

  /**
   * Generate basic HTML for template
   * This is a placeholder that generates valid HTML
   */
  private generateHtmlForTemplate(
    templateType: EmailType,
    props: EmailTemplateProps,
  ): string {
    const recipientName =
      ('recipientName' in props && props.recipientName) || 'User';
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
    let content: string;
    switch (templateType) {
      case EmailType.WELCOME: {
        const p = props as WelcomeEmailProps;
        content = `
          <p>Welcome to Change Liberia! We're excited to have you join our community.</p>
          <p>You can now create petitions, sign existing ones, and make your voice heard.</p>
          <p><a href="${p.verifyUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a></p>
        `;
        break;
      }

      case EmailType.VERIFY_EMAIL: {
        const p = props as VerifyEmailProps;
        content = `
          <p>Please verify your email address to complete your registration.</p>
          ${p.verificationCode ? `<p>Your verification code is: <strong>${p.verificationCode}</strong></p>` : ''}
          <p><a href="${p.verifyUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
          <p style="font-size: 12px; color: #6b7280;">This link expires in 24 hours.</p>
        `;
        break;
      }

      case EmailType.PASSWORD_RESET: {
        const p = props as PasswordResetEmailProps;
        content = `
          <p>We received a request to reset your password.</p>
          <p><a href="${p.resetUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p style="font-size: 12px; color: #6b7280;">This link expires in ${p.expiresIn || 60} minutes.</p>
        `;
        break;
      }

      case EmailType.PASSWORD_RESET_CONFIRMATION:
        content = `
          <p>Your password has been successfully reset.</p>
          <p>You can now log in with your new password.</p>
          <p style="font-size: 12px; color: #6b7280;">If you didn't request this change, please contact us immediately.</p>
        `;
        break;

      case EmailType.PETITION_APPROVED: {
        const p = props as PetitionApprovedProps;
        content = `
          <p>Great news! Your petition <strong>"${p.petitionTitle || 'New Petition'}"</strong> has been approved.</p>
          <p>It is now live and people can sign it to support your cause.</p>
          <p><a href="${p.petitionUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Petition</a></p>
        `;
        break;
      }

      case EmailType.PETITION_REJECTED: {
        const p = props as PetitionRejectedProps;
        content = `
          <p>Your petition submission was reviewed and could not be approved at this time.</p>
          <p><strong>Reason:</strong> ${p.reason || 'Please review our guidelines'}</p>
          <p>You may submit a revised version or contact our support team for more information.</p>
        `;
        break;
      }

      case EmailType.PETITION_MILESTONE_REACHED: {
        const p = props as MilestoneReachedProps;
        content = `
          <p>Congratulations! Your petition <strong>"${p.petitionTitle || 'Petition'}"</strong> has reached a milestone:</p>
          <p style="font-size: 18px; color: #059669; font-weight: bold;">${p.currentSignatures || 0} signatures</p>
          <p><a href="${p.petitionUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Petition</a></p>
        `;
        break;
      }

      case EmailType.WEEKLY_DIGEST: {
        const p = props as WeeklyDigestProps;
        content = `
          <p>Here are this week's trending petitions:</p>
          <ul style="list-style: none; padding: 0;">
            ${
              p.petitions
                ?.map(
                  (petition) => `
              <li style="padding: 10px; background: #f9fafb; margin: 10px 0; border-left: 4px solid #059669;">
                <strong>${petition.title}</strong><br>
                ${petition.signatures} signatures
              </li>
            `,
                )
                .join('') || '<li>No petitions available</li>'
            }
          </ul>
        `;
        break;
      }

      case EmailType.DONATION_RECEIVED: {
        const p = props as DonationReceivedProps;
        content = `
          <p>Thank you for your generous donation of <strong>${p.currency || '$'}${p.amount || 0}</strong>${p.petitionTitle ? ` to <strong>"${p.petitionTitle}"</strong>` : ''}.</p>
          <p>Your contribution makes a real difference in creating change.</p>
          <p style="font-size: 12px; color: #6b7280;"><a href="${p.receiptUrl}" style="color: #059669;">View receipt</a></p>
        `;
        break;
      }

      case EmailType.MESSAGE_NOTIFICATION: {
        const p = props as MessageNotificationProps;
        content = `
          <p><strong>${p.senderName || 'Someone'}</strong> sent you a message.</p>
          <p><strong>Subject:</strong> ${p.subject || 'No subject'}</p>
          <p>${p.messagePreview || 'Open the app to read the full message.'}</p>
          <p><a href="${p.messageUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Message</a></p>
        `;
        break;
      }

      case EmailType.BROADCAST_NOTIFICATION: {
        const p = props as BroadcastNotificationProps;
        content = `
          <p><strong>${p.senderName || 'Admin'}</strong> sent a broadcast to the <strong>${p.groupType || 'stakeholder group'}</strong>.</p>
          <p>Delivered to <strong>${p.recipientCount || 0}</strong> members with <strong>${p.successCount || 0}</strong> successful sends.</p>
          ${p.failedCount ? `<p>${p.failedCount} messages failed to deliver.</p>` : ''}
          <p><a href="${p.broadcastUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Broadcast</a></p>
        `;
        break;
      }

      case EmailType.OFFICIAL_VERIFIED: {
        const p = props as OfficialVerifiedProps;
        content = `
          <p>Congratulations! Your official account for <strong>${p.institutionName || 'your office'}</strong> has been verified.</p>
          <p>You now have access to your official dashboard to view petitions and civic pulse activity in your jurisdiction and respond to constituents.</p>
          <p><a href="${appUrl}/official/dashboard" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a></p>
        `;
        break;
      }

      case EmailType.OFFICIAL_REJECTED: {
        const p = props as OfficialRejectedProps;
        content = `
          <p>Your official account application for <strong>${p.institutionName || 'your office'}</strong> could not be approved at this time.</p>
          ${p.reason ? `<p><strong>Reason:</strong> ${p.reason}</p>` : ''}
          <p>You may submit a revised application or contact our support team for more information.</p>
        `;
        break;
      }

      case EmailType.CONSTITUENCY_REPORT_READY: {
        const p = props as ConstituencyReportReadyProps;
        content = `
          <p>Your ${p.period?.toLowerCase() || 'constituency'} report for <strong>${p.institutionName || 'your office'}</strong> is ready.</p>
          <p>Covering <strong>${p.periodStart} – ${p.periodEnd}</strong>: petitions, signatures, and issue trends for your constituency.</p>
          <p><a href="${p.reportUrl || appUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Report</a></p>
        `;
        break;
      }

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
    props: EmailTemplateProps,
  ): string {
    const recipientName =
      ('recipientName' in props && props.recipientName) || 'User';
    const appUrl = 'https://changeliberia.org';

    let text = `Hello ${recipientName},\n\n`;

    switch (templateType) {
      case EmailType.WELCOME: {
        const p = props as WelcomeEmailProps;
        text +=
          "Welcome to Change Liberia! We're excited to have you join our community.\n\nYou can now create petitions, sign existing ones, and make your voice heard.\n\nVisit: " +
          (p.verifyUrl || appUrl);
        break;
      }

      case EmailType.VERIFY_EMAIL: {
        const p = props as VerifyEmailProps;
        text += `Please verify your email address to complete your registration.\n\n${p.verificationCode ? `Your verification code is: ${p.verificationCode}\n\n` : ''}Verify your email: ${p.verifyUrl || appUrl}\n\nThis link expires in 24 hours.`;
        break;
      }

      case EmailType.PASSWORD_RESET: {
        const p = props as PasswordResetEmailProps;
        text += `We received a request to reset your password.\n\nReset your password: ${p.resetUrl || appUrl}\n\nThis link expires in ${p.expiresIn || 60} minutes.`;
        break;
      }

      case EmailType.MESSAGE_NOTIFICATION: {
        const p = props as MessageNotificationProps;
        text += `You have a new message from ${p.senderName || 'someone'}.

Subject: ${p.subject || 'No subject'}

${p.messagePreview || 'Open the app to read the full message.'}

View message: ${p.messageUrl || appUrl}`;
        break;
      }

      case EmailType.BROADCAST_NOTIFICATION: {
        const p = props as BroadcastNotificationProps;
        text += `${p.senderName || 'An admin'} sent a broadcast to ${p.groupType || 'a stakeholder group'}.

Delivered to ${p.recipientCount || 0} members with ${p.successCount || 0} successful messages.`;
        if (p.failedCount) {
          text += `\nFailed deliveries: ${p.failedCount}`;
        }
        text += `\n\nView broadcast: ${p.broadcastUrl || appUrl}`;
        break;
      }

      default:
        text +=
          'You have received a notification from Change Liberia.\n\nVisit: ' +
          appUrl;
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
