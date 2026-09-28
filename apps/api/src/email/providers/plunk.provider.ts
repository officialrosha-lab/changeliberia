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

export interface PlunkEmailResponse {
  id: string;
  from?: string;
  created_at?: string;
}

interface PlunkSendResponseBody {
  data?: {
    emails?: { email?: string; contact?: { id?: string; email?: string } }[];
    timestamp?: string;
  };
}

interface PlunkDomainRecord {
  domain?: string;
  name?: string;
  verified?: boolean;
  status?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Plunk transactional email API — https://docs.useplunk.com/api-reference/public-api/sendEmail
 * Same shape as the MailerSendProvider it replaces, so EmailService/EmailController
 * don't need to know which provider is behind them.
 *
 * Plunk's `/v1/send` has no `text` (plain-text) field — only `body` (HTML) or
 * a `template` id — and no `tags` field, so `options.text`/`options.tags` are
 * accepted for interface compatibility but not sent.
 */
@Injectable()
export class PlunkProvider {
  private readonly logger = new Logger(PlunkProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.useplunk.com/v1';
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 4000]; // ms

  constructor() {
    this.apiKey = process.env.PLUNK_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('PLUNK_API_KEY not set. Email sending will fail.');
    }
  }

  /**
   * Send email via Plunk's API with retry logic
   */
  async send(options: SendEmailOptions): Promise<PlunkEmailResponse> {
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
        if (error instanceof Error && error.message.includes('4')) {
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
   * Send batch emails via Plunk's API
   */
  async sendBatch(emails: SendEmailOptions[]): Promise<PlunkEmailResponse[]> {
    const results: PlunkEmailResponse[] = [];

    for (const email of emails) {
      try {
        const result = await this.send(email);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to send batch email to ${email.to}: ${errorMessage(error)}`,
        );
        results.push({ id: `failed-${uuid()}` });
      }
    }

    return results;
  }

  /**
   * Look up a domain's verification status.
   * Plunk addresses domains by internal id + project id rather than by
   * name, and the exact domain-object field names weren't confirmed against
   * a live account — this is best-effort. If `d.domain`/`d.verified` below
   * don't match your project's actual response shape, adjust them to fit
   * (dashboard > project settings > Domains shows the same data).
   */
  async verifyDomain(domain: string): Promise<{
    domain: string;
    status: 'verified' | 'unverified';
  }> {
    const projectId = process.env.PLUNK_PROJECT_ID || '';
    if (!projectId) {
      throw new Error(
        'PLUNK_PROJECT_ID not set; cannot look up domains for this project.',
      );
    }

    try {
      const res = await fetch(
        `https://api.useplunk.com/domains/project/${projectId}`,
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      );
      if (!res.ok) {
        throw new Error(`Domain lookup failed: ${res.statusText}`);
      }
      const body: PlunkDomainRecord[] | { data?: PlunkDomainRecord[] } =
        await res.json();
      const domains: PlunkDomainRecord[] = Array.isArray(body)
        ? body
        : (body.data ?? []);
      const match = domains.find(
        (d) => d.domain === domain || d.name === domain,
      );
      if (!match) {
        return { domain, status: 'unverified' };
      }

      return {
        domain,
        status:
          match.verified || match.status === 'verified'
            ? 'verified'
            : 'unverified',
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify domain ${domain}: ${errorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Check Plunk API connectivity.
   * Plunk has no dedicated health endpoint, so this hits `/v1/verify` (email
   * address validation) with a throwaway address — a real authenticated
   * call that never sends mail.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'healthcheck@changeliberia.org' }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`Plunk health check failed: ${errorMessage(error)}`);
      return false;
    }
  }

  /**
   * Private: Send actual Plunk API request
   */
  private async sendRequest(
    options: SendEmailOptions,
  ): Promise<PlunkEmailResponse> {
    const mailFrom =
      options.from || process.env.MAIL_FROM || 'noreply@changeliberia.org';
    const replyTo =
      options.replyTo ||
      process.env.MAIL_REPLY_TO ||
      'support@changeliberia.org';

    const payload: {
      to: string;
      from: string;
      subject: string;
      body: string;
      reply?: string;
      headers?: Record<string, string>;
    } = {
      to: options.to,
      from: mailFrom,
      subject: options.subject,
      body: options.html,
    };

    if (replyTo) {
      payload.reply = replyTo;
    }

    if (options.headers) {
      payload.headers = options.headers;
    }

    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const error: { message?: string } = await response.json();
        message = error.message || JSON.stringify(error);
      } catch {
        // response body wasn't JSON — fall back to statusText above
      }
      throw new Error(`Plunk API error (${response.status}): ${message}`);
    }

    const result: PlunkSendResponseBody = await response.json();
    // The `email` field on the returned record is Plunk's message id — the
    // same id webhook events report back under `event.emailId`.
    const messageId = result.data?.emails?.[0]?.email || uuid();

    return {
      id: messageId,
      from: mailFrom,
      created_at: result.data?.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Private: Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
