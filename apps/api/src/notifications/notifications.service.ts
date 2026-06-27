import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../events/notifications.gateway';
import {
  ContentPublishedEvent,
  ContentRejectedEvent,
  SignatureAddedEvent,
  UserVerifiedEvent,
  FraudDetectedEvent,
  DonationReceivedEvent,
  BadgeUnlockedEvent,
  ChallengeCompletedEvent,
  PetitionUpdatePublishedEvent,
} from '../events/domain-events';

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * Notifications Service
 * Handles notification creation, delivery, and preference management
 * Listens to domain events and creates notifications
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: NotificationsGateway,
  ) {}

  /**
   * Create and send a notification to a user
   */
  async createNotification(
    userId: string,
    payload: NotificationPayload,
  ): Promise<any> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: payload.type as any,
          title: payload.title,
          message: payload.message,
          actionUrl: payload.actionUrl,
          actionLabel: payload.actionLabel,
          metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        },
      });

      this.logger.debug(
        `Notification created for user ${userId}: ${payload.title}`,
      );

      const result = {
        ...notification,
        metadata: notification?.metadata
          ? typeof notification.metadata === 'string'
            ? JSON.parse(notification.metadata)
            : notification.metadata
          : null,
      };

      // Push to WebSocket in real-time
      this.gateway?.broadcastNotificationToUser(userId, result);

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create notification: ${err?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async createBulkNotifications(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<any[]> {
    const notifications = await Promise.all(
      userIds.map((userId) => this.createNotification(userId, payload)),
    );
    return notifications;
  }

  /**
   * Get user's unread notifications
   */
  async getUnreadNotifications(userId: string, limit = 10, offset = 0) {
    return this.prisma.notification.findMany({
      where: { userId, status: 'UNREAD' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { status: 'READ', readAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: any) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...preferences,
      },
      update: preferences,
    });
  }

  /**
   * Event Listeners - React to domain events
   */

  @OnEvent('CONTENT_PUBLISHED')
  async handleContentPublished(event: ContentPublishedEvent) {
    this.logger.log(`Content published: ${event.entityId}`);
    // Notify creator
    await this.createNotification(event.creatorId, {
      type: 'CONTENT_PUBLISHED',
      title: 'Your Content Published',
      message: `Your petition "${event.title}" has been published and is live!`,
      actionUrl: `/content/${event.entityId}`,
      actionLabel: 'View Now',
    });
  }

  @OnEvent('CONTENT_REJECTED')
  async handleContentRejected(event: ContentRejectedEvent) {
    this.logger.log(`Content rejected: ${event.entityId}`);
    // Notify creator about rejection
    await this.createNotification(event.creatorId, {
      type: 'CONTENT_REJECTED',
      title: 'Content Not Approved',
      message: `Your petition was not approved. Reason: ${event.rejectionReason}`,
      actionUrl: `/dashboard/drafts`,
      actionLabel: 'View Draft',
    });
  }

  @OnEvent('SIGNATURE_ADDED')
  async handleSignatureAdded(event: SignatureAddedEvent) {
    this.logger.log(`Signature added to petition: ${event.petitionId}`);
    // Get petition creator
    const petition = await this.prisma.petition.findUnique({
      where: { id: event.petitionId },
      select: { creatorId: true, title: true },
    });

    if (petition) {
      await this.createNotification(petition.creatorId, {
        type: 'SIGNATURE_RECEIVED',
        title: 'New Signature',
        message: `Someone signed your petition "${petition.title}"`,
        actionUrl: `/petitions/${event.petitionId}`,
        actionLabel: 'View Petition',
        metadata: { petitionId: event.petitionId },
      });
    }
  }

  @OnEvent('DONATION_RECEIVED')
  async handleDonationReceived(event: DonationReceivedEvent) {
    this.logger.log(`Donation received: ${event.entityId}`);
    // Notify content creator if donation is per-content
    if (event.contentId) {
      const content = await this.prisma.content.findUnique({
        where: { id: event.contentId },
        select: { creatorId: true, title: true },
      });

      if (content) {
        await this.createNotification(content.creatorId, {
          type: 'DONATION_RECEIVED',
          title: 'Donation Received',
          message: `You received a donation of ${event.currency} ${event.amount.toFixed(2)}!`,
          actionUrl: `/content/${event.contentId}/donations`,
          actionLabel: 'View Donations',
          metadata: {
            contentId: event.contentId,
            amount: event.amount,
            currency: event.currency,
          },
        });
      }
    }
  }

  @OnEvent('FRAUD_DETECTED')
  async handleFraudDetected(event: FraudDetectedEvent) {
    this.logger.warn(`Fraud detected: ${event.entityId}`);
    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        this.createNotification(admin.id, {
          type: 'FRAUD_DETECTED',
          title: 'Fraud Alert',
          message: `Suspicious activity detected (Rule: ${event.ruleKey}, Risk Points: ${event.riskPoints})`,
          actionUrl: '/admin/fraud',
          actionLabel: 'Review Fraud',
          metadata: {
            ruleKey: event.ruleKey,
            riskPoints: event.riskPoints,
          },
        }),
      ),
    );
  }

  /**
   * Handle Badge Unlocked Events
   */
  @OnEvent('BadgeUnlockedEvent')
  async handleBadgeUnlocked(event: BadgeUnlockedEvent) {
    this.logger.log(
      `Badge unlocked for user ${event.userId}: ${event.badgeType}`,
    );

    const badgeNames: Record<string, string> = {
      SHARE_WIZARD: 'Share Wizard',
      VIRAL_HERO: 'Viral Hero',
      NETWORK_BUILDER: 'Network Builder',
      INFLUENCER: 'Influencer',
      STREAK_MASTER: 'Streak Master',
    };

    const badgeName = badgeNames[event.badgeType] || event.badgeType;

    await this.createNotification(event.userId, {
      type: 'BADGE_UNLOCKED',
      title: `🏆 Badge Unlocked: ${badgeName}`,
      message: `Congratulations! You've unlocked the "${badgeName}" badge for your viral sharing efforts. You earned a multiplier boost!`,
      actionUrl: `/badges/${event.badgeType}`,
      actionLabel: 'View Badge',
      metadata: {
        badgeType: event.badgeType,
        badgeName,
        petitionId: event.petitionId,
      },
    });
  }

  /**
   * Handle Challenge Completed Events
   */
  @OnEvent('ChallengeCompletedEvent')
  async handleChallengeCompleted(event: ChallengeCompletedEvent) {
    this.logger.log(
      `Challenge completed for user ${event.userId}: ${event.challengeId}`,
    );

    const challenge = await this.prisma.shareChallenge.findUnique({
      where: { id: event.challengeId },
      select: { title: true, rewardMultiplier: true },
    });

    if (!challenge) {
      this.logger.warn(`Challenge not found: ${event.challengeId}`);
      return;
    }

    await this.createNotification(event.userId, {
      type: 'CHALLENGE_COMPLETED',
      title: `🎯 Challenge Complete: ${challenge.title}`,
      message: `You've completed "${challenge.title}"! You earned a ${challenge.rewardMultiplier}x share multiplier. Keep up the great work!`,
      actionUrl: `/challenges/${event.challengeId}`,
      actionLabel: 'View Challenge',
      metadata: {
        challengeId: event.challengeId,
        challengeTitle: challenge.title,
        rewardMultiplier: challenge.rewardMultiplier,
      },
    });
  }

  /**
   * Notify user of share milestone (10, 50, 100 shares)
   */
  async notifyShareMilestone(
    userId: string,
    petitionId: string,
    shareCount: number,
  ): Promise<void> {
    const milestones = [10, 50, 100, 250, 500, 1000];
    if (!milestones.includes(shareCount)) {
      return;
    }

    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      select: { title: true },
    });

    if (!petition) {
      return;
    }

    await this.createNotification(userId, {
      type: 'SHARE_MILESTONE',
      title: `🎉 ${shareCount} Shares Milestone!`,
      message: `You've reached ${shareCount} shares for "${petition.title}"! Your impact is growing exponentially.`,
      actionUrl: `/petitions/${petitionId}/shares`,
      actionLabel: 'View Analytics',
      metadata: {
        petitionId,
        shareCount,
        petitionTitle: petition.title,
      },
    });
  }

  /**
   * Notify user of leaderboard achievement
   */
  async notifyLeaderboardAchievement(
    userId: string,
    rank: number,
    category: string,
  ): Promise<void> {
    if (rank > 10) {
      return; // Only notify for top 10
    }

    const medals: Record<string, string> = {
      '1': '🥇',
      '2': '🥈',
      '3': '🥉',
    };
    const medal = medals[String(rank)] || '⭐';

    await this.createNotification(userId, {
      type: 'LEADERBOARD_ACHIEVEMENT',
      title: `${medal} Top ${rank} on ${category} Leaderboard!`,
      message: `Congratulations! You've reached #${rank} on the ${category} leaderboard. Keep sharing to stay at the top!`,
      actionUrl: '/leaderboard',
      actionLabel: 'View Leaderboard',
      metadata: { rank, category },
    });
  }

  @OnEvent('PETITION_UPDATE_PUBLISHED')
  async handlePetitionUpdatePublished(event: PetitionUpdatePublishedEvent) {
    const followers = await this.prisma.petitionFollower.findMany({
      where: { petitionId: event.petitionId },
      select: { userId: true },
    });
    if (!followers.length) return;

    await Promise.all(
      followers.map((f: { userId: string }) =>
        this.createNotification(f.userId, {
          type: 'PETITION_UPDATE',
          title: `Update: ${event.petitionTitle}`,
          message: event.updateTitle,
          actionUrl: `/petitions/${event.petitionId}`,
          actionLabel: 'Read update',
          metadata: { petitionId: event.petitionId },
        }),
      ),
    );
  }

  @OnEvent('poll.submitted')
  async handlePollSubmitted(event: { pollId: string; pollTitle: string; submittedBy: string }) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.createNotification(admin.id, {
          type: 'POLL_PENDING_REVIEW',
          title: 'New Poll Awaiting Review',
          message: `A new poll idea "${event.pollTitle}" has been submitted and needs your approval.`,
          actionUrl: '/admin',
          actionLabel: 'Review Poll',
          metadata: { pollId: event.pollId, submittedBy: event.submittedBy },
        }),
      ),
    );
  }
}
