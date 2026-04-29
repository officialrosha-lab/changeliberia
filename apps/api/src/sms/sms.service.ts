import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: ReturnType<typeof twilio> | null;
  private readonly from: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_PHONE_NUMBER ?? '';

    if (accountSid && authToken && this.from) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.client = null;
      this.logger.warn('Twilio env vars not set — SMS will be logged to console only');
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`[SMS] To: ${to} | Body: ${body}`);
      return;
    }
    await this.client.messages.create({ from: this.from, to, body });
  }
}
