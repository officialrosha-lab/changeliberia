import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AnalyticsUpdate {
  type: 'message_count' | 'broadcast_count' | 'message_created' | 'broadcast_sent' | 'metrics_updated';
  timestamp: Date;
  data: Record<string, unknown>;
}

interface AnalyticsSubscription {
  userId: string;
  types: Set<AnalyticsUpdate['type']>;
  roles: string[];
}

@Injectable()
@WebSocketGateway({
  namespace: 'analytics',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  // Map of socket ID to subscriptions
  private subscriptions: Map<string, AnalyticsSubscription> = new Map();

  constructor(private eventEmitter: EventEmitter2) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`[Analytics] Client connected: ${client.id}`);
    // Client can now subscribe to analytics updates
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`[Analytics] Client disconnected: ${client.id}`);
    this.subscriptions.delete(client.id);
  }

  /**
   * Subscribe to analytics updates
   * Client sends: { userId: string, types: string[], roles: string[] }
   * Example: { userId: 'admin123', types: ['message_count', 'broadcast_count'], roles: ['ADMIN'] }
   */
  @SubscribeMessage('subscribe_analytics')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; types: string[]; roles: string[] },
  ) {
    const subscription: AnalyticsSubscription = {
      userId: data.userId,
      types: new Set(data.types as AnalyticsUpdate['type'][]),
      roles: data.roles,
    };
    this.subscriptions.set(client.id, subscription);
    console.log(`[Analytics] ${client.id} subscribed to:`, data.types);

    // Send acknowledgment
    client.emit('subscribed', {
      success: true,
      message: 'Successfully subscribed to analytics updates',
      types: data.types,
    });
  }

  /**
   * Unsubscribe from analytics updates
   */
  @SubscribeMessage('unsubscribe_analytics')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    this.subscriptions.delete(client.id);
    console.log(`[Analytics] ${client.id} unsubscribed`);
    client.emit('unsubscribed', { success: true });
  }

  /**
   * Broadcast analytics update to all subscribed admin clients
   */
  broadcastAnalyticsUpdate(update: AnalyticsUpdate) {
    this.subscriptions.forEach((subscription, socketId) => {
      if (subscription.types.has(update.type) && subscription.roles.includes('ADMIN')) {
        this.server.to(socketId).emit('analytics_update', update);
      }
    });
  }

  /**
   * Broadcast message count update
   */
  emitMessageCountUpdate(data: {
    totalMessages: number;
    messagesLastHour: number;
    messagesLastDay: number;
  }) {
    const update: AnalyticsUpdate = {
      type: 'message_count',
      timestamp: new Date(),
      data,
    };
    this.broadcastAnalyticsUpdate(update);
  }

  /**
   * Broadcast broadcast count update
   */
  emitBroadcastCountUpdate(data: {
    totalBroadcasts: number;
    broadcastsLastHour: number;
    broadcastsLastDay: number;
    successRate: number;
  }) {
    const update: AnalyticsUpdate = {
      type: 'broadcast_count',
      timestamp: new Date(),
      data,
    };
    this.broadcastAnalyticsUpdate(update);
  }

  /**
   * Broadcast message created event
   */
  emitMessageCreated(data: {
    messageId: string;
    senderId: string;
    recipientId: string;
    subject: string;
    category?: string;
    timestamp: Date;
  }) {
    const update: AnalyticsUpdate = {
      type: 'message_created',
      timestamp: new Date(),
      data,
    };
    this.broadcastAnalyticsUpdate(update);
  }

  /**
   * Broadcast sent event
   */
  emitBroadcastSent(data: {
    broadcastId: string;
    title: string;
    recipientCount: number;
    category?: string;
    timestamp: Date;
  }) {
    const update: AnalyticsUpdate = {
      type: 'broadcast_sent',
      timestamp: new Date(),
      data,
    };
    this.broadcastAnalyticsUpdate(update);
  }

  /**
   * Broadcast full metrics update
   */
  emitMetricsUpdated(data: {
    messageMetrics: Record<string, unknown>;
    broadcastMetrics: Record<string, unknown>;
    period: 'day' | 'week' | 'month';
    timestamp: Date;
  }) {
    const update: AnalyticsUpdate = {
      type: 'metrics_updated',
      timestamp: new Date(),
      data,
    };
    this.broadcastAnalyticsUpdate(update);
  }

  /**
   * Get number of connected subscribers
   */
  getSubscriberCount(): number {
    return Array.from(this.subscriptions.values()).filter((sub) =>
      sub.roles.includes('ADMIN'),
    ).length;
  }

  /**
   * Get subscription details
   */
  getSubscriptions() {
    return Array.from(this.subscriptions.entries()).map(([socketId, subscription]) => ({
      socketId,
      userId: subscription.userId,
      types: Array.from(subscription.types),
      roles: subscription.roles,
    }));
  }
}
