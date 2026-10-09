import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerooProvider } from '../email/providers/maileroo.provider';
import { escapeHtml } from '../common/utils/escape-html';

@Injectable()
export class SupportersService implements OnModuleInit {
  private cachedCount = 0;
  private readonly logger = new Logger(SupportersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerooProvider: MailerooProvider,
  ) {}

  async onModuleInit() {
    try {
      this.cachedCount = await this.prisma.supporter.count();
      this.logger.log(`Initialized supporter count: ${this.cachedCount}`);
    } catch (error) {
      this.logger.error(
        'Failed to initialize supporter count from database:',
        error,
      );
      // Start with 0 if database is unavailable during startup
      this.cachedCount = 0;
    }
  }

  async getCount() {
    try {
      // Periodically sync with database to ensure accuracy
      // This prevents cache drift if there are multiple API instances
      const dbCount = await this.prisma.supporter.count();
      if (dbCount !== this.cachedCount) {
        this.logger.warn(
          `Supporter count mismatch: cached=${this.cachedCount}, db=${dbCount}. Syncing...`,
        );
        this.cachedCount = dbCount;
      }
      return { count: this.cachedCount };
    } catch (error) {
      this.logger.error('Error fetching supporter count:', error);
      // Return cached value if database query fails
      return { count: this.cachedCount };
    }
  }

  async join(
    sessionId: string,
    ipAddress: string,
    userId?: string,
    source = 'navbar',
  ) {
    try {
      // Layer 1: sessionId deduplication (fast — unique index)
      const bySession = await this.prisma.supporter.findUnique({
        where: { sessionId },
      });
      if (bySession) {
        this.logger.debug(`Duplicate join attempt by sessionId: ${sessionId}`);
        return { count: this.cachedCount, alreadyJoined: true };
      }

      // Layer 2: IP deduplication — prevents re-join after clearing localStorage,
      // incognito windows, or different browsers on the same device/network.
      if (ipAddress && ipAddress !== 'unknown') {
        const byIp = await this.prisma.supporter.findFirst({
          where: { ipAddress },
        });
        if (byIp) {
          this.logger.debug(`Duplicate join attempt by IP: ${ipAddress}`);
          return { count: this.cachedCount, alreadyJoined: true };
        }
      }

      await this.prisma.supporter.create({
        data: { sessionId, userId: userId ?? null, source, ipAddress },
      });
      this.cachedCount++;
      this.logger.log(
        `New supporter joined via ${source}. Total count: ${this.cachedCount}`,
      );
      return { count: this.cachedCount, alreadyJoined: false };
    } catch (error) {
      this.logger.error('Error creating supporter record:', error);
      throw error;
    }
  }

  async updateContact(sessionId: string, email?: string, phone?: string) {
    try {
      const supporter = await this.prisma.supporter.findUnique({
        where: { sessionId },
      });
      if (!supporter) {
        this.logger.warn(`Supporter not found for sessionId: ${sessionId}`);
        return null;
      }
      return this.prisma.supporter.update({
        where: { sessionId },
        data: {
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        },
      });
    } catch (error) {
      this.logger.error('Error updating supporter contact:', error);
      throw error;
    }
  }

  /** Admin: paginated, searchable list of supporters for outreach management. */
  async listForAdmin(opts: { search?: string; skip?: number; take?: number }) {
    const skip = opts.skip ?? 0;
    const take = Math.min(opts.take ?? 50, 200);
    const where = opts.search
      ? {
          OR: [
            { email: { contains: opts.search, mode: 'insensitive' as const } },
            { phone: { contains: opts.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [supporters, total] = await Promise.all([
      this.prisma.supporter.findMany({
        where,
        orderBy: { joinedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.supporter.count({ where }),
    ]);

    return { supporters, total };
  }

  /** Admin: counts for the supporters dashboard (total, contactable, unsubscribed). */
  async getStats() {
    const [total, withEmail, withPhone, unsubscribed] = await Promise.all([
      this.prisma.supporter.count(),
      this.prisma.supporter.count({ where: { email: { not: null } } }),
      this.prisma.supporter.count({ where: { phone: { not: null } } }),
      this.prisma.supporter.count({ where: { unsubscribed: true } }),
    ]);
    return { total, withEmail, withPhone, unsubscribed };
  }

  /** Public: opts a supporter out of future outreach emails via their emailed unsubscribe link. */
  async unsubscribeByToken(id: string, token: string): Promise<boolean> {
    const supporter = await this.prisma.supporter.findUnique({
      where: { id },
    });
    if (!supporter || supporter.unsubscribeToken !== token) return false;

    await this.prisma.supporter.update({
      where: { id },
      data: { unsubscribed: true },
    });
    return true;
  }

  /**
   * Admin: sends a one-off update to every supporter who left an email and
   * hasn't unsubscribed. Sends one at a time (rather than Promise.all) so a
   * failure on one address never blocks the rest, and so Maileroo never
   * sees a burst of simultaneous requests from a single broadcast.
   */
  async broadcast(
    subject: string,
    message: string,
  ): Promise<{
    recipientCount: number;
    successCount: number;
    failedCount: number;
  }> {
    const recipients = await this.prisma.supporter.findMany({
      where: { email: { not: null }, unsubscribed: false },
      select: { id: true, email: true, unsubscribeToken: true },
    });

    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      if (!recipient.email) continue;
      try {
        const html = this.buildOutreachHtml(
          message,
          recipient.id,
          recipient.unsubscribeToken,
        );
        await this.mailerooProvider.send({
          to: recipient.email,
          from: process.env.MAIL_FROM || 'noreply@changeliberia.org',
          replyTo: process.env.MAIL_REPLY_TO || 'support@changeliberia.org',
          subject,
          html,
          text: message,
        });
        successCount++;
      } catch (error) {
        failedCount++;
        this.logger.error(
          `Failed to send outreach email to ${recipient.email}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Supporter outreach sent: ${successCount}/${recipients.length} (${failedCount} failed)`,
    );
    return { recipientCount: recipients.length, successCount, failedCount };
  }

  private buildOutreachHtml(
    message: string,
    supporterId: string,
    unsubscribeToken: string,
  ): string {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://changeliberia.org';
    const apiUrl =
      process.env.API_PUBLIC_URL ||
      'https://api-production-8873.up.railway.app/api/v1';
    const unsubscribeUrl = `${apiUrl}/supporters/unsubscribe/${supporterId}/${unsubscribeToken}`;
    const paragraphs = message
      .split(/\n{2,}/)
      .map(
        (p) =>
          `<p style="margin: 0 0 16px 0;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`,
      )
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Change Liberia</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Building change together</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          ${paragraphs}
        </div>
        <div style="padding: 20px 10px 0; font-size: 12px; color: #6b7280; text-align: center;">
          <p>© 2026 Change Liberia. All rights reserved.</p>
          <p>
            <a href="${appUrl}" style="color: #059669; text-decoration: none;">Visit our website</a>
            &nbsp;·&nbsp;
            <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;
  }
}
