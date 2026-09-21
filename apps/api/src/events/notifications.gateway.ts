import { Injectable, Logger } from '@nestjs/common';
import { RealtimeService } from '../realtime/realtime.service';

/**
 * Broadcasts notification events via Supabase Realtime, on a per-user
 * channel (`user:{id}`). Clients subscribe directly to Supabase — see
 * apps/web/lib/use-notification-socket.ts.
 * Previously a Socket.IO gateway; moved off in-process rooms since a
 * persistent server isn't available on Vercel serverless functions.
 */
@Injectable()
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly realtime: RealtimeService) {}

  /** Broadcast new notification to a user. Called from NotificationService. */
  async broadcastNotificationToUser(userId: string, notification: any) {
    await this.realtime.broadcast(`user:${userId}`, 'new_notification', {
      ...notification,
      deliveredAt: new Date().toISOString(),
    });
    this.logger.debug(`Notification broadcasted to user ${userId}: ${notification.type}`);
  }

  async broadcastNotificationRead(userId: string, notificationId: string) {
    await this.realtime.broadcast(`user:${userId}`, 'notification_read', {
      notificationId,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastAllNotificationsRead(userId: string) {
    await this.realtime.broadcast(`user:${userId}`, 'all_notifications_read', {
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastNotificationArchived(userId: string, notificationId: string) {
    await this.realtime.broadcast(`user:${userId}`, 'notification_archived', {
      notificationId,
      timestamp: new Date().toISOString(),
    });
  }
}
