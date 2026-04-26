import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { DomainEvent } from './domain-events';

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

/**
 * Event Bus Service
 * Central service for publishing and subscribing to domain events
 * Handles persistence and processing of events
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Publish a domain event
   * - Emits to local event listeners
   * - Persists to database for replay/recovery
   * - Can be extended for distributed event bus in the future
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    try {
      this.logger.debug(
        `Publishing event: ${event.eventType} for entity ${event.entityId}`,
      );

      // Persist event to database
      await this.prisma.domainEvent.create({
        data: {
          type: event.eventType as any,
          entityId: event.entityId,
          entityType: event.entityType,
          payload: JSON.stringify(event.getPayload()),
          processed: false,
        },
      });

      // Emit to local listeners
      this.eventEmitter.emit(event.eventType, event);

      this.logger.debug(
        `Event ${event.eventType} published and persisted successfully`,
      );
    } catch (error) {
      const err = error as ErrorWithMessage;
      this.logger.error(
        `Failed to publish event ${event.eventType}: ${err?.message || 'Unknown error'}`,
        err?.stack,
      );
      throw error;
    }
  }

  /**
   * Publish multiple events in sequence
   */
  async publishAll<T extends DomainEvent>(events: T[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Get unpublished/unprocessed events
   * Useful for recovery and replay scenarios
   */
  async getUnprocessedEvents(limit = 100) {
    return this.prisma.domainEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string): Promise<void> {
    await this.prisma.domainEvent.update({
      where: { id: eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Get event history for an entity
   */
  async getEventHistory(entityId: string, entityType?: string) {
    return this.prisma.domainEvent.findMany({
      where: {
        entityId,
        ...(entityType && { entityType }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
