import { BadRequestException, Controller, Header, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { SignaturesService } from '../signatures/signatures.service';

/**
 * Offline petition collection: inbound SMS signing. Configure this URL
 * (`/sms/inbound`) as the "A message comes in" webhook on the Twilio phone
 * number already used for OTP. Expected message format: "SIGN <code>",
 * where <code> is a petition's share-link shortCode (see
 * PetitionsService.getOrCreateShareLink / GET /petitions/:id/share-link).
 */
@Controller('sms')
export class SmsInboundController {
  private readonly logger = new Logger(SmsInboundController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signaturesService: SignaturesService,
  ) {}

  private isValidTwilioRequest(req: Request): boolean {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'TWILIO_AUTH_TOKEN not set in production — rejecting inbound SMS (cannot verify sender)',
        );
        return false;
      }
      this.logger.warn('TWILIO_AUTH_TOKEN not set — skipping inbound signature validation (dev mode only)');
      return true;
    }

    const signature = req.headers['x-twilio-signature'];
    if (!signature || typeof signature !== 'string') return false;

    const proto = (req.headers['x-forwarded-proto'] as string) ?? req.protocol;
    const host = (req.headers['x-forwarded-host'] as string) ?? req.get('host');
    const url = `${proto}://${host}${req.originalUrl}`;

    return twilio.validateRequest(authToken, signature, url, req.body ?? {});
  }

  @Post('inbound')
  @Header('Content-Type', 'text/xml')
  async inbound(@Req() req: Request): Promise<string> {
    if (!this.isValidTwilioRequest(req)) {
      throw new BadRequestException('Invalid Twilio request signature');
    }

    const from = String(req.body?.From ?? '').trim();
    const body = String(req.body?.Body ?? '').trim();

    const match = body.match(/^sign\s+([a-z0-9]{4,12})$/i);
    if (!from || !match) {
      return this.twiml(
        'To sign a petition by text, send "SIGN <code>" using the code from a petition\'s share link.',
      );
    }

    const shortCode = match[1].toLowerCase();
    const shareLink = await this.prisma.shareLink.findUnique({ where: { shortCode } });
    if (!shareLink) {
      return this.twiml(`We couldn't find a petition for code "${shortCode}". Please check the code and try again.`);
    }

    const result = await this.signaturesService.createFromSms(from, shareLink.petitionId);
    return this.twiml(result.message);
  }

  private twiml(message: string): string {
    const escaped = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
  }
}
