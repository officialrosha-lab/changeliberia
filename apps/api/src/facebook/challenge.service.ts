import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeStatus, ChallengePeriod } from '@prisma/client';

@Injectable()
export class ChallengeService {
  private readonly logger = new Logger(ChallengeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a weekly challenge for a petition
   * Auto-triggered every Monday for the upcoming week
   */
  async createWeeklyChallenge(
    petitionId: string,
    goalValue: number = 10,
  ): Promise<{
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    goalValue: number;
  }> {
    try {
      // Calculate Monday-Sunday for current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;

      const startDate = new Date(now);
      startDate.setDate(now.getDate() + (1 - dayOfWeek === 1 ? 0 : daysToMonday));
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException(`Petition ${petitionId} not found`);
      }

      const challenge = await this.prisma.shareChallenge.create({
        data: {
          petitionId,
          title: `Weekly Share Challenge: ${petition.title}`,
          description: `Share this petition ${goalValue} times to earn 2x Trust Bonus!`,
          period: ChallengePeriod.WEEKLY,
          startDate,
          endDate,
          status: ChallengeStatus.ACTIVE,
          goalType: 'share_count',
          goalValue,
          rewardMultiplier: 2.0,
          metadata: JSON.stringify({
            autoCreated: true,
            week: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          }),
        },
      });

      this.logger.log(
        `Created weekly challenge ${challenge.id} for petition ${petitionId}`,
      );

      return {
        id: challenge.id,
        title: challenge.title,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        goalValue: challenge.goalValue,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create weekly challenge: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Create a custom campaign challenge
   */
  async createCampaignChallenge(
    petitionId: string,
    title: string,
    goalValue: number,
    goalType: 'share_count' | 'conversion_count' | 'network_reach',
    startDate: Date,
    endDate: Date,
    rewardMultiplier: number = 3.0,
  ): Promise<{
    id: string;
    title: string;
    goalValue: number;
  }> {
    try {
      const petition = await this.prisma.petition.findUnique({
        where: { id: petitionId },
      });

      if (!petition) {
        throw new NotFoundException(`Petition ${petitionId} not found`);
      }

      const challenge = await this.prisma.shareChallenge.create({
        data: {
          petitionId,
          title,
          period: ChallengePeriod.CAMPAIGN,
          startDate,
          endDate,
          status: ChallengeStatus.ACTIVE,
          goalType,
          goalValue,
          rewardMultiplier,
        },
      });

      this.logger.log(
        `Created campaign challenge ${challenge.id}: ${title}`,
      );

      return {
        id: challenge.id,
        title: challenge.title,
        goalValue: challenge.goalValue,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create campaign challenge: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Track a user's progress in a challenge
   */
  async trackProgress(
    userId: string,
    challengeId: string,
    progressIncrement: number = 1,
  ): Promise<{
    progress: number;
    goalValue: number;
    completed: boolean;
    percentComplete: number;
  }> {
    try {
      const challenge = await this.prisma.shareChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge) {
        throw new NotFoundException(`Challenge ${challengeId} not found`);
      }

      // Get or create membership
      let membership = await this.prisma.challengeMembership.findUnique({
        where: {
          userId_challengeId: {
            userId,
            challengeId,
          },
        },
      });

      if (!membership) {
        membership = await this.prisma.challengeMembership.create({
          data: {
            userId,
            challengeId,
            progress: progressIncrement,
          },
        });
      } else {
        membership = await this.prisma.challengeMembership.update({
          where: {
            userId_challengeId: {
              userId,
              challengeId,
            },
          },
          data: {
            progress: {
              increment: progressIncrement,
            },
          },
        });
      }

      // Check if completed
      let completed = false;
      if (membership.progress >= challenge.goalValue && !membership.completed) {
        membership = await this.prisma.challengeMembership.update({
          where: {
            userId_challengeId: {
              userId,
              challengeId,
            },
          },
          data: {
            completed: true,
            completedAt: new Date(),
            earnedBonus: challenge.rewardMultiplier,
          },
        });
        completed = true;

        // Update challenge completion count
        await this.prisma.shareChallenge.update({
          where: { id: challengeId },
          data: {
            completions: {
              increment: 1,
            },
          },
        });

        this.logger.log(
          `User ${userId} completed challenge ${challengeId}`,
        );
      }

      const percentComplete = Math.min(
        100,
        Math.round((membership.progress / challenge.goalValue) * 100),
      );

      return {
        progress: membership.progress,
        goalValue: challenge.goalValue,
        completed,
        percentComplete,
      };
    } catch (error) {
      this.logger.error(
        `Failed to track progress: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get active challenges for a petition
   */
  async getActiveChallenges(
    petitionId: string,
  ): Promise<
    Array<{
      id: string;
      title: string;
      goalValue: number;
      goalType: string;
      daysRemaining: number;
      rewardMultiplier: number;
      participantCount: number;
    }>
  > {
    try {
      const now = new Date();

      const challenges = await this.prisma.shareChallenge.findMany({
        where: {
          petitionId,
          status: ChallengeStatus.ACTIVE,
          endDate: {
            gte: now,
          },
        },
        include: {
          memberships: {
            select: { id: true },
          },
        },
        orderBy: {
          endDate: 'asc',
        },
      });

      return challenges.map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        goalValue: challenge.goalValue,
        goalType: challenge.goalType,
        daysRemaining: Math.ceil(
          (challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
        rewardMultiplier: challenge.rewardMultiplier,
        participantCount: challenge.memberships.length,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get active challenges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Get user's challenge participation and progress
   */
  async getUserChallenges(userId: string): Promise<
    Array<{
      challengeId: string;
      title: string;
      progress: number;
      goalValue: number;
      percentComplete: number;
      completed: boolean;
      daysRemaining: number;
      earnedBonus: number;
    }>
  > {
    try {
      const now = new Date();

      const memberships = await this.prisma.challengeMembership.findMany({
        where: { userId },
        include: {
          challenge: true,
        },
        orderBy: {
          challenge: {
            endDate: 'asc',
          },
        },
      });

      return memberships.map((m) => ({
        challengeId: m.challengeId,
        title: m.challenge.title,
        progress: m.progress,
        goalValue: m.challenge.goalValue,
        percentComplete: Math.min(
          100,
          Math.round((m.progress / m.challenge.goalValue) * 100),
        ),
        completed: m.completed,
        daysRemaining: Math.ceil(
          (m.challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
        earnedBonus: m.earnedBonus,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get user challenges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(
    challengeId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      userId: string;
      progress: number;
      percentComplete: number;
      rank: number;
      completed: boolean;
    }>
  > {
    try {
      const challenge = await this.prisma.shareChallenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge) {
        throw new NotFoundException(`Challenge ${challengeId} not found`);
      }

      const memberships = await this.prisma.challengeMembership.findMany({
        where: { challengeId },
        orderBy: {
          progress: 'desc',
        },
        take: limit,
      });

      return memberships.map((m, index) => ({
        userId: m.userId,
        progress: m.progress,
        percentComplete: Math.min(
          100,
          Math.round((m.progress / challenge.goalValue) * 100),
        ),
        rank: index + 1,
        completed: m.completed,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get challenge leaderboard: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Apply challenge completion multiplier
   */
  async applyChallengeMultiplier(
    userId: string,
    baseBonus: number,
  ): Promise<number> {
    try {
      // Get all completed challenges for this user
      const completions = await this.prisma.challengeMembership.findMany({
        where: {
          userId,
          completed: true,
        },
        include: {
          challenge: true,
        },
      });

      if (completions.length === 0) {
        return baseBonus;
      }

      // Stack multipliers (max 5x total)
      let totalMultiplier = 1.0;
      completions.forEach((c) => {
        totalMultiplier *= c.challenge.rewardMultiplier;
      });

      const finalMultiplier = Math.min(5, totalMultiplier);
      return Math.floor(baseBonus * finalMultiplier);
    } catch (error) {
      this.logger.error(
        `Failed to apply challenge multiplier: ${error instanceof Error ? error.message : String(error)}`,
      );
      return baseBonus;
    }
  }

  /**
   * Auto-complete challenges that have reached goal
   */
  async autoCompleteReachedGoals(userId: string): Promise<string[]> {
    try {
      const memberships = await this.prisma.challengeMembership.findMany({
        where: {
          userId,
          completed: false,
        },
        include: {
          challenge: true,
        },
      });

      const completed: string[] = [];

      for (const m of memberships) {
        if (m.progress >= m.challenge.goalValue) {
          await this.prisma.challengeMembership.update({
            where: {
              userId_challengeId: {
                userId,
                challengeId: m.challengeId,
              },
            },
            data: {
              completed: true,
              completedAt: new Date(),
              earnedBonus: m.challenge.rewardMultiplier,
            },
          });

          await this.prisma.shareChallenge.update({
            where: { id: m.challengeId },
            data: {
              completions: {
                increment: 1,
              },
            },
          });

          completed.push(m.challengeId);
          this.logger.log(
            `Auto-completed challenge ${m.challengeId} for user ${userId}`,
          );
        }
      }

      return completed;
    } catch (error) {
      this.logger.error(
        `Failed to auto-complete challenges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Clean up expired challenges
   */
  async cleanupExpiredChallenges(): Promise<number> {
    try {
      const now = new Date();

      const result = await this.prisma.shareChallenge.updateMany({
        where: {
          endDate: {
            lt: now,
          },
          status: ChallengeStatus.ACTIVE,
        },
        data: {
          status: ChallengeStatus.COMPLETED,
        },
      });

      this.logger.log(`Completed ${result.count} expired challenges`);
      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired challenges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}
