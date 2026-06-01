import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticsGateway } from '../gateways/analytics.gateway';

/**
 * Service that listens to application events and emits real-time analytics updates
 * Connects event emitter to WebSocket gateway for live dashboard updates
 */
@Injectable()
export class AnalyticsRealtimeService {
  constructor(
    @Inject(AnalyticsGateway) private readonly analyticsGateway: AnalyticsGateway,
  ) {}

  /**
   * Listen to message.created event and broadcast to analytics subscribers
   */
  @OnEvent('message.created')
  async onMessageCreated(event: {
    messageId: string;
    senderId: string;
    recipientId: string;
    subject: string;
    category?: string;
    createdAt: Date;
  }) {
    try {
      this.analyticsGateway.emitMessageCreated({
        messageId: event.messageId,
        senderId: event.senderId,
        recipientId: event.recipientId,
        subject: event.subject,
        category: event.category,
        timestamp: event.createdAt,
      });
    } catch (error) {
      console.error('[AnalyticsRealtimeService] Error emitting message.created:', error);
    }
  }

  /**
   * Listen to broadcast.sent event and broadcast to analytics subscribers
   */
  @OnEvent('broadcast.sent')
  async onBroadcastSent(event: {
    broadcastId: string;
    title: string;
    recipientCount: number;
    category?: string;
    sentAt: Date;
  }) {
    try {
      this.analyticsGateway.emitBroadcastSent({
        broadcastId: event.broadcastId,
        title: event.title,
        recipientCount: event.recipientCount,
        category: event.category,
        timestamp: event.sentAt,
      });
    } catch (error) {
      console.error('[AnalyticsRealtimeService] Error emitting broadcast.sent:', error);
    }
  }

  /**
   * Periodic message count update (typically called every minute by a scheduled task)
   */
  emitMessageCountUpdate(data: {
    totalMessages: number;
    messagesLastHour: number;
    messagesLastDay: number;
  }) {
    try {
      this.analyticsGateway.emitMessageCountUpdate(data);
    } catch (error) {
      console.error('[AnalyticsRealtimeService] Error emitting message count update:', error);
    }
  }

  /**
   * Periodic broadcast count update (typically called every minute by a scheduled task)
   */
  emitBroadcastCountUpdate(data: {
    totalBroadcasts: number;
    broadcastsLastHour: number;
    broadcastsLastDay: number;
    successRate: number;
  }) {
    try {
      this.analyticsGateway.emitBroadcastCountUpdate(data);
    } catch (error) {
      console.error('[AnalyticsRealtimeService] Error emitting broadcast count update:', error);
    }
  }

  /**
   * Full metrics update (typically called every 5 minutes by a scheduled task)
   */
  emitMetricsUpdated(data: {
    messageMetrics: Record<string, unknown>;
    broadcastMetrics: Record<string, unknown>;
    period: 'day' | 'week' | 'month';
  }) {
    try {
      this.analyticsGateway.emitMetricsUpdated({
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[AnalyticsRealtimeService] Error emitting metrics update:', error);
    }
  }
}
