import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Get conversion funnel for a petition
   */
  @Get('funnel/:petitionId')
  async getConversionFunnel(
    @Param('petitionId') petitionId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
      throw new BadRequestException('Invalid date format');
    }

    const funnel = await this.analytics.getConversionFunnel(
      petitionId,
      start,
      end,
    );

    return {
      success: true,
      data: funnel,
    };
  }

  /**
   * Get metrics for a specific petition
   */
  @Get('petition/:petitionId')
  async getPetitionMetrics(@Param('petitionId') petitionId: string) {
    const metrics = await this.analytics.getPetitionMetrics(petitionId);

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get user engagement metrics
   */
  @Get('user/:userId')
  async getUserEngagementMetrics(@Param('userId') userId: string) {
    const metrics = await this.analytics.getUserEngagementMetrics(userId);

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get share analytics for a petition
   */
  @Get('shares/:petitionId')
  async getShareMetrics(@Param('petitionId') petitionId: string) {
    const metrics = await this.analytics.getShareMetrics(petitionId);

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get donation analytics
   */
  @Get('donations')
  async getDonationMetrics(@Query('petitionId') petitionId?: string) {
    const metrics = await this.analytics.getDonationMetrics(petitionId);

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get dashboard overview
   */
  @Get('dashboard/overview')
  async getDashboardOverview() {
    const overview = await this.analytics.getDashboardOverview();

    return {
      success: true,
      data: overview,
    };
  }

  /**
   * Get audience insights from Facebook custom audiences
   */
  @Get('audience/:petitionId')
  async getAudienceInsights(@Param('petitionId') petitionId: string) {
    const insights = await this.analytics.getAudienceInsights(petitionId);

    return {
      success: true,
      data: insights,
    };
  }

  /**
   * Get peak activity hours
   */
  @Get('activity/peak')
  async getPeakActivity(
    @Query('petitionId') petitionId?: string,
    @Query('days') days: string = '30',
  ) {
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1) {
      throw new BadRequestException('Days must be a positive number');
    }

    const activity = await this.analytics.getPeakActivity(petitionId, daysNum);

    return {
      success: true,
      data: activity,
    };
  }

  /**
   * Get trending petitions
   */
  @Get('trending')
  async getTrendingPetitions(@Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException(
        'Limit must be a number between 1 and 100',
      );
    }

    const petitions = await this.analytics.getTrendingPetitions(limitNum);

    return {
      success: true,
      data: petitions,
    };
  }

  /**
   * Export petition analytics as CSV
   * Admin only
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('export/petition/:petitionId')
  async exportPetitionAnalytics(@Param('petitionId') petitionId: string) {
    const csv = await this.analytics.exportPetitionAnalytics(petitionId);

    return {
      success: true,
      data: csv,
      filename: `petition-${petitionId}-analytics.csv`,
    };
  }

  // ── Platform-wide admin analytics (admin only) ───────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('platform-stats')
  getPlatformStats(@Query('days') days = '30') {
    return this.analytics.getPlatformStats(Math.max(1, Number(days) || 30));
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('daily-metrics')
  getDailyMetrics(@Query('days') days = '30') {
    return this.analytics.getDailyMetrics(Math.max(1, Number(days) || 30));
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('category-stats')
  getCategoryStats(@Query('days') days = '30') {
    return this.analytics.getCategoryStats(Math.max(1, Number(days) || 30));
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('fraud-stats')
  getFraudStats(@Query('days') days = '30') {
    return this.analytics.getFraudStats(Math.max(1, Number(days) || 30));
  }
}
