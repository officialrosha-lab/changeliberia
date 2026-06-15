import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: { sub: string };
}

@ApiTags('notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUnreadNotifications(
    @Request() req: AuthenticatedRequest,
    @Query('limit') rawLimit?: string,
    @Query('offset') rawOffset?: string,
  ) {
    const userId = req.user.sub;
    const limit = Math.min(100, Math.max(0, rawLimit ? parseInt(rawLimit, 10) || 0 : 10));
    const offset = Math.max(0, rawOffset ? parseInt(rawOffset, 10) || 0 : 0);
    return this.notificationsService.getUnreadNotifications(userId, limit, offset);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') notificationId: string, @Request() req: AuthenticatedRequest) {
    await this.notificationsService.markAsRead(notificationId, req.user.sub);
    return { success: true };
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteNotification(@Param('id') notificationId: string, @Request() req: AuthenticatedRequest) {
    await this.notificationsService.deleteNotification(notificationId, req.user.sub);
    return { success: true };
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(@Request() req: AuthenticatedRequest, @Body() preferences: any) {
    const userId = req.user.sub;
    return this.notificationsService.updatePreferences(userId, preferences);
  }
}
