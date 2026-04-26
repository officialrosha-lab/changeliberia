import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService, NotificationFilterDto } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get current user's notifications
   * GET /api/v1/notifications?status=UNREAD&limit=20&offset=0
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: NotificationFilterDto = {
      status: status as any,
      type: type as any,
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.notificationService.getUserNotifications(req.user.id, filters);
  }

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  /**
   * Mark notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') notificationId: string) {
    return this.notificationService.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read
   * POST /api/v1/notifications/mark-all-read
   */
  @Post('mark-all-read')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  /**
   * Archive notification
   * PATCH /api/v1/notifications/:id/archive
   */
  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archive(@Param('id') notificationId: string) {
    return this.notificationService.archive(notificationId);
  }

  /**
   * Delete notification
   * DELETE /api/v1/notifications/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') notificationId: string) {
    await this.notificationService.delete(notificationId);
    return { success: true };
  }

  /**
   * Get notification preferences
   * GET /api/v1/notifications/preferences
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Req() req: any) {
    return this.notificationService.getPreferences(req.user.id);
  }

  /**
   * Update notification preferences
   * POST /api/v1/notifications/preferences
   */
  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Req() req: any,
    @Body()
    updates: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      digestFrequency?: string;
      mutedTypes?: string[];
    },
  ) {
    return this.notificationService.updatePreferences(req.user.id, {
      ...updates,
      mutedTypes: updates.mutedTypes as any,
    });
  }
}
