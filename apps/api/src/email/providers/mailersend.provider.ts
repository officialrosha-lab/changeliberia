import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MailerSendEmailResponse {
  id: string;
  from?: string;
  created_at?: string;
}

/**
 * MailerSend transactional email API — https://developers.mailersend.com/api/v1/email.html
 * Same shape as the ResendProvider it replaces, so EmailService/EmailController
 * don't need to know which provider is behind them.
 */
@Injectable()
export class MailerSendProvider {
  private readonly logger = new Logger(MailerSendProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.mailersend.com/v1';
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 4000]; // ms

  constructor() {
    this.apiKey = process.env.MAILERSEND_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('MAILERSEND_API_KEY not set. Email sending will fail.');
    }
  }

  /**
   * Send email via MailerSend API with retry logic
   */
  async send(options: SendEmailOptions): Promise<MailerSendEmailResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.sendRequest(options);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Email send attempt ${attempt + 1}/${this.maxRetries} failed: ${lastError.message}`,
        );

        // Don't retry on 4xx client errors
        if (
          error instanceof Error &&
          error.message.includes('4')
        ) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelays[attempt]);
        }
      }
    }

    throw lastError || new Error('Failed to send email after max retries');
  }

  /**
   * Send batch emails via MailerSend API
   */
  async sendBatch(emails: SendEmailOptions[]): Promise<MailerSendEmailResponse[]> {
    const results: MailerSendEmailResponse[] = [];

    for (const email of emails) {
      try {
        const result = await this.send(email);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to send batch email to ${email.to}: ${error}`,
        );
        results.push({ id: `failed-${uuid()}` });
      }
    }

    return results;
  }

  /**
   * Look up a domain's DKIM/SPF verification status.
   * MailerSend addresses domains by internal id, not name, so this first
   * resolves the id via a search, then reads the domain's own status.
   */
  async verifyDomain(domain: string): Promise<{
    domain: string;
    status: 'verified' | 'unverified';
    dkim_status?: string;
    spf_status?: string;
    dmarc_status?: string;
  }> {
    try {
      const searchRes = await fetch(
        `${this.baseUrl}/domains?search=${encodeURIComponent(domain)}`,
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      );
      if (!searchRes.ok) {
        throw new Error(`Domain lookup failed: ${searchRes.statusText}`);
      }
      const searchData = await searchRes.json();
      const match = (searchData.data || []).find((d: any) => d.name === domain);
      if (!match) {
        return { domain, status: 'unverified' };
      }

      const detailRes = await fetch(`${this.baseUrl}/domains/${match.id}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!detailRes.ok) {
        throw new Error(`Domain detail fetch failed: ${detailRes.statusText}`);
      }
      const detail = (await detailRes.json()).data ?? {};

      return {
        domain,
        status: detail.domain_settings?.spf_verified && detail.domain_settings?.dkim_verified
          ? 'verified'
          : 'unverified',
        dkim_status: detail.domain_settings?.dkim_verified ? 'verified' : 'unverified',
        spf_status: detail.domain_settings?.spf_verified ? 'verified' : 'unverified',
        dmarc_status: detail.domain_settings?.dmarc_verified ? 'verified' : 'unverified',
      };
    } catch (error) {
      this.logger.error(`Failed to verify domain ${domain}: ${error}`);
      throw error;
    }
  }

  /**
   * Check MailerSend API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`MailerSend health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Private: Send actual MailerSend API request
   */
  private async sendRequest(
    options: SendEmailOptions,
  ): Promise<MailerSendEmailResponse> {
    const mailFrom = options.from || process.env.MAIL_FROM || 'noreply@changeliberia.org';
    const replyTo = options.replyTo || process.env.MAIL_REPLY_TO || 'support@changeliberia.org';

    const payload: any = {
      from: { email: mailFrom },
      to: [{ email: options.to }],
      subject: options.subject,
      html: options.html,
    };

    if (options.text) {
      payload.text = options.text;
    }

    if (replyTo) {
      payload.reply_to = { email: replyTo };
    }

    if (options.tags && options.tags.length > 0) {
      // MailerSend tags are flat strings, same as Resend's.
      payload.tags = options.tags;
    }

    if (options.headers) {
      payload.headers = Object.entries(options.headers).map(([name, value]) => ({
        name,
        value,
      }));
    }

    const response = await fetch(`${this.baseUrl}/email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let error: any;
      try {
        error = await response.json();
      } catch {
        error = { message: response.statusText };
      }
      throw new Error(
        `MailerSend API error (${response.status}): ${error.message || JSON.stringify(error)}`,
      );
    }

    // MailerSend's /email endpoint responds 202 Accepted with an empty body;
    // the message id comes back in the X-Message-Id response header.
    const messageId = response.headers.get('x-message-id') || uuid();
    return { id: messageId, from: mailFrom, created_at: new Date().toISOString() };
  }

  /**
   * Private: Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
