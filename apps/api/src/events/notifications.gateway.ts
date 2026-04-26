import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Real-time WebSocket gateway for notifications
 * Broadcasts notifications to connected users in real-time
 * Provides fallback when polling is not fast enough
 */
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://10.158.217.47:3000',
      process.env.WEB_URL || 'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: 'notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<socketIds>

  constructor(private prisma: PrismaService) {
    this.logger.log('Notifications Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Notification client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
    // Clean up user connections
    for (const [userId, socketIds] of this.userConnections.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    }
  }

  /**
   * Client authenticates and subscribes to their notifications
   * Should be called after user logs in
   */
  @SubscribeMessage('subscribe_notifications')
  async handleSubscribeNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;

    if (!userId) {
      client.emit('error', { message: 'userId is required' });
      return;
    }

    // Join user-specific room
    client.join(`user:${userId}`);

    // Track connection
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(client.id);

    this.logger.log(
      `Notification client ${client.id} subscribed for user ${userId}`,
    );

    // Emit subscription confirmed
    client.emit('subscribed', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from notifications
   */
  @SubscribeMessage('unsubscribe_notifications')
  handleUnsubscribeNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    client.leave(`user:${userId}`);

    // Remove from tracking
    const socketIds = this.userConnections.get(userId);
    if (socketIds) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from user ${userId}`);
  }

  /**
   * Broadcast new notification to a user
   * Called from NotificationTriggerService or NotificationService
   */
  broadcastNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', {
      ...notification,
      deliveredAt: new Date().toISOString(),
    });

    this.logger.debug(
      `Notification broadcasted to user ${userId}:`,
      notification.type,
    );
  }

  /**
   * Broadcast notification read event
   */
  broadcastNotificationRead(userId: string, notificationId: string) {
    this.server.to(`user:${userId}`).emit('notification_read', {
      notificationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast all notifications marked as read
   */
  broadcastAllNotificationsRead(userId: string) {
    this.server.to(`user:${userId}`).emit('all_notifications_read', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast notification archived
   */
  broadcastNotificationArchived(userId: string, notificationId: string) {
    this.server.to(`user:${userId}`).emit('notification_archived', {
      notificationId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get number of connected users
   */
  getConnectedUserCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get connected socket IDs for a user
   */
  getUserConnections(userId: string): string[] {
    return Array.from(this.userConnections.get(userId) || []);
  }
}
