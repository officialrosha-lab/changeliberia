import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/roles.guard';
import {
  NotificationService,
  NotificationFilterDto,
} from './notification.service';

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
    @CurrentUser() user: RequestUser,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: NotificationFilterDto = {
      status,
      type,
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    return this.notificationService.getUserNotifications(user.userId, filters);
  }

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@CurrentUser() user: RequestUser) {
    const count = await this.notificationService.getUnreadCount(user.userId);
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
  async markAllAsRead(@CurrentUser() user: RequestUser) {
    return this.notificationService.markAllAsRead(user.userId);
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
  async getPreferences(@CurrentUser() user: RequestUser) {
    return this.notificationService.getPreferences(user.userId);
  }

  /**
   * Update notification preferences
   * POST /api/v1/notifications/preferences
   */
  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @CurrentUser() user: RequestUser,
    @Body()
    updates: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      digestFrequency?: string;
      mutedTypes?: NotificationType[];
    },
  ) {
    return this.notificationService.updatePreferences(user.userId, updates);
  }
}
