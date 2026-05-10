import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/render';
import {
  getEmailTemplate,
  EmailTemplateProps,
} from '../templates/index';
import { EmailType } from '@prisma/client';

export interface RenderedTemplate {
  html: string;
  text: string;
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  /**
   * Render a template to HTML and text
   */
  async renderTemplate(
    templateType: EmailType,
    props: EmailTemplateProps[EmailType],
  ): Promise<RenderedTemplate> {
    try {
      const template = getEmailTemplate(templateType as keyof EmailTemplateProps);
      
      // Render to HTML
      const html = render(template(props) as React.ReactElement);
      
      // For text version, we'll use a simplified extraction
      const text = this.extractTextFromHtml(html);

      return { html, text };
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
  getSubjectForType(templateType: EmailType, context?: Record<string, any>): string {
    const subjects: Record<EmailType, (ctx?: Record<string, any>) => string> = {
      [EmailType.WELCOME]: () => 'Welcome to Change Liberia!',
      [EmailType.VERIFY_EMAIL]: () => 'Verify your email address',
      [EmailType.PASSWORD_RESET]: () => 'Reset your password',
      [EmailType.PASSWORD_RESET_CONFIRMATION]: () => 'Your password has been reset',
      [EmailType.PETITION_APPROVED]: (ctx) =>
        `Your petition "${ctx?.petitionTitle || 'Your Petition'}" has been approved!`,
      [EmailType.PETITION_REJECTED]: (ctx) =>
        `Your petition "${ctx?.petitionTitle || 'Your Petition'}" was not approved`,
      [EmailType.PETITION_MILESTONE_REACHED]: (ctx) =>
        `Your petition reached ${ctx?.milestoneValue || 'a milestone'}!`,
      [EmailType.GOVERNMENT_SUBMISSION]: (ctx) =>
        `Your petition has been submitted to government (${ctx?.signatureCount || '1,000'}+ signatures)`,
      [EmailType.OFFICIAL_RESPONSE]: (ctx) =>
        `Government response: "${ctx?.responseTitle || 'Your Petition'}"`,
      [EmailType.WELCOME_TO_MOVEMENT]: () => 'Welcome to the movement!',
      [EmailType.WEEKLY_DIGEST]: (ctx) =>
        `Your weekly digest - ${ctx?.digestDate || new Date().toLocaleDateString()}`,
      [EmailType.AMBASSADOR_UPDATE]: (ctx) =>
        `Ambassador Update: ${ctx?.updateTitle || 'Campaign Update'}`,
      [EmailType.DONATION_RECEIVED]: (ctx) =>
        `Thank you for your donation to ${ctx?.petitionTitle || 'Change Liberia'}`,
      [EmailType.COMMENT_REPLY]: (ctx) =>
        `New reply to your comment on "${ctx?.petitionTitle || 'a petition'}"`,
      [EmailType.SIGNATURE_RECEIVED]: (ctx) =>
        `New signature from ${ctx?.signerName || 'someone'} on your petition`,
    };

    const subjectFn = subjects[templateType];
    if (!subjectFn) {
      return 'Message from Change Liberia';
    }

    return subjectFn(context);
  }

  /**
   * Extract plain text from HTML
   * This is a simple implementation; for complex HTML, use html-to-text library
   */
  private extractTextFromHtml(html: string): string {
    return (
      html
        // Remove script and style tags
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        // Remove multiple spaces
        .replace(/ +/g, ' ')
        // Remove multiple line breaks
        .replace(/\n\n+/g, '\n\n')
        .trim()
    );
  }
}
