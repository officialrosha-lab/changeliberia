import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType } from '@prisma/client';

interface BadgeProgress {
  badgeType: BadgeType;
  progress: number;
  target: number;
  percentComplete: number;
}

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  // Badge unlock conditions
  private readonly BADGE_CONDITIONS = {
    SHARE_WIZARD: {
      description: '10+ shares on a single petition',
      target: 10,
      multiplier: 2.0,
    },
    VIRAL_HERO: {
      description: '50+ conversions from your shares',
      target: 50,
      multiplier: 3.0,
    },
    NETWORK_BUILDER: {
      description: '100+ friends who received your shares',
      target: 100,
      multiplier: 2.5,
    },
    INFLUENCER: {
      description: '5%+ of your network converted to signers',
      target: 0.05, // percentage
      multiplier: 5.0,
    },
    STREAK_MASTER: {
      description: 'Shares on 5+ consecutive days',
      target: 5,
      multiplier: 1.5,
    },
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Check and award badges for a user on a petition
   * Called when signatures occur from referrals
   */
  async checkAndAwardBadges(userId: string, petitionId: string): Promise<BadgeType[]> {
    const newBadges: BadgeType[] = [];

    try {
      // Check each badge type
      const badgeTypes: BadgeType[] = [
        'SHARE_WIZARD',
        'VIRAL_HERO',
        'NETWORK_BUILDER',
        'INFLUENCER',
        'STREAK_MASTER',
      ];

      for (const badgeType of badgeTypes) {
        const alreadyHas = await this.prisma.socialEngagementBadge.findUnique({
          where: {
            userId_petitionId_badgeType: {
              userId,
              petitionId,
              badgeType,
            },
          },
        });

        if (alreadyHas) {
          continue; // Skip if already earned
        }

        const shouldAward = await this.checkBadgeCondition(
          userId,
          petitionId,
          badgeType,
        );

        if (shouldAward) {
          const multiplier = this.BADGE_CONDITIONS[badgeType].multiplier;

          await this.prisma.socialEngagementBadge.create({
            data: {
              userId,
              petitionId,
              badgeType,
              multiplierBonus: multiplier,
              metadata: JSON.stringify({
                awardedAt: new Date().toISOString(),
                condition: this.BADGE_CONDITIONS[badgeType].description,
              }),
            },
          });

          newBadges.push(badgeType);
          this.logger.log(
            `Awarded badge ${badgeType} to user ${userId} on petition ${petitionId}`,
          );
        }
      }

      return newBadges;
    } catch (error) {
      this.logger.error(
        `Failed to check and award badges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Check if a user meets the conditions for a specific badge
   */
  private async checkBadgeCondition(
    userId: string,
    petitionId: string,
    badgeType: BadgeType,
  ): Promise<boolean> {
    try {
      switch (badgeType) {
        case 'SHARE_WIZARD':
          return await this.checkShareWizard(userId, petitionId);

        case 'VIRAL_HERO':
          return await this.checkViralHero(userId, petitionId);

        case 'NETWORK_BUILDER':
          return await this.checkNetworkBuilder(userId, petitionId);

        case 'INFLUENCER':
          return await this.checkInfluencer(userId, petitionId);

        case 'STREAK_MASTER':
          return await this.checkStreakMaster(userId, petitionId);

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Error checking badge condition ${badgeType}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * SHARE_WIZARD: 10+ shares on a single petition
   */
  private async checkShareWizard(userId: string, petitionId: string): Promise<boolean> {
    const shareCount = await this.prisma.shareLink.count({
      where: {
        petitionId,
        referral: {
          referrerId: userId,
        },
      },
    });

    return shareCount >= this.BADGE_CONDITIONS.SHARE_WIZARD.target;
  }

  /**
   * VIRAL_HERO: 50+ conversions from shares
   */
  private async checkViralHero(userId: string, petitionId: string): Promise<boolean> {
    const totalConversions = await this.prisma.shareLink.aggregate({
      where: {
        petitionId,
        referral: {
          referrerId: userId,
        },
      },
      _sum: {
        conversions: true,
      },
    });

    const conversions = totalConversions._sum.conversions || 0;
    return conversions >= this.BADGE_CONDITIONS.VIRAL_HERO.target;
  }

  /**
   * NETWORK_BUILDER: 100+ unique friends who received shares
   */
  private async checkNetworkBuilder(userId: string, petitionId: string): Promise<boolean> {
    const uniqueRecipients = await this.prisma.referral.findMany({
      where: {
        petitionId,
        referrerId: userId,
      },
      distinct: ['refereeEmail'],
    });

    return (
      uniqueRecipients.length >= this.BADGE_CONDITIONS.NETWORK_BUILDER.target
    );
  }

  /**
   * INFLUENCER: 5%+ of network converted
   */
  private async checkInfluencer(userId: string, petitionId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Estimate network size based on trust score (proxy)
    const estimatedNetworkSize = Math.max(
      50,
      150 + user.trustScore * 2,
    );

    // Get conversion count
    const conversions = await this.prisma.shareLink.aggregate({
      where: {
        petitionId,
        referral: {
          referrerId: userId,
        },
      },
      _sum: {
        conversions: true,
      },
    });

    const conversionCount = conversions._sum.conversions || 0;
    const conversionRate = conversionCount / estimatedNetworkSize;

    return conversionRate >= this.BADGE_CONDITIONS.INFLUENCER.target;
  }

  /**
   * STREAK_MASTER: Shares on 5+ consecutive days
   */
  private async checkStreakMaster(userId: string, petitionId: string): Promise<boolean> {
    const shares = await this.prisma.shareLink.findMany({
      where: {
        petitionId,
        referral: {
          referrerId: userId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (shares.length === 0) return false;

    // Check for 5+ consecutive days
    const dates = new Set<string>();
    shares.forEach((s) => {
      const dateStr = s.createdAt.toISOString().split('T')[0];
      dates.add(dateStr);
    });

    // If we have shares on 5+ different days, consider it a streak
    return dates.size >= this.BADGE_CONDITIONS.STREAK_MASTER.target;
  }

  /**
   * Apply badge multiplier to referral bonus
   */
  async applyBadgeMultiplier(
    userId: string,
    petitionId: string,
    baseBonus: number,
  ): Promise<number> {
    try {
      const badges = await this.prisma.socialEngagementBadge.findMany({
        where: {
          userId,
          petitionId,
        },
      });

      // Stack multipliers (multiplicative, not additive)
      let totalMultiplier = 1.0;
      badges.forEach((badge) => {
        totalMultiplier *= badge.multiplierBonus;
      });

      // Cap at 5x total
      const finalMultiplier = Math.min(5, totalMultiplier);
      return Math.floor(baseBonus * finalMultiplier);
    } catch (error) {
      this.logger.error(
        `Failed to apply badge multiplier: ${error instanceof Error ? error.message : String(error)}`,
      );
      return baseBonus; // Return base bonus on error
    }
  }

  /**
   * Get user's badges with progress
   */
  async getUserBadges(
    userId: string,
    petitionId?: string,
  ): Promise<
    Array<{
      badgeType: BadgeType;
      earnedAt: Date;
      multiplier: number;
      petitionId: string;
    }>
  > {
    const where: any = { userId };
    if (petitionId) {
      where.petitionId = petitionId;
    }

    const badges = await this.prisma.socialEngagementBadge.findMany({
      where,
      orderBy: {
        earnedAt: 'desc',
      },
    });

    return badges.map((badge) => ({
      badgeType: badge.badgeType,
      earnedAt: badge.earnedAt,
      multiplier: badge.multiplierBonus,
      petitionId: badge.petitionId,
    }));
  }

  /**
   * Get progress toward earning a badge
   */
  async getBadgeProgress(
    userId: string,
    petitionId: string,
    badgeType: BadgeType,
  ): Promise<BadgeProgress> {
    try {
      let progress = 0;
      const target = this.BADGE_CONDITIONS[badgeType].target;

      switch (badgeType) {
        case 'SHARE_WIZARD': {
          const count = await this.prisma.shareLink.count({
            where: {
              petitionId,
              referral: { referrerId: userId },
            },
          });
          progress = count;
          break;
        }

        case 'VIRAL_HERO': {
          const result = await this.prisma.shareLink.aggregate({
            where: {
              petitionId,
              referral: { referrerId: userId },
            },
            _sum: { conversions: true },
          });
          progress = result._sum.conversions || 0;
          break;
        }

        case 'NETWORK_BUILDER': {
          const recipients = await this.prisma.referral.findMany({
            where: { petitionId, referrerId: userId },
            distinct: ['refereeEmail'],
          });
          progress = recipients.length;
          break;
        }

        case 'INFLUENCER': {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });
          if (user) {
            const estimatedNetworkSize = Math.max(50, 150 + user.trustScore * 2);
            const conversions = await this.prisma.shareLink.aggregate({
              where: {
                petitionId,
                referral: { referrerId: userId },
              },
              _sum: { conversions: true },
            });
            progress = Math.round(
              ((conversions._sum.conversions || 0) / estimatedNetworkSize) * 100,
            );
          }
          break;
        }

        case 'STREAK_MASTER': {
          const shares = await this.prisma.shareLink.findMany({
            where: { petitionId, referral: { referrerId: userId } },
          });
          const dates = new Set(
            shares.map((s) => s.createdAt.toISOString().split('T')[0]),
          );
          progress = dates.size;
          break;
        }
      }

      return {
        badgeType,
        progress,
        target: typeof target === 'number' ? target : Math.round(target * 100),
        percentComplete: Math.min(100, Math.round((progress / target) * 100)),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get badge progress: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        badgeType,
        progress: 0,
        target: this.BADGE_CONDITIONS[badgeType].target as number,
        percentComplete: 0,
      };
    }
  }

  /**
   * Get badge leaderboard
   */
  async getBadgeLeaderboard(limit: number = 10): Promise<
    Array<{
      userId: string;
      badgeCount: number;
      totalMultiplier: number;
      topBadges: BadgeType[];
    }>
  > {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          badges: {
            orderBy: {
              multiplierBonus: 'desc',
            },
          },
        },
        take: limit,
      });

      return users
        .map((user) => ({
          userId: user.id,
          badgeCount: user.badges.length,
          totalMultiplier: user.badges.reduce(
            (sum, b) => sum * b.multiplierBonus,
            1,
          ),
          topBadges: [...new Set(user.badges.map((b) => b.badgeType))].slice(0, 5),
        }))
        .sort((a, b) => b.badgeCount - a.badgeCount || b.totalMultiplier - a.totalMultiplier)
        .slice(0, limit);
    } catch (error) {
      this.logger.error(
        `Failed to get badge leaderboard: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Get all badge descriptions
   */
  getBadgeDescriptions(): Record<BadgeType, { description: string; multiplier: number }> {
    const result: any = {};
    Object.entries(this.BADGE_CONDITIONS).forEach(([key, value]) => {
      result[key] = {
        description: value.description,
        multiplier: value.multiplier,
      };
    });
    return result;
  }
}
