import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';

/** Maileroo requires reference_id to be a 24-character hex string (12 random bytes). */
function generateReferenceId(): string {
  return randomBytes(12).toString('hex');
}

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

export interface MailerooEmailResponse {
  id: string;
  from?: string;
  created_at?: string;
}

interface MailerooSendResponseBody {
  success?: boolean;
  message?: string;
  data?: {
    reference_id?: string;
  };
}

interface MailerooDomainRecord {
  domain?: string;
  name?: string;
  verified?: boolean;
  status?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Maileroo transactional email API — https://maileroo.com/docs/email-api/send-basic-email/
 * Same shape as the PlunkProvider it replaces, so EmailService/EmailController
 * don't need to know which provider is behind them.
 *
 * We generate our own `reference_id` (a 24-char hex string — the format
 * Maileroo's API requires) and send it on every request instead of relying
 * on Maileroo's auto-generated one or parsing its
 * response body (whose exact envelope wasn't confirmed against a live
 * account) — this id is what MailerooWebhookController later gets back
 * as `message_reference_id` on delivery/bounce/open/click events, so it's
 * the one thing we need to be sure of.
 */
@Injectable()
export class MailerooProvider {
  private readonly logger = new Logger(MailerooProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://smtp.maileroo.com/api/v2';
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 4000]; // ms

  constructor() {
    this.apiKey = process.env.MAILEROO_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('MAILEROO_API_KEY not set. Email sending will fail.');
    }
  }

  /**
   * Send email via Maileroo's API with retry logic
   */
  async send(options: SendEmailOptions): Promise<MailerooEmailResponse> {
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
   * Send batch emails via Maileroo's API
   */
  async sendBatch(
    emails: SendEmailOptions[],
  ): Promise<MailerooEmailResponse[]> {
    const results: MailerooEmailResponse[] = [];

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
   * Look up a domain's verification status via Maileroo's domains list.
   * The exact response field names weren't confirmed against a live
   * account — this is best-effort. If `d.domain`/`d.verified` below don't
   * match your account's actual response shape, adjust them to fit
   * (dashboard > Domains shows the same data).
   */
  async verifyDomain(domain: string): Promise<{
    domain: string;
    status: 'verified' | 'unverified';
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/domains`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) {
        throw new Error(`Domain lookup failed: ${res.statusText}`);
      }
      const body = (await res.json()) as
        | MailerooDomainRecord[]
        | { data?: MailerooDomainRecord[] };
      const domains: MailerooDomainRecord[] = Array.isArray(body)
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
   * Check Maileroo API connectivity.
   * Maileroo has no dedicated health endpoint, so this hits the
   * authenticated `/domains` list — a real call that never sends mail.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch (error) {
      this.logger.error(`Maileroo health check failed: ${errorMessage(error)}`);
      return false;
    }
  }

  /**
   * Private: Send actual Maileroo API request
   */
  private async sendRequest(
    options: SendEmailOptions,
  ): Promise<MailerooEmailResponse> {
    const mailFrom =
      options.from || process.env.MAIL_FROM || 'noreply@changeliberia.org';
    const replyTo =
      options.replyTo ||
      process.env.MAIL_REPLY_TO ||
      'support@changeliberia.org';
    const referenceId = generateReferenceId();

    const payload: {
      from: { address: string };
      to: { address: string }[];
      reply_to?: { address: string };
      subject: string;
      html: string;
      plain?: string;
      headers?: Record<string, string>;
      reference_id: string;
    } = {
      from: { address: mailFrom },
      to: [{ address: options.to }],
      subject: options.subject,
      html: options.html,
      reference_id: referenceId,
    };

    if (replyTo) {
      payload.reply_to = { address: replyTo };
    }

    if (options.text) {
      payload.plain = options.text;
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
      let message = response.statusText;
      try {
        const error = (await response.json()) as { message?: string };
        message = error.message || JSON.stringify(error);
      } catch {
        // response body wasn't JSON — fall back to statusText above
      }
      throw new Error(`Maileroo API error (${response.status}): ${message}`);
    }

    let result: MailerooSendResponseBody = {};
    try {
      result = (await response.json()) as MailerooSendResponseBody;
    } catch {
      // some successful responses may have an empty body — the
      // reference_id we generated above is authoritative either way
    }

    return {
      id: result.data?.reference_id || referenceId,
      from: mailFrom,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Private: Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
