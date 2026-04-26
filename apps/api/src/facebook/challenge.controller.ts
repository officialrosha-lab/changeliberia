import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/challenges')
export class ChallengeController {
  private readonly logger = new Logger(ChallengeController.name);

  constructor(private challengeService: ChallengeService) {}

  /**
   * GET /challenges/active/:petitionId
   * Get active challenges for a petition
   * Public endpoint
   */
  @Get('active/:petitionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getActiveChallenges(@Param('petitionId') petitionId: string) {
    if (!petitionId) {
      throw new BadRequestException('petitionId is required');
    }

    try {
      const challenges = await this.challengeService.getActiveChallenges(
        petitionId,
      );

      return {
        success: true,
        data: {
          petitionId,
          challenges,
          count: challenges.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get active challenges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          petitionId,
          challenges: [],
          count: 0,
        },
      };
    }
  }

  /**
   * GET /challenges/user
   * Get user's challenge participation and progress
   * Requires JWT authentication
   */
  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserChallenges(@CurrentUser() user: any) {
    try {
      const challenges = await this.challengeService.getUserChallenges(
        user.id,
      );

      return {
        success: true,
        data: {
          userId: user.id,
          challenges,
          totalCount: challenges.length,
          completedCount: challenges.filter((c) => c.completed).length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user challenges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          userId: user.id,
          challenges: [],
          totalCount: 0,
          completedCount: 0,
        },
      };
    }
  }

  /**
   * POST /challenges/track-progress
   * Track user progress in a challenge
   * Requires JWT authentication
   */
  @Post('track-progress')
  @UseGuards(JwtAuthGuard)
  async trackProgress(
    @Body()
    progressData: {
      challengeId: string;
      increment?: number;
    },
    @CurrentUser() user: any,
  ) {
    const { challengeId, increment = 1 } = progressData;

    if (!challengeId) {
      throw new BadRequestException('challengeId is required');
    }

    if (increment < 1 || increment > 1000) {
      throw new BadRequestException('increment must be between 1 and 1000');
    }

    try {
      const progress = await this.challengeService.trackProgress(
        user.id,
        challengeId,
        increment,
      );

      this.logger.log(
        `Tracked progress for user ${user.id} in challenge ${challengeId}`,
      );

      return {
        success: true,
        data: progress,
      };
    } catch (error) {
      this.logger.error(
        `Failed to track progress: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Challenge ${challengeId} not found`);
    }
  }

  /**
   * GET /challenges/:challengeId/leaderboard
   * Get leaderboard for a specific challenge
   * Public endpoint
   */
  @Get(':challengeId/leaderboard')
  @UseGuards(OptionalJwtAuthGuard)
  async getChallengeLeaderboard(
    @Param('challengeId') challengeId: string,
    @Query('limit') limit?: string,
  ) {
    if (!challengeId) {
      throw new BadRequestException('challengeId is required');
    }

    try {
      const limitValue = limit ? parseInt(limit, 10) : 10;
      const leaderboard = await this.challengeService.getChallengeLeaderboard(
        challengeId,
        Math.min(limitValue, 100),
      );

      return {
        success: true,
        data: {
          challengeId,
          leaderboard,
          count: leaderboard.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get challenge leaderboard: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Challenge ${challengeId} not found`);
    }
  }

  /**
   * GET /challenges/user/history
   * Get completed challenges history for user
   * Requires JWT authentication
   */
  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  async getChallengeHistory(@CurrentUser() user: any) {
    try {
      const challenges = await this.challengeService.getUserChallenges(
        user.id,
      );

      const completedChallenges = challenges
        .filter((c) => c.completed)
        .sort((a, b) => {
          // Sort by recent first (would need completedAt in data)
          return 0;
        });

      return {
        success: true,
        data: {
          userId: user.id,
          completedChallenges,
          totalEarnings: completedChallenges.reduce(
            (sum, c) => sum + c.earnedBonus,
            0,
          ),
          count: completedChallenges.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get challenge history: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          userId: user.id,
          completedChallenges: [],
          totalEarnings: 0,
          count: 0,
        },
      };
    }
  }

  /**
   * POST /challenges/create
   * Create a custom campaign challenge
   * Admin only
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createChallenge(
    @Body()
    challengeData: {
      petitionId: string;
      title: string;
      goalValue: number;
      goalType: 'share_count' | 'conversion_count' | 'network_reach';
      startDate: string; // ISO date string
      endDate: string; // ISO date string
      rewardMultiplier?: number;
    },
    @CurrentUser() user: any,
  ) {
    const {
      petitionId,
      title,
      goalValue,
      goalType,
      startDate,
      endDate,
      rewardMultiplier = 3.0,
    } = challengeData;

    // Check admin role (would need to be implemented in decorator/guard)
    if (user.role !== 'admin') {
      throw new BadRequestException('Only admins can create challenges');
    }

    if (
      !petitionId ||
      !title ||
      !goalValue ||
      !goalType ||
      !startDate ||
      !endDate
    ) {
      throw new BadRequestException(
        'petitionId, title, goalValue, goalType, startDate, and endDate are required',
      );
    }

    if (rewardMultiplier < 1 || rewardMultiplier > 5) {
      throw new BadRequestException('rewardMultiplier must be between 1 and 5');
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        throw new BadRequestException('startDate must be before endDate');
      }

      const challenge = await this.challengeService.createCampaignChallenge(
        petitionId,
        title,
        goalValue,
        goalType,
        start,
        end,
        rewardMultiplier,
      );

      this.logger.log(
        `Admin ${user.id} created campaign challenge ${challenge.id}`,
      );

      return {
        success: true,
        data: challenge,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create challenge: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException(`Petition ${petitionId} not found`);
    }
  }

  /**
   * GET /challenges/petition/:petitionId/summary
   * Get challenge summary for a petition
   * Public endpoint
   */
  @Get('petition/:petitionId/summary')
  @UseGuards(OptionalJwtAuthGuard)
  async getPetitionChallengeSummary(
    @Param('petitionId') petitionId: string,
  ) {
    if (!petitionId) {
      throw new BadRequestException('petitionId is required');
    }

    try {
      const challenges = await this.challengeService.getActiveChallenges(
        petitionId,
      );

      const totalRewards = challenges.reduce(
        (sum, c) => sum + c.rewardMultiplier,
        0,
      );

      return {
        success: true,
        data: {
          petitionId,
          activeChallenges: challenges.length,
          totalParticipants: challenges.reduce(
            (sum, c) => sum + c.participantCount,
            0,
          ),
          maxRewardMultiplier: Math.max(
            ...challenges.map((c) => c.rewardMultiplier),
            1,
          ),
          challenges,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get challenge summary: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          petitionId,
          activeChallenges: 0,
          totalParticipants: 0,
          maxRewardMultiplier: 1,
          challenges: [],
        },
      };
    }
  }
}
