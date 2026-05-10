import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FacebookSDKService } from '../facebook/facebook-sdk.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { GrowthService } from '../whatsapp/growth.service';

/**
 * Admin Social Media Service
 * Provides admin endpoints for monitoring and managing Facebook and WhatsApp integrations
 */
@Injectable()
export class AdminSocialMediaService {
  private readonly logger = new Logger(AdminSocialMediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookSdk: FacebookSDKService,
    private readonly whatsapp: WhatsAppService,
    private readonly growth: GrowthService,
  ) {}

  /**
   * Get Facebook SDK health and configuration status
   */
  async getFacebookHealth() {
    try {
      const config = {
        appId: !!process.env.FACEBOOK_APP_ID,
        appSecret: !!process.env.FACEBOOK_APP_SECRET,
        pixelId: !!process.env.FACEBOOK_PIXEL_ID,
        accessToken: !!process.env.FACEBOOK_ACCESS_TOKEN,
      };

      const hasAllConfig = Object.values(config).every((v) => v);

      return {
        status: hasAllConfig ? 'healthy' : 'degraded',
        configured: config,
        pixelId: process.env.FACEBOOK_PIXEL_ID?.substring(0, 8) + '***' || 'NOT_SET',
      };
    } catch (error) {
      this.logger.error('Facebook health check failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get WhatsApp service health and configuration status
   */
  async getWhatsAppHealth() {
    try {
      const config = {
        apiToken: !!process.env.WHATSAPP_API_TOKEN,
        phoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        webhookToken: !!process.env.WHATSAPP_WEBHOOK_TOKEN,
      };

      const hasAllConfig = Object.values(config).every((v) => v);

      return {
        status: hasAllConfig ? 'healthy' : 'degraded',
        configured: config,
        phoneNumberId:
          process.env.WHATSAPP_PHONE_NUMBER_ID?.substring(0, 8) + '***' ||
          'NOT_SET',
      };
    } catch (error) {
      this.logger.error('WhatsApp health check failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get WhatsApp viral growth metrics
   */
  async getWhatsAppGrowthMetrics(days: number = 30) {
    try {
      const referrals = await this.prisma.referral.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
      });

      const trendingPetitions = await this.growth.getTrendingPetitions(10);

      const metrics = {
        totalReferrals: referrals.length,
        convertedReferrals: referrals.filter(
          (r) => r.status === 'CONVERTED',
        ).length,
        conversionRate:
          referrals.length > 0
            ? (
                (referrals.filter((r) => r.status === 'CONVERTED').length /
                  referrals.length) *
                100
              ).toFixed(2) + '%'
            : '0%',
        fraudBlockedReferrals: referrals.filter(
          (r) => r.status === 'FRAUD_BLOCKED',
        ).length,
        trendingPetitions: trendingPetitions.slice(0, 5),
        period: `${days} days`,
      };

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get WhatsApp growth metrics:', error);
      throw error;
    }
  }

  /**
   * Get Facebook pixel event statistics
   */
  async getFacebookPixelStats(days: number = 30) {
    try {
      const events = await this.prisma.facebookPixelEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
      });

      const eventCounts = events.reduce(
        (acc, event) => {
          acc[event.eventName] = (acc[event.eventName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalEvents: events.length,
        uniqueEvents: Object.keys(eventCounts).length,
        eventBreakdown: eventCounts,
        period: `${days} days`,
      };
    } catch (error) {
      this.logger.error('Failed to get Facebook pixel stats:', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp campaign statistics
   */
  async getWhatsAppCampaignStats() {
    try {
      // Get all referrals grouped by status
      const referrals = await this.prisma.referral.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      // Get referrals by petition
      const petitionStats = await this.prisma.referral.groupBy({
        by: ['petitionId'],
        _count: {
          id: true,
        },
        take: 10,
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return {
        statusBreakdown: Object.fromEntries(
          referrals.map((r) => [r.status, r._count.id]),
        ),
        topPetitions: petitionStats.length,
        totalCampaigns: (
          await this.prisma.petition.count({
            where: { donationsEnabled: true },
          })
        ),
      };
    } catch (error) {
      this.logger.error('Failed to get WhatsApp campaign stats:', error);
      throw error;
    }
  }

  /**
   * Get social media integration dashboard overview
   */
  async getSocialMediaDashboard() {
    const [facebookHealth, whatsappHealth, growthMetrics, pixelStats] =
      await Promise.all([
        this.getFacebookHealth(),
        this.getWhatsAppHealth(),
        this.getWhatsAppGrowthMetrics(30),
        this.getFacebookPixelStats(30),
      ]);

    return {
      facebook: facebookHealth,
      whatsapp: whatsappHealth,
      metrics: {
        growth: growthMetrics,
        pixelEvents: pixelStats,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}
