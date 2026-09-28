import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { createClient } from 'redis';
import { EmailService } from '../services/email.service';
import {
  EmailPreferenceService,
  EmailPreferenceDTO,
} from '../services/email-preference.service';
import { EmailTrackingService } from '../services/email-tracking.service';
import { MailerooProvider } from '../providers/maileroo.provider';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permission } from '../../rbac/decorators/permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionResource, PermissionAction } from '@prisma/client';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly preferenceService: EmailPreferenceService,
    private readonly trackingService: EmailTrackingService,
    private readonly mailerooProvider: MailerooProvider,
  ) {}

  /**
   * Track email open (pixel)
   * GET /api/v1/email/track/open/:emailLogId/:pixelId
   */
  @Get('track/open/:emailLogId/:pixelId')
  async trackOpen(
    @Param('emailLogId') emailLogId: string,
    @Param('pixelId') pixelId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Record the open event
      await this.trackingService.recordOpen(emailLogId);

      // Return a 1x1 transparent GIF pixel
      const pixel = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
        0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a,
        0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
      ]);

      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Length', pixel.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.end(pixel);
    } catch (error) {
      this.logger.error(
        `Error tracking open: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Still return pixel even on error
      const pixel = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
        0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a,
        0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
      ]);
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Length', pixel.length);
      res.end(pixel);
    }
  }

  /**
   * Track email click
   * GET /api/v1/email/track/click/:emailLogId/:linkId
   */
  @Get('track/click/:emailLogId/:linkId')
  async trackClick(
    @Param('emailLogId') emailLogId: string,
    @Param('linkId') linkId: string,
    @Query('redirect') redirect: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Record the click event
      await this.trackingService.recordClick(emailLogId, linkId);

      if (redirect) {
        // Decode and redirect
        const url = Buffer.from(redirect, 'base64').toString('utf-8');
        return res.redirect(url);
      }

      res.json({ ok: true });
    } catch (error) {
      this.logger.error(
        `Error tracking click: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (redirect) {
        const url = Buffer.from(redirect, 'base64').toString('utf-8');
        return res.redirect(url);
      }
      res.status(500).json({ error: 'Tracking failed' });
    }
  }

  /**
   * Unsubscribe from emails
   * GET /api/v1/email/unsubscribe/:userId/:token
   */
  @Get('unsubscribe/:userId/:token')
  async unsubscribe(
    @Param('userId') userId: string,
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Verify token (compare with stored unsubscribeToken)
      const prefs = await this.preferenceService.getPreferences(userId);

      if (!prefs || prefs.unsubscribeToken !== token) {
        res.status(401).json({ error: 'Invalid unsubscribe token' });
        return;
      }

      // Unsubscribe
      await this.preferenceService.unsubscribeUser(userId);

      res.json({
        success: true,
        message: 'You have been unsubscribed from all emails',
      });
    } catch (error) {
      // A bad/stale/tampered userId or token reaches here as a Prisma
      // lookup failure (e.g. a foreign-key violation on preference
      // auto-creation for a nonexistent user) — that's an invalid link,
      // not a server error, so it's a 404 rather than a 500.
      this.logger.warn(
        `Invalid unsubscribe link for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      res.status(404).json({ error: 'Invalid or expired unsubscribe link' });
    }
  }

  /**
   * Get user email preferences
   * GET /api/v1/email/preferences
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Req() req: any): Promise<any> {
    const userId = req.user.userId;
    const prefs = await this.preferenceService.getPreferences(userId);

    return {
      emailEnabled: prefs?.emailEnabled ?? true,
      digestFrequency: prefs?.digestFrequency ?? 'weekly',
      emailCategories: prefs?.emailCategories
        ? JSON.parse(prefs.emailCategories)
        : [],
      preferredSendTime: prefs?.preferredSendTime ?? '09:00',
    };
  }

  /**
   * Update user email preferences
   * PATCH /api/v1/email/preferences
   */
  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Req() req: any,
    @Body() updates: EmailPreferenceDTO,
  ): Promise<any> {
    const userId = req.user.userId;
    const prefs = await this.preferenceService.updatePreferences(
      userId,
      updates,
    );

    return {
      emailEnabled: prefs.emailEnabled,
      digestFrequency: prefs.digestFrequency,
      emailCategories: prefs.emailCategories
        ? JSON.parse(prefs.emailCategories)
        : [],
      preferredSendTime: prefs.preferredSendTime,
    };
  }

  /**
   * Get user email logs
   * GET /api/v1/email/logs
   */
  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getEmailLogs(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<any> {
    const userId = req.user.userId;
    const { emails, total } = await this.emailService.listUserEmails(
      userId,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );

    return {
      emails: emails.map((e) => ({
        id: e.id,
        type: e.type,
        subject: e.subject,
        recipient: e.recipient,
        status: e.status,
        sentAt: e.sentAt,
        openedAt: e.openedAt,
        clickedAt: e.clickedAt,
        createdAt: e.createdAt,
      })),
      total,
      limit: parseInt(limit || '50'),
      offset: parseInt(offset || '0'),
    };
  }
}

@Controller('admin/email')
export class AdminEmailController {
  private readonly logger = new Logger(AdminEmailController.name);

  constructor(
    private readonly trackingService: EmailTrackingService,
    private readonly mailerooProvider: MailerooProvider,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin: Get email statistics
   * GET /api/v1/admin/email/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.EMAIL, PermissionAction.READ)
  async getEmailStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.trackingService.getEmailStats(start, end);
    return stats;
  }

  /**
   * Admin: Get email queue statistics
   * GET /api/v1/admin/email/queue-stats
   */
  @Get('queue-stats')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.EMAIL, PermissionAction.READ)
  getQueueStats(): any {
    // This would require injecting the queue and calling queue.getJobCounts()
    // Placeholder for now
    return {
      queued: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  /**
   * Admin: Verify Maileroo domain
   * POST /api/v1/admin/email/verify-domain
   */
  @Post('verify-domain')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.EMAIL, PermissionAction.UPDATE)
  async verifyDomain(@Body('domain') domain: string): Promise<any> {
    try {
      const result = await this.mailerooProvider.verifyDomain(domain);
      const verified = result.status === 'verified';
      return {
        domain: result.domain,
        verified,
        // Maileroo's /domains list only reports one overall verification
        // status, not a per-record (DKIM/SPF/DMARC) breakdown — these
        // mirror the overall result rather than a fabricated finer signal.
        dkimVerified: verified,
        spfVerified: verified,
        dmarcVerified: verified,
        verificationStatus: result.status,
      };
    } catch (error) {
      return {
        error: 'Failed to verify domain',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Admin: Get Maileroo health status
   * GET /api/v1/admin/email/health
   */
  @Get('health')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.EMAIL, PermissionAction.READ)
  async healthCheck(): Promise<any> {
    const [apiKey, redisConnected, databaseConnected] = await Promise.all([
      this.mailerooProvider.healthCheck().catch(() => false),
      this.checkRedis(),
      this.checkDatabase(),
    ]);

    const allUp = apiKey && redisConnected && databaseConnected;
    const allDown = !apiKey && !redisConnected && !databaseConnected;
    const status: 'ok' | 'warning' | 'error' = allUp
      ? 'ok'
      : allDown
        ? 'error'
        : 'warning';
    const downParts = [
      !apiKey && 'Maileroo API',
      !redisConnected && 'Redis',
      !databaseConnected && 'database',
    ].filter((p): p is string => Boolean(p));

    return {
      status,
      message: allUp
        ? 'All systems operational'
        : `Unreachable: ${downParts.join(', ')}`,
      lastChecked: new Date().toISOString(),
      apiKey,
      redisConnected,
      databaseConnected,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return false;

    const client = createClient({
      url: redisUrl,
      socket: { connectTimeout: 2000 },
    });
    client.on('error', () => {});
    try {
      await client.connect();
      await client.ping();
      return true;
    } catch {
      return false;
    } finally {
      if (client.isOpen) await client.disconnect().catch(() => {});
    }
  }
}
