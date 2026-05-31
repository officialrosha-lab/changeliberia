import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../events/event-bus.service';
import { FacebookShareCreatedEvent } from '../events/domain-events';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly LIBERIA_AVG_NETWORK_SIZE = 250; // Conservative estimate
  private readonly CONVERSION_RATE_BASELINE = 0.12; // ~12% baseline conversion

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Generate Open Graph metadata for a petition
   * Used for Facebook previews when shared
   */
  async generateOpenGraphMeta(petitionId: string): Promise<{
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  }> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: { creator: true },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    const progressPercent = Math.min(
      100,
      Math.round((petition.signaturesCount / petition.goal) * 100),
    );

    const ogImage = petition.imageUrl || 'https://changelib.org/og-default.png';
    const ogTitle = `${petition.title} - ${progressPercent}% of ${petition.goal} signatures`;
    const ogDescription = `${petition.summary || petition.description.substring(0, 160)}...`;
    const ogUrl = `https://changelib.org/petitions/${petitionId}`;

    return {
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      url: ogUrl,
      type: 'website',
    };
  }

  /**
   * Create a Facebook share link with tracking
   */
  async createFacebookShareLink(
    petitionId: string,
    userId: string,
  ): Promise<{
    shareUrl: string;
    shortCode: string;
    reachEstimate: number;
    prefilledMessage: string;
  }> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Generate unique short code for tracking
    const shortCode = this.generateShortCode();
    const shareUrl = `https://changelib.org/r/${shortCode}`;

    // Create ShareLink record
    const shareLink = await this.prisma.shareLink.create({
      data: {
        shortCode,
        targetUrl: `https://changelib.org/petitions/${petitionId}`,
        petitionId,
        source: 'facebook',
        medium: 'social',
        campaign: 'user_share',
        shareDialogUsed: true,
      },
    });

    // Calculate reach estimate
    const reachEstimate = this.estimateNetworkReach(user);

    // Generate share message
    const prefilledMessage = this.buildFacebookShareMessage(petition, reachEstimate);

    // Publish share created event for viral mechanics
    this.eventBus.publish(
      new FacebookShareCreatedEvent(
        shortCode,
        petitionId,
        userId,
        shortCode,
        Math.round(reachEstimate),
      ),
    );

    this.logger.log(
      `Created Facebook share link ${shortCode} for petition ${petitionId} by user ${userId}`,
    );

    return {
      shareUrl,
      shortCode,
      reachEstimate,
      prefilledMessage,
    };
  }

  /**
   * Build Facebook Share Dialog config with hashtags
   */
  buildFacebookShareDialog(
    petitionId: string,
    userNetworkSize?: number,
  ): {
    quote: string;
    hashtag: string;
    link: string;
    dialogTitle: string;
  } {
    const hashtag = '#ChangeLiberia #CommunityVoice';
    const link = `https://changelib.org/petitions/${petitionId}`;

    const networkReach = userNetworkSize || this.LIBERIA_AVG_NETWORK_SIZE;
    const estimatedSignatures = Math.floor(
      networkReach * this.CONVERSION_RATE_BASELINE,
    );

    const quote = `Join our petition! Together we can make change. By sharing, you could bring ~${estimatedSignatures} more voices to this important cause. 🇱🇷`;

    return {
      quote,
      hashtag,
      link,
      dialogTitle: 'Share This Petition',
    };
  }

  /**
   * Track a Facebook share click and redirect
   */
  async trackFacebookClick(shortCode: string): Promise<string> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { shortCode },
    });

    if (!shareLink) {
      throw new NotFoundException(`Share link with code ${shortCode} not found`);
    }

    // Increment click count
    await this.prisma.shareLink.update({
      where: { shortCode },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: new Date(),
      },
    });

    this.logger.log(`Tracked Facebook click for short code ${shortCode}`);

    return shareLink.targetUrl;
  }

  /**
   * Record a Facebook share event
   */
  async recordFacebookShare(
    petitionId: string,
    userId: string,
    shortCode?: string,
  ): Promise<void> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    // If shortCode provided, update ShareLink
    if (shortCode) {
      const shareLink = await this.prisma.shareLink.findUnique({
        where: { shortCode },
      });

      if (shareLink) {
        await this.prisma.shareLink.update({
          where: { shortCode },
          data: {
            facebookShareCount: { increment: 1 },
          },
        });
      }
    }

    this.logger.log(`Recorded Facebook share for petition ${petitionId}`);
  }

  /**
   * Calculate estimated network reach based on user profile
   * Returns multiplier (1-5x) for viral mechanics
   */
  calculateNetworkReach(user: any): {
    estimatedReach: number;
    multiplier: number;
    influencer: boolean;
  } {
    // Conservative approach: estimate based on trust score
    // Higher trust score = likely more engaged network
    const baseNetwork = this.LIBERIA_AVG_NETWORK_SIZE;
    const trustMultiplier = 1 + user.trustScore / 100; // 0-2x based on trust
    const estimatedReach = Math.floor(baseNetwork * trustMultiplier);

    // Influencer threshold: 5%+ of network converts
    const isInfluencer = user.trustScore >= 50;

    const multiplier = isInfluencer ? 3 : 1.5; // Influencers get 3x, regular users 1.5x

    return {
      estimatedReach,
      multiplier,
      influencer: isInfluencer,
    };
  }

  /**
   * Estimate viral multiplier for a user
   * Higher network engagement = higher multiplier (1-5x)
   */
  estimateViralMultiplier(
    userTrustScore: number,
    networkSize: number = this.LIBERIA_AVG_NETWORK_SIZE,
  ): number {
    // Base multiplier
    let multiplier = 1.0;

    // Trust score contribution (0-2x)
    const trustComponent = Math.min(2, userTrustScore / 50);
    multiplier += trustComponent;

    // Network size contribution (0-2x) - larger networks = more reach
    const networkComponent = Math.min(2, networkSize / 500);
    multiplier += networkComponent;

    // Cap at 5x
    return Math.min(5, multiplier);
  }

  /**
   * Get Facebook analytics for a petition
   */
  async getFacebookAnalytics(petitionId: string): Promise<{
    totalShares: number;
    totalClicks: number;
    conversions: number;
    conversionRate: number;
    reachEstimate: number;
    topSharers: Array<{ userId: string; shares: number; reach: number }>;
  }> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new NotFoundException(`Petition with ID ${petitionId} not found`);
    }

    // Get all Facebook share links
    const shareLinks = await this.prisma.shareLink.findMany({
      where: {
        petitionId,
        source: 'facebook',
      },
    });

    const totalClicks = shareLinks.reduce((sum, link) => sum + link.clickCount, 0);
    const conversions = shareLinks.reduce((sum, link) => sum + link.conversions, 0);
    const reachEstimate = shareLinks.reduce(
      (sum, link) => sum + link.networkReachEstimate,
      0,
    );

    const totalShares = shareLinks.length;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    // Get top sharers
    const topSharers = await this.getTopFacebookSharers(petitionId);

    return {
      totalShares,
      totalClicks,
      conversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      reachEstimate,
      topSharers,
    };
  }

  /**
   * Get top Facebook sharers for a petition
   */
  private async getTopFacebookSharers(
    petitionId: string,
  ): Promise<Array<{ userId: string; shares: number; reach: number }>> {
    const shareLinks = await this.prisma.shareLink.findMany({
      where: {
        petitionId,
        source: 'facebook',
      },
      include: {
        referral: {
          include: {
            referrer: true,
          },
        },
      },
      take: 10,
      orderBy: {
        conversions: 'desc',
      },
    });

    const topSharers: { [key: string]: { shares: number; reach: number } } = {};

    for (const link of shareLinks) {
      if (link.referral?.referrerId) {
        const userId = link.referral.referrerId;
        if (!topSharers[userId]) {
          topSharers[userId] = { shares: 0, reach: 0 };
        }
        topSharers[userId].shares += 1;
        topSharers[userId].reach += link.networkReachEstimate;
      }
    }

    return Object.entries(topSharers).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  }

  /**
   * Get custom audience for retargeting
   */
  async getCustomAudience(
    petitionId: string,
    audienceType: 'SHARERS' | 'CONVERTERS' | 'INFLUENCERS' | 'ENGAGED',
  ): Promise<{
    userIds: string[];
    estimatedSize: number;
    description: string;
  }> {
    let query: any = { petitionId };

    switch (audienceType) {
      case 'SHARERS':
        query.source = 'facebook';
        query.clickCount = { gt: 0 };
        break;

      case 'CONVERTERS':
        query.source = 'facebook';
        query.conversions = { gt: 0 };
        break;

      case 'INFLUENCERS':
        query.influencerFlag = true;
        break;

      case 'ENGAGED':
        query.clickCount = { gt: 5 };
        break;
    }

    const shareLinks = await this.prisma.shareLink.findMany({
      where: query,
      include: {
        referral: true,
      },
    });

    const userIds = Array.from(
      new Set(shareLinks.map((link) => link.referral?.referrerId).filter(Boolean)),
    ) as string[];

    const descriptions = {
      SHARERS: 'Users who shared the petition on Facebook',
      CONVERTERS: 'Users whose Facebook shares resulted in signatures',
      INFLUENCERS: 'High-reach Influencers with viral impact (5%+ network conversion)',
      ENGAGED: 'Highly engaged sharers with 5+ clicks from their links',
    };

    return {
      userIds,
      estimatedSize: userIds.length,
      description: descriptions[audienceType],
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private estimateNetworkReach(user: any): number {
    const baseNetwork = this.LIBERIA_AVG_NETWORK_SIZE;
    const trustMultiplier = 1 + user.trustScore / 100;
    return Math.floor(baseNetwork * trustMultiplier);
  }

  private buildFacebookShareMessage(
    petition: any,
    reachEstimate: number,
  ): string {
    const estimatedSignatures = Math.floor(
      reachEstimate * this.CONVERSION_RATE_BASELINE,
    );

    return `🇱🇷 Join this important petition: "${petition.title}"\n\nWe need ${petition.goal} signatures to make change happen. By sharing, you could bring ~${estimatedSignatures} more voices to this cause!\n\n#ChangeLiberia #CommunityVoice`;
  }
}
