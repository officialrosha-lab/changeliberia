import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification, NotificationType, NotificationStatus } from '@prisma/client';
import { NotificationsGateway } from '../events/notifications.gateway';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilterDto {
  status?: NotificationStatus;
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationDto): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    // Broadcast notification via WebSocket in real-time
    try {
      this.notificationsGateway.broadcastNotificationToUser(data.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        status: notification.status,
        createdAt: notification.createdAt,
        metadata: data.metadata,
      });
    } catch (error) {
      // Don't fail if WebSocket broadcast fails - persistence is what matters
      console.error('Error broadcasting notification via WebSocket:', error);
    }

    return notification;
  }

  /**
   * Get user's notifications with filters
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationFilterDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;

    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.unreadOnly) {
      where.status = NotificationStatus.UNREAD;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    // Broadcast read status via WebSocket
    try {
      this.notificationsGateway.broadcastNotificationRead(
        notification.userId,
        notificationId,
      );
    } catch (error) {
      console.error('Error broadcasting notification read:', error);
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    // Broadcast all read via WebSocket
    try {
      this.notificationsGateway.broadcastAllNotificationsRead(userId);
    } catch (error) {
      console.error('Error broadcasting all notifications read:', error);
    }

    return { count: result.count };
  }

  /**
   * Archive notification
   */
  async archive(notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.ARCHIVED },
    });

    // Broadcast archived status via WebSocket
    try {
      this.notificationsGateway.broadcastNotificationArchived(
        notification.userId,
        notificationId,
      );
    } catch (error) {
      console.error('Error broadcasting notification archived:', error);
    }

    return notification;
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if doesn't exist
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return {
      ...prefs,
      mutedTypes: JSON.parse(prefs.mutedTypes || '[]'),
    };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      digestFrequency?: string;
      mutedTypes?: NotificationType[];
    },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        inAppEnabled: updates.inAppEnabled ?? true,
        emailEnabled: updates.emailEnabled ?? true,
        pushEnabled: updates.pushEnabled ?? false,
        digestFrequency: updates.digestFrequency ?? 'daily',
        mutedTypes: JSON.stringify(updates.mutedTypes || []),
      },
      update: {
        inAppEnabled: updates.inAppEnabled,
        emailEnabled: updates.emailEnabled,
        pushEnabled: updates.pushEnabled,
        digestFrequency: updates.digestFrequency,
        mutedTypes: updates.mutedTypes
          ? JSON.stringify(updates.mutedTypes)
          : undefined,
      },
    });
  }
}
