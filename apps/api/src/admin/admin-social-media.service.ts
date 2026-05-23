import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FacebookSDKService } from '../facebook/facebook-sdk.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { GrowthService } from '../whatsapp/growth.service';

interface SocialMediaConfiguration {
  facebook: {
    appId: string;
    appSecret: string;
    pixelId: string;
    accessToken: string;
  };
  whatsapp: {
    apiToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookToken: string;
  };
}

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

  private async loadSocialMediaConfig(): Promise<SocialMediaConfiguration> {
    const keys = [
      'FACEBOOK_APP_ID',
      'FACEBOOK_APP_SECRET',
      'FACEBOOK_PIXEL_ID',
      'FACEBOOK_ACCESS_TOKEN',
      'WHATSAPP_API_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'WHATSAPP_WEBHOOK_TOKEN',
    ];

    const toggles = await this.prisma.featureToggle.findMany({
      where: { name: { in: keys } },
    });

    const byName = Object.fromEntries(toggles.map((toggle) => [toggle.name, toggle]));
    const resolve = (key: string): string =>
      byName[key]?.config ?? process.env[key] ?? '';

    return {
      facebook: {
        appId: resolve('FACEBOOK_APP_ID'),
        appSecret: resolve('FACEBOOK_APP_SECRET'),
        pixelId: resolve('FACEBOOK_PIXEL_ID'),
        accessToken: resolve('FACEBOOK_ACCESS_TOKEN'),
      },
      whatsapp: {
        apiToken: resolve('WHATSAPP_API_TOKEN'),
        phoneNumberId: resolve('WHATSAPP_PHONE_NUMBER_ID'),
        businessAccountId: resolve('WHATSAPP_BUSINESS_ACCOUNT_ID'),
        webhookToken: resolve('WHATSAPP_WEBHOOK_TOKEN'),
      },
    };
  }

  /**
   * Get Facebook SDK health and configuration status
   */
  async getFacebookHealth() {
    try {
      const config = await this.loadSocialMediaConfig();
      const configured = {
        appId: !!config.facebook.appId,
        appSecret: !!config.facebook.appSecret,
        pixelId: !!config.facebook.pixelId,
        accessToken: !!config.facebook.accessToken,
      };

      const hasAllConfig = Object.values(configured).every((v) => v);

      return {
        status: hasAllConfig ? 'healthy' : 'degraded',
        configured,
        pixelId: config.facebook.pixelId ? `${config.facebook.pixelId.substring(0, 8)}***` : 'NOT_SET',
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
      const config = await this.loadSocialMediaConfig();
      const configured = {
        apiToken: !!config.whatsapp.apiToken,
        phoneNumberId: !!config.whatsapp.phoneNumberId,
        businessAccountId: !!config.whatsapp.businessAccountId,
        webhookToken: !!config.whatsapp.webhookToken,
      };

      const hasAllConfig = Object.values(configured).every((v) => v);

      return {
        status: hasAllConfig ? 'healthy' : 'degraded',
        configured,
        phoneNumberId:
          config.whatsapp.phoneNumberId?.substring(0, 8) + '***' ||
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
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
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
