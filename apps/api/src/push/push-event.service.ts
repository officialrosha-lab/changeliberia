import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push-notification.service';

interface MilestoneEvent {
  creatorId: string;
  petitionId: string;
  petitionTitle: string;
  petitionUrl: string;
  milestone: number;
}

interface ResponseAdvancedEvent {
  petitionId: string;
  petitionTitle: string;
  stage: string;
}

/**
 * Web push notification triggers. Mirrors the EmailEventService pattern —
 * listens to the same domain events already emitted elsewhere, additive
 * only (never blocks the originating action if push delivery fails).
 */
@Injectable()
export class PushEventService {
  private readonly logger = new Logger(PushEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.eventEmitter.on(
      'petition.milestone',
      (event: MilestoneEvent) => void this.onMilestone(event),
    );
    this.eventEmitter.on(
      'petition.government-response-advanced',
      (event: ResponseAdvancedEvent) => void this.onResponseAdvanced(event),
    );
  }

  private async followerIds(
    petitionId: string,
    excludeUserId?: string,
  ): Promise<string[]> {
    const followers = await this.prisma.petitionFollower.findMany({
      where: { petitionId },
      select: { userId: true },
    });
    return followers.map((f) => f.userId).filter((id) => id !== excludeUserId);
  }

  private async onMilestone(event: MilestoneEvent) {
    try {
      const recipients = await this.followerIds(event.petitionId);
      const allRecipients = [event.creatorId, ...recipients];
      await this.pushService.sendToUsers(Array.from(new Set(allRecipients)), {
        title: '🎉 Milestone reached!',
        body: `"${event.petitionTitle}" just hit ${event.milestone.toLocaleString()} signatures.`,
        url: event.petitionUrl,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to send milestone push notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async onResponseAdvanced(event: ResponseAdvancedEvent) {
    try {
      const recipients = await this.followerIds(event.petitionId);
      if (recipients.length === 0) return;
      await this.pushService.sendToUsers(recipients, {
        title: 'Government response update',
        body: `"${event.petitionTitle}" moved to ${event.stage.replaceAll('_', ' ')}.`,
        url: `/petitions/${event.petitionId}`,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to send response-update push notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
