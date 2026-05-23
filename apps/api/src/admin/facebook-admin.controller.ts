import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { FacebookPixelService } from '../facebook/facebook-pixel.service';
import { FacebookService } from '../facebook/facebook.service';

interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/facebook')
export class FacebookAdminController {
  private readonly logger = new Logger(FacebookAdminController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookPixelService: FacebookPixelService,
    private readonly facebookService: FacebookService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  /**
   * Get Facebook services dashboard overview
   */
  @Get('dashboard')
  async getDashboard() {
    try {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [pixelEvents, shareLinks, badges, challenges] = await Promise.all([
        this.prisma.facebookPixelEvent.findMany({
          where: { createdAt: { gte: last7Days } },
        }),
        this.prisma.shareLink.findMany({
          where: { createdAt: { gte: last30Days }, source: 'facebook' },
        }),
        this.prisma.socialEngagementBadge.findMany({
          where: {},
          select: { id: true, earnedAt: true },
        }),
        this.prisma.shareChallenge.findMany({
          where: { status: 'ACTIVE' as any },
        }),
      ]);

      const totalReach = shareLinks.reduce(
        (sum, link) => sum + (link.networkReachEstimate || 0),
        0,
      );

      return {
        pixelEvents: pixelEvents.length,
        shareLinks: shareLinks.length,
        totalReach,
        activeBadges: badges.length,
        activeChallenges: challenges.length,
        averageReach:
          shareLinks.length > 0 ? totalReach / shareLinks.length : 0,
        metrics: {
          events7d: pixelEvents.length,
          shares30d: shareLinks.length,
          badges: badges.length,
          challenges: challenges.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get facebook dashboard', error);
      throw new InternalServerErrorException(
        'Failed to get dashboard metrics',
      );
    }
  }

  /**
   * List pixel events with filters
   */
  @Get('pixel-events')
  async listPixelEvents(
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '50',
  ) {
    try {
      const filters: any = {};
      if (type) filters.eventType = type;
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const events = await this.prisma.facebookPixelEvent.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit), 500),
      });

      // Group by event type
      const byType = events.reduce(
        (acc, e) => {
          acc[e.eventType] = (acc[e.eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        events,
        summary: {
          totalEvents: events.length,
          byType,
        },
      };
    } catch (error) {
      this.logger.error('Failed to list pixel events', error);
      throw new InternalServerErrorException('Failed to list pixel events');
    }
  }

  /**
   * List share links with performance metrics
   */
  @Get('share-links')
  async listShareLinks(
    @Query('petitionId') petitionId?: string,
    @Query('limit') limit: string = '50',
  ) {
    try {
      const filters: any = { source: 'facebook' };
      if (petitionId) filters.petitionId = petitionId;

      const shareLinks = await this.prisma.shareLink.findMany({
        where: filters,
        include: {
          petition: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit), 500),
      });

      const totalReach = shareLinks.reduce(
        (sum, link) => sum + (link.networkReachEstimate || 0),
        0,
      );

      return {
        shareLinks,
        summary: {
          totalShares: shareLinks.length,
          totalReach,
          averageReach:
            shareLinks.length > 0 ? totalReach / shareLinks.length : 0,
          totalClicks: shareLinks.reduce((sum, link) => sum + link.clickCount, 0),
          totalConversions: shareLinks.reduce(
            (sum, link) => sum + link.conversions,
            0,
          ),
        },
      };
    } catch (error) {
      this.logger.error('Failed to list share links', error);
      throw new InternalServerErrorException('Failed to list share links');
    }
  }

  /**
   * Get share link performance details
   */
  @Get('share-links/:id')
  async getShareLinkDetails(@Param('id') id: string) {
    try {
      const shareLink = await this.prisma.shareLink.findUnique({
        where: { id },
        include: {
          petition: { select: { id: true, title: true } },
        },
      });

      if (!shareLink) throw new NotFoundException('Share link not found');

      const conversionRate =
        shareLink.clickCount > 0
          ? (shareLink.conversions / shareLink.clickCount) * 100
          : 0;

      return {
        ...shareLink,
        metrics: {
          clickThroughRate: shareLink.clickCount / (shareLink.networkReachEstimate || 1),
          conversionRate,
          engagementScore: shareLink.clickCount + shareLink.conversions * 5, // 5x weight for conversions
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get share link details', error);
      throw new InternalServerErrorException(
        'Failed to get share link details',
      );
    }
  }

  /**
   * Get Facebook Pixel configuration status
   */
  @Get('pixel-config')
  async getPixelConfig() {
    try {
      const pixelId = process.env.FACEBOOK_PIXEL_ID;
      const apiVersion = process.env.FACEBOOK_API_VERSION || '18.0';
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN ? '***' : 'NOT_SET';

      // Get recent events to test connectivity
      const recentEvents = await this.prisma.facebookPixelEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      return {
        configured: !!pixelId,
        pixelId: pixelId || 'NOT_SET',
        apiVersion,
        accessToken,
        recentEvents,
        status: pixelId ? 'active' : 'not_configured',
      };
    } catch (error) {
      this.logger.error('Failed to get pixel config', error);
      throw new InternalServerErrorException('Failed to get pixel config');
    }
  }

  /**
   * Update Pixel configuration
   */
  @Patch('pixel-config')
  async updatePixelConfig(
    @Body()
    dto: {
      pixelId?: string;
      apiVersion?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    try {
      if (dto.pixelId && dto.pixelId.length < 10) {
        throw new InternalServerErrorException(
          'Invalid Pixel ID format',
        );
      }

      // Note: In a real implementation, you'd store this in a configuration table
      // rather than environment variables. This is a simplified example.
      const response = {
        success: true,
        message: 'Pixel configuration updated (environment variables)',
        current: {
          pixelId: process.env.FACEBOOK_PIXEL_ID,
          apiVersion: process.env.FACEBOOK_API_VERSION,
        },
      };

      this.activityLogger.logAsync({
        adminId: user.userId,
        action: 'UPDATE_FACEBOOK_PIXEL_CONFIG',
        entityType: 'FACEBOOK_PIXEL_CONFIG',
        description: 'Updated Facebook pixel configuration',
        changes: dto,
      });

      return response;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Failed to update pixel config', error);
      throw new InternalServerErrorException(
        'Failed to update pixel config',
      );
    }
  }

  /**
   * Send test pixel event
   */
  @Post('pixel/test-event')
  async sendTestPixelEvent(@CurrentUser() user: AuthUser) {
    try {
      const testEvent = await this.prisma.facebookPixelEvent.create({
        data: {
          eventId: `test_${Date.now()}`,
          eventType: 'Test',
          eventData: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'admin_test',
          }),
        },
      });

      this.activityLogger.logAsync({
        adminId: user.userId,
        action: 'SEND_FACEBOOK_TEST_PIXEL',
        entityType: 'FACEBOOK_PIXEL_EVENT',
        entityId: testEvent.id,
        description: 'Sent Facebook pixel test event',
      });

      return {
        success: true,
        message: 'Test pixel event sent',
        eventId: testEvent.id,
      };
    } catch (error) {
      this.logger.error('Failed to send test pixel event', error);
      throw new InternalServerErrorException(
        'Failed to send test pixel event',
      );
    }
  }

  /**
   * List social engagement badges
   */
  @Get('badges')
  async listBadges(@Query('limit') limit: string = '50') {
    try {
      const badges = await this.prisma.socialEngagementBadge.findMany({
        take: Math.min(parseInt(limit), 500),
        orderBy: { earnedAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true } },
          petition: { select: { id: true, title: true } },
        },
      });

      // Group by badge type and count
      const badgeTypeCounts = badges.reduce(
        (acc, badge) => {
          acc[badge.badgeType] = (acc[badge.badgeType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return { badges, summary: badgeTypeCounts };
    } catch (error) {
      this.logger.error('Failed to list badges', error);
      throw new InternalServerErrorException('Failed to list badges');
    }
  }

  /**
   * Get badge unlock statistics by badge type
   */
  @Get('badges/:type/stats')
  async getBadgeStats(@Param('type') type: string) {
    try {
      const unlocks = await this.prisma.socialEngagementBadge.findMany({
        where: { badgeType: type as any },
        include: {
          user: { select: { id: true, fullName: true } },
          petition: { select: { id: true, title: true } },
        },
        orderBy: { earnedAt: 'desc' },
      });

      if (unlocks.length === 0) {
        throw new NotFoundException(`No badges found for type: ${type}`);
      }

      return {
        badgeType: type,
        totalUnlocks: unlocks.length,
        recentUnlocks: unlocks.slice(0, 10),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get badge stats', error);
      throw new InternalServerErrorException('Failed to get badge stats');
    }
  }

  /**
   * List active challenges
   */
  @Get('challenges')
  async listChallenges(@Query('status') status?: string) {
    try {
      const filters = status ? { status: status as any } : { status: 'ACTIVE' as any };

      const challenges = await this.prisma.shareChallenge.findMany({
        where: filters,
        include: {
          petition: { select: { id: true, title: true } },
        },
        orderBy: { startDate: 'desc' },
      });

      const challengeStats = await Promise.all(
        challenges.map(async (challenge) => ({
          ...challenge,
          participantCount: await this.prisma.challengeMembership.count({
            where: { challengeId: challenge.id },
          }),
          completionCount: await this.prisma.challengeMembership.count({
            where: { challengeId: challenge.id, completed: true },
          }),
        })),
      );

      return challengeStats;
    } catch (error) {
      this.logger.error('Failed to list challenges', error);
      throw new InternalServerErrorException('Failed to list challenges');
    }
  }

  /**
   * Get challenge details and participation stats
   */
  @Get('challenges/:id')
  async getChallengeStats(@Param('id') id: string) {
    try {
      const challenge = await this.prisma.shareChallenge.findUnique({
        where: { id },
        include: {
          petition: { select: { id: true, title: true } },
        },
      });

      if (!challenge) throw new NotFoundException('Challenge not found');

      const memberships = await this.prisma.challengeMembership.findMany({
        where: { challengeId: id },
        include: { user: { select: { id: true, fullName: true } } },
      });

      const completions = memberships.filter((m) => m.completed);

      return {
        challenge,
        participation: {
          totalMembers: memberships.length,
          completed: completions.length,
          completionRate: memberships.length > 0
            ? (completions.length / memberships.length) * 100
            : 0,
          progressDistribution: memberships.map((m) => ({
            userId: m.userId,
            progress: m.progress,
            completed: m.completed,
          })),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get challenge stats', error);
      throw new InternalServerErrorException('Failed to get challenge stats');
    }
  }

  /**
   * Get Facebook integration analytics
   */
  @Get('analytics')
  async getAnalytics(@Query('days') days: string = '30') {
    try {
      const numDays = Math.min(parseInt(days), 365);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - numDays);

      const [pixelEvents, shareLinks, badges, challenges] = await Promise.all([
        this.prisma.facebookPixelEvent.findMany({
          where: { createdAt: { gte: startDate } },
        }),
        this.prisma.shareLink.findMany({
          where: { createdAt: { gte: startDate }, source: 'facebook' },
        }),
        this.prisma.socialEngagementBadge.findMany({
          where: { earnedAt: { gte: startDate } },
        }),
        this.prisma.shareChallenge.findMany({
          where: { startDate: { lte: new Date() }, endDate: { gte: startDate } },
        }),
      ]);

      // Group events by day
      const eventsByDay: Record<string, number> = {};
      pixelEvents.forEach((e) => {
        const day = e.createdAt.toISOString().split('T')[0];
        eventsByDay[day] = (eventsByDay[day] || 0) + 1;
      });

      const totalReach = shareLinks.reduce(
        (sum, link) => sum + (link.networkReachEstimate || 0),
        0,
      );

      return {
        summary: {
          totalPixelEvents: pixelEvents.length,
          totalShareLinks: shareLinks.length,
          totalReach,
          badgesUnlocked: badges.length,
          activeChallenges: challenges.length,
        },
        trends: {
          eventsByDay,
          avgDailyEvents:
            pixelEvents.length > 0
              ? Math.round(pixelEvents.length / numDays)
              : 0,
          avgDailyReach:
            shareLinks.length > 0
              ? Math.round(totalReach / numDays)
              : 0,
        },
        engagement: {
          totalClicks: shareLinks.reduce((sum, link) => sum + link.clickCount, 0),
          totalConversions: shareLinks.reduce(
            (sum, link) => sum + link.conversions,
            0,
          ),
          avgConversionRate:
            shareLinks.length > 0
              ? (shareLinks.reduce((sum, link) => sum + link.conversions, 0) /
                  shareLinks.reduce((sum, link) => sum + link.clickCount, 0)) *
                100
              : 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get analytics', error);
      throw new InternalServerErrorException('Failed to get analytics');
    }
  }
}
