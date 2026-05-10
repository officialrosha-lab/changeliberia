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

export interface ResendEmailResponse {
  id: string;
  from?: string;
  created_at?: string;
}

@Injectable()
export class ResendProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.resend.com';
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 4000]; // ms

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY not set. Email sending will fail.');
    }
  }

  /**
   * Send email via Resend API with retry logic
   */
  async send(options: SendEmailOptions): Promise<ResendEmailResponse> {
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
   * Send batch emails via Resend API
   */
  async sendBatch(emails: SendEmailOptions[]): Promise<ResendEmailResponse[]> {
    const results: ResendEmailResponse[] = [];

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
   * Verify domain DKIM/SPF/DMARC status
   */
  async verifyDomain(domain: string): Promise<{
    domain: string;
    status: 'verified' | 'unverified';
    dkim_status?: string;
    spf_status?: string;
    dmarc_status?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/domains/${domain}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Domain verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        domain,
        status: data.status || 'unverified',
        dkim_status: data.dkim?.status,
        spf_status: data.spf?.status,
        dmarc_status: data.dmarc?.status,
      };
    } catch (error) {
      this.logger.error(`Failed to verify domain ${domain}: ${error}`);
      throw error;
    }
  }

  /**
   * Check Resend API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/audiences`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`Resend health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Private: Send actual Resend API request
   */
  private async sendRequest(
    options: SendEmailOptions,
  ): Promise<ResendEmailResponse> {
    const mailFrom = options.from || process.env.MAIL_FROM || 'noreply@changeliberia.org';
    const replyTo = options.replyTo || process.env.MAIL_REPLY_TO || 'support@changeliberia.org';

    const payload: any = {
      from: mailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    if (options.text) {
      payload.text = options.text;
    }

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    if (options.tags && options.tags.length > 0) {
      payload.tags = options.tags;
    }

    if (options.headers) {
      payload.headers = options.headers;
    }

    const response = await fetch(`${this.baseUrl}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Resend API error (${response.status}): ${error.message || JSON.stringify(error)}`,
      );
    }

    return response.json();
  }

  /**
   * Private: Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
