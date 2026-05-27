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
import { EmailService } from '../services/email.service';
import { EmailPreferenceService, EmailPreferenceDTO } from '../services/email-preference.service';
import { EmailTrackingService } from '../services/email-tracking.service';
import { ResendProvider } from '../providers/resend.provider';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permission } from '../../rbac/decorators/permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { PermissionResource, PermissionAction } from '@prisma/client';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly preferenceService: EmailPreferenceService,
    private readonly trackingService: EmailTrackingService,
    private readonly resendProvider: ResendProvider,
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
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80,
        0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04,
        0x01, 0x0a, 0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
      ]);

      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Length', pixel.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.end(pixel);
    } catch (error) {
      this.logger.error(`Error tracking open: ${error}`);
      // Still return pixel even on error
      const pixel = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80,
        0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04,
        0x01, 0x0a, 0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
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
      this.logger.error(`Error tracking click: ${error}`);
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
      this.logger.error(`Error unsubscribing: ${error}`);
      res.status(500).json({ error: 'Unsubscribe failed' });
    }
  }

  /**
   * Get user email preferences
   * GET /api/v1/email/preferences
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Req() req: any): Promise<any> {
    const userId = req.user.sub;
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
    const userId = req.user.sub;
    const prefs = await this.preferenceService.updatePreferences(userId, updates);

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
    const userId = req.user.sub;
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
    private readonly resendProvider: ResendProvider,
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
  async getQueueStats(): Promise<any> {
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
   * Admin: Verify Resend domain
   * POST /api/v1/admin/email/verify-domain
   */
  @Post('verify-domain')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.EMAIL, PermissionAction.UPDATE)
  async verifyDomain(@Body('domain') domain: string): Promise<any> {
    try {
      const status = await this.resendProvider.verifyDomain(domain);
      return status;
    } catch (error) {
      return {
        error: 'Failed to verify domain',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Admin: Get Resend health status
   * GET /api/v1/admin/email/health
   */
  @Get('health')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.EMAIL, PermissionAction.READ)
  async healthCheck(): Promise<any> {
    try {
      const health = await this.resendProvider.healthCheck();
      return {
        healthy: true,
        ...(typeof health === 'object' && health !== null ? health : {}),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
