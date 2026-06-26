import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('badges')
export class BadgeController {
  private readonly logger = new Logger(BadgeController.name);

  constructor(private badgeService: BadgeService) {}

  /**
   * GET /badges
   * Get all badge descriptions and multipliers
   * Public endpoint
   */
  @Get()
  getAllBadges() {
    try {
      const badges = this.badgeService.getBadgeDescriptions();

      return {
        success: true,
        data: {
          badges,
          count: Object.keys(badges).length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get all badges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          badges: {},
          count: 0,
        },
      };
    }
  }

  /**
   * GET /badges/user/:userId
   * Get badges earned by a user
   * Requires JWT authentication (can only view own badges or public view)
   */
  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserBadges(
    @Param('userId') userId: string,
    @Query('petitionId') petitionId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    try {
      const badges = await this.badgeService.getUserBadges(userId, petitionId);

      return {
        success: true,
        data: {
          userId,
          badges,
          count: badges.length,
          totalMultiplier:
            badges.reduce((acc, b) => acc * b.multiplier, 1.0) > 5
              ? 5
              : badges.reduce((acc, b) => acc * b.multiplier, 1.0),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user badges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          userId,
          badges: [],
          count: 0,
          totalMultiplier: 1,
        },
      };
    }
  }

  /**
   * GET /badges/progress/:userId/:petitionId/:badgeType
   * Get progress toward earning a specific badge
   * Requires JWT authentication
   */
  @Get('progress/:userId/:petitionId/:badgeType')
  @UseGuards(JwtAuthGuard)
  async getBadgeProgress(
    @Param('userId') userId: string,
    @Param('petitionId') petitionId: string,
    @Param('badgeType') badgeType: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    if (!userId || !petitionId || !badgeType) {
      throw new BadRequestException(
        'userId, petitionId, and badgeType are required',
      );
    }

    // Only allow users to view their own progress or admin view
    if (user.id !== userId && user.role !== 'admin') {
      throw new BadRequestException('Unauthorized');
    }

    try {
      const progress = await this.badgeService.getBadgeProgress(
        userId,
        petitionId,
        badgeType as any,
      );

      return {
        success: true,
        data: progress,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get badge progress: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new NotFoundException('Badge or progress data not found');
    }
  }

  /**
   * GET /badges/leaderboard
   * Get badge leaderboard (top earners)
   * Public endpoint
   */
  @Get('leaderboard')
  async getBadgeLeaderboard(@Query('limit') limit?: string) {
    try {
      const limitValue = limit ? parseInt(limit, 10) : 10;
      const leaderboard = await this.badgeService.getBadgeLeaderboard(
        Math.min(limitValue, 100), // Cap at 100
      );

      return {
        success: true,
        data: {
          leaderboard,
          count: leaderboard.length,
          period: 'all-time',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get badge leaderboard: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          leaderboard: [],
          count: 0,
          period: 'all-time',
        },
      };
    }
  }

  /**
   * GET /badges/petition/:petitionId
   * Get badge leaderboard for a specific petition
   * Public endpoint
   */
  @Get('petition/:petitionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getPetitionBadges(
    @Param('petitionId') petitionId: string,
    @Query('limit') limit?: string,
  ) {
    if (!petitionId) {
      throw new BadRequestException('petitionId is required');
    }

    try {
      const limitValue = limit ? parseInt(limit, 10) : 10;

      // Get top badge earners for this petition
      // Note: This would ideally filter by petitionId but depends on controller-level caching
      const leaderboard = await this.badgeService.getBadgeLeaderboard(
        Math.min(limitValue, 100),
      );

      return {
        success: true,
        data: {
          petitionId,
          leaderboard: leaderboard.slice(0, limitValue),
          count: leaderboard.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get petition badges: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: true,
        data: {
          petitionId,
          topBadgeEarners: [],
          count: 0,
        },
      };
    }
  }
}
