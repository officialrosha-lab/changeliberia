import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: ReturnType<typeof twilio> | null;
  private readonly from: string;
  // Set TWILIO_CONSOLE_FALLBACK=true in Railway/env to log OTPs to console
  // instead of failing when Twilio can't deliver (trial account, unverified
  // destination number, geographic restriction, etc.)
  private readonly consoleFallback: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_PHONE_NUMBER ?? '';
    this.consoleFallback = process.env.TWILIO_CONSOLE_FALLBACK === 'true';

    if (accountSid && authToken && this.from) {
      this.client = twilio(accountSid, authToken);
      this.logger.log('Twilio SMS client initialised');
    } else {
      this.client = null;
      this.logger.warn('Twilio env vars not set — SMS will be logged to console only');
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`[SMS CONSOLE] To: ${to} | ${body}`);
      return;
    }

    try {
      await this.client.messages.create({ from: this.from, to, body });
      this.logger.log(`[SMS] Delivered to ${to}`);
    } catch (err: unknown) {
      // Log every field Twilio provides so the error is visible in Railway logs
      const e = err as { code?: number; status?: number; message?: string; moreInfo?: string };
      this.logger.error(
        `[SMS] Twilio delivery failed → to=${to} code=${e.code ?? '?'} status=${e.status ?? '?'} message="${e.message ?? ''}" moreInfo=${e.moreInfo ?? ''}`,
      );

      // If fallback mode is on, log the OTP to console and continue normally.
      // This lets the platform work when Twilio is a trial account or the
      // destination number hasn't been verified in Twilio's portal yet.
      if (this.consoleFallback) {
        this.logger.warn(`[SMS FALLBACK] To: ${to} | ${body}`);
        return;
      }

      throw err;
    }
  }
}
