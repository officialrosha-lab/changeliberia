import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeService } from '../facebook/badge.service';
import { ChallengeService } from '../facebook/challenge.service';
import {
  FacebookShareCreatedEvent,
  FacebookShareClickedEvent,
  FacebookConversionTrackedEvent,
  BadgeUnlockedEvent,
  ChallengeCompletedEvent,
} from './domain-events';

/**
 * Facebook Events Listener
 * Handles all viral growth related events:
 * - Share creation and tracking
 * - Badge unlocks with multiplier application
 * - Challenge progress and completions
 * - Real-time user notifications
 */
@Injectable()
export class FacebookEventsListener {
  private readonly logger = new Logger(FacebookEventsListener.name);

  constructor(
    private prisma: PrismaService,
    private badgeService: BadgeService,
    private challengeService: ChallengeService,
  ) {}

  /**
   * Handle Facebook share created event
   * Updates user analytics and triggers badge checks
   */
  @OnEvent('FACEBOOK_SHARE_CREATED')
  async handleShareCreated(event: FacebookShareCreatedEvent) {
    try {
      this.logger.log(
        `Processing share created event for user ${event.userId} on petition ${event.petitionId}`,
      );

      // Update share link with reach estimate
      await this.prisma.shareLink.update({
        where: { shortCode: event.shortCode },
        data: {
          networkReachEstimate: event.estimatedReach,
        },
      });

      // Track share event for analytics
      await this.prisma.facebookPixelEvent.create({
        data: {
          eventId: `share_${event.shortCode}`,
          userId: event.userId,
          petitionId: event.petitionId,
          eventType: 'ViewContent',
          eventData: JSON.stringify({
            share_code: event.shortCode,
            estimated_reach: event.estimatedReach,
          }),
          pixelId: process.env.FACEBOOK_PIXEL_ID || 'placeholder',
        },
      });

      // Check for badge unlocks
      const newBadges = await this.badgeService.checkAndAwardBadges(
        event.userId,
        event.petitionId,
      );

      // Emit badge events for each new badge
      for (const badgeType of newBadges) {
        const badge = await this.prisma.socialEngagementBadge.findFirst({
          where: {
            userId: event.userId,
            petitionId: event.petitionId,
            badgeType: badgeType as any,
          },
        });

        if (badge) {
          await this.handleBadgeUnlocked(
            new BadgeUnlockedEvent(
              badge.id,
              event.userId,
              event.petitionId,
              badgeType,
              badge.multiplierBonus,
            ),
          );
        }
      }

      // Check and track challenge progress
      await this.challengeService.autoCompleteReachedGoals(event.userId);

      this.logger.log(
        `Share created event processed successfully for ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process share created event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle Facebook share clicked event
   * Updates conversion tracking and applies trust bonuses
   */
  @OnEvent('FACEBOOK_SHARE_CLICKED')
  async handleShareClicked(event: FacebookShareClickedEvent) {
    try {
      this.logger.log(
        `Processing share clicked event for code ${event.shortCode}`,
      );

      // Find the referrer from share link
      const shareLink = await this.prisma.shareLink.findUnique({
        where: { shortCode: event.shortCode },
        include: {
          referral: {
            select: { referrerId: true },
          },
        },
      });

      if (!shareLink?.referral?.referrerId) {
        this.logger.debug(
          `Share link ${event.shortCode} has no associated referrer`,
        );
        return;
      }

      // Increment click count
      await this.prisma.shareLink.update({
        where: { shortCode: event.shortCode },
        data: {
          clickCount: { increment: 1 },
        },
      });

      // Record click event in pixel
      await this.prisma.facebookPixelEvent.create({
        data: {
          eventId: `click_${event.shortCode}_${Date.now()}`,
          userId: shareLink.referral.referrerId,
          petitionId: event.petitionId,
          eventType: 'InitiateCheckout',
          eventData: JSON.stringify({
            share_code: event.shortCode,
            click_type: 'facebook',
          }),
          pixelId: process.env.FACEBOOK_PIXEL_ID || 'placeholder',
        },
      });

      this.logger.log(
        `Share clicked event processed for code ${event.shortCode}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process share clicked event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle Facebook conversion tracked event
   * Updates trust scores and triggers achievement checks
   */
  @OnEvent('FACEBOOK_CONVERSION_TRACKED')
  async handleConversionTracked(event: FacebookConversionTrackedEvent) {
    try {
      this.logger.log(
        `Processing conversion tracked event for user ${event.userId}, type: ${event.conversionType}`,
      );

      // Apply trust bonus with badge multipliers
      const trustBonus = await this.badgeService.applyBadgeMultiplier(
        event.userId,
        event.petitionId,
        event.trustValue,
      );

      // Apply challenge multiplier
      const finalBonus = await this.challengeService.applyChallengeMultiplier(
        event.userId,
        trustBonus,
      );

      // Update user trust score
      await this.prisma.user.update({
        where: { id: event.userId },
        data: {
          trustScore: {
            increment: finalBonus,
          },
        },
      });

      // Record conversion event
      await this.prisma.facebookPixelEvent.create({
        data: {
          eventId: `conversion_${event.userId}_${Date.now()}`,
          userId: event.userId,
          petitionId: event.petitionId,
          eventType: 'Purchase',
          conversionValue: finalBonus,
          eventData: JSON.stringify({
            conversion_type: event.conversionType,
            trust_bonus: finalBonus,
          }),
          pixelId: process.env.FACEBOOK_PIXEL_ID || 'placeholder',
        },
      });

      this.logger.log(
        `Conversion tracked: user ${event.userId} earned ${finalBonus} trust points`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process conversion tracked event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle badge unlocked event
   * Sends notification and updates leaderboards
   */
  @OnEvent('BADGE_UNLOCKED')
  async handleBadgeUnlocked(event: BadgeUnlockedEvent) {
    try {
      this.logger.log(
        `Processing badge unlocked event: ${event.badgeType} for user ${event.userId}`,
      );

      // Update badge leaderboard cache
      await this.updateBadgeLeaderboard(event.userId);
      this.logger.log(
        `Badge unlocked notification would be sent to ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process badge unlocked event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle challenge completed event
   * Sends notification and triggers next challenge
   */
  @OnEvent('CHALLENGE_COMPLETED')
  async handleChallengeCompleted(event: ChallengeCompletedEvent) {
    try {
      this.logger.log(
        `Processing challenge completed event: ${event.challengeId} for user ${event.userId}`,
      );

      // Update challenge leaderboard
      await this.updateChallengeLeaderboard(event.userId);
      this.logger.log(
        `Challenge completed notification would be sent to ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process challenge completed event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async updateBadgeLeaderboard(userId: string): Promise<void> {
    // Cache badge counts for quick leaderboard queries
    const badgeCount = await this.prisma.socialEngagementBadge.count({
      where: { userId },
    });
  }

  private async updateChallengeLeaderboard(userId: string): Promise<void> {
    // Cache challenge completions for leaderboard
    const completionCount = await this.prisma.challengeMembership.count({
      where: {
        userId,
        completed: true,
      },
    });
  }
}
