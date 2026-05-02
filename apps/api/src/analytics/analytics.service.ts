import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ConversionFunnel {
  views: number;
  signups: number;
  shares: number;
  donations: number;
  viewToSignupRate: number;
  viewToShareRate: number;
  viewToDonationRate: number;
}

export interface PetitionMetrics {
  petitionId: string;
  title: string;
  status: string;
  totalViews: number;
  totalSignatures: number;
  totalShares: number;
  totalDonations: number;
  totalDonationAmount: number;
  engagementScore: number;
  conversionFunnel: ConversionFunnel;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserEngagementMetrics {
  userId: string;
  name: string;
  petitionsCreated: number;
  petitionsSupported: number;
  shareCount: number;
  donationCount: number;
  totalDonated: number;
  engagementLevel: 'low' | 'medium' | 'high' | 'very-high';
  lastActivityDate: Date;
}

export interface ShareMetrics {
  totalShares: number;
  sharesByMethod: Record<string, number>;
  uniqueSharers: number;
  avgSharesPerUser: number;
  conversionFromShares: number;
}

export interface DonationMetrics {
  totalDonations: number;
  totalAmount: number;
  averageAmount: number;
  medianAmount: number;
  donorCount: number;
  repeatDonorRate: number;
  topDonationContent: Array<{
    contentId: string;
    contentTitle: string;
    totalAmount: number;
    donorCount: number;
  }>;
}

export interface TimeSeriesMetric {
  date: Date;
  value: number;
  label?: string;
}

export interface DashboardOverview {
  totalPetitions: number;
  activePetitions: number;
  totalSignatures: number;
  totalShares: number;
  totalDonations: number;
  totalDonationAmount: number;
  averageSignaturesPerPetition: number;
  averageDonationAmount: number;
  topPetitions: PetitionMetrics[];
  recentActivity: TimeSeriesMetric[];
}

export interface AudienceInsights {
  totalReach: number;
  engaged: number;
  leads: number;
  converters: number;
  shareMultiplier: number;
  estimatedPotentialReach: number;
}

export interface PeakActivity {
  dayOfWeek: string;
  hour: number;
  activityCount: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get conversion funnel for a specific petition
   */
  async getConversionFunnel(
    petitionId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ConversionFunnel> {
    const where = {
      petitionId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [views, signups, shares, donations] = await Promise.all([
      this.prisma.facebookPixelEvent.count({
        where: { ...where, eventType: 'ViewContent' },
      }),
      this.prisma.facebookPixelEvent.count({
        where: { ...where, eventType: 'Lead' },
      }),
      this.prisma.facebookPixelEvent.count({
        where: { ...where, eventType: 'Share' },
      }),
      this.prisma.facebookPixelEvent.count({
        where: { ...where, eventType: 'Purchase' },
      }),
    ]);

    const safeDenominator = views || 1;

    return {
      views,
      signups,
      shares,
      donations,
      viewToSignupRate: (signups / safeDenominator) * 100,
      viewToShareRate: (shares / safeDenominator) * 100,
      viewToDonationRate: (donations / safeDenominator) * 100,
    };
  }

  /**
   * Get comprehensive metrics for a petition
   */
  async getPetitionMetrics(petitionId: string): Promise<PetitionMetrics> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: {
        signatures: true,
        payments: true,
      },
    });

    if (!petition) {
      throw new Error(`Petition ${petitionId} not found`);
    }

    const funnel = await this.getConversionFunnel(petitionId);
    const shares = await this.prisma.facebookPixelEvent.count({
      where: { petitionId, eventType: 'Share' },
    });

    const engagementScore = this.calculateEngagementScore(
      funnel.views,
      petition.signatures.length,
      shares,
      petition.payments.length,
    );

    const totalDonationAmount = petition.payments.reduce(
      (sum, d) => sum + (d.amount || 0),
      0,
    );

    return {
      petitionId,
      title: petition.title,
      status: petition.status,
      totalViews: funnel.views,
      totalSignatures: petition.signatures.length,
      totalShares: shares,
      totalDonations: petition.payments.length,
      totalDonationAmount,
      engagementScore,
      conversionFunnel: funnel,
      createdAt: petition.createdAt,
      updatedAt: petition.updatedAt,
    };
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(userId: string): Promise<UserEngagementMetrics> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        petitions: true,
        signatures: true,
        payments: true,
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const shareCount = await this.prisma.shareLink.count({
      where: { petition: { creatorId: userId } },
    });

    const totalDonated = user.payments.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    const engagementLevel = this.calculateEngagementLevel(
      user.petitions.length,
      user.signatures.length,
      shareCount,
      user.payments.length,
    );

    const recentActivity = await this.prisma.facebookPixelEvent.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      userId,
      name: user.fullName,
      petitionsCreated: user.petitions.length,
      petitionsSupported: user.signatures.length,
      shareCount,
      donationCount: user.payments.length,
      totalDonated,
      engagementLevel,
      lastActivityDate: recentActivity?.createdAt || user.updatedAt,
    };
  }

  /**
   * Get share analytics for a petition
   */
  async getShareMetrics(petitionId: string): Promise<ShareMetrics> {
    const shareEvents = await this.prisma.facebookPixelEvent.findMany({
      where: { petitionId, eventType: 'Share' },
    });

    const uniqueSharers = new Set(shareEvents.map(e => e.userId)).size;
    const shareLinks = await this.prisma.shareLink.findMany({
      where: { petitionId },
    });

    const sharesByMethod = shareLinks.reduce(
      (acc: Record<string, number>, s: any) => {
        acc[s.source] = (acc[s.source] || 0) + 1;
        return acc;
      },
      {},
    );

    const convertedFromShares = await this.prisma.signature.count({
      where: {
        petitionId,
        // Ideally, track source in signature model
      },
    });

    return {
      totalShares: shareLinks.length,
      sharesByMethod,
      uniqueSharers,
      avgSharesPerUser: uniqueSharers ? shareLinks.length / uniqueSharers : 0,
      conversionFromShares:
        uniqueSharers > 0
          ? (convertedFromShares / uniqueSharers) * 100
          : 0,
    };
  }

  /**
   * Get donation analytics
   */
  async getDonationMetrics(contentId?: string): Promise<DonationMetrics> {
    const where = contentId ? { contentId } : {};

    const donations = await this.prisma.donation.findMany({
      where,
    });

    const amounts = donations.map(d => d.amount).filter(a => a > 0);
    amounts.sort((a, b) => a - b);

    const donorCount = new Set(donations.filter(d => d.donorUserId).map(d => d.donorUserId)).size;
    const repeatDonors = donations.reduce(
      (acc, d) => {
        if (d.donorUserId) {
          acc[d.donorUserId] = (acc[d.donorUserId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const repeatDonorCount = Object.values(repeatDonors).filter(
      count => count > 1,
    ).length;

    const totalAmount = amounts.reduce((sum, a) => sum + a, 0);

    // Get content titles for donations
    const donationsByContent: Record<string, { contentTitle: string; totalAmount: number; donorCount: Set<string> }> = {};
    
    for (const d of donations) {
      if (!d.contentId) continue;
      
      const content = await this.prisma.content.findUnique({
        where: { id: d.contentId },
        select: { title: true },
      });

      if (!content) continue;

      const contentId = d.contentId;
      if (!donationsByContent[contentId]) {
        donationsByContent[contentId] = {
          contentTitle: content.title,
          totalAmount: 0,
          donorCount: new Set(),
        };
      }
      donationsByContent[contentId].totalAmount += d.amount;
      if (d.donorUserId) {
        donationsByContent[contentId].donorCount.add(d.donorUserId);
      }
    }

    const topDonationContent = Object.entries(donationsByContent)
      .map(([contentId, data]) => ({
        contentId,
        contentTitle: data.contentTitle,
        totalAmount: data.totalAmount,
        donorCount: data.donorCount.size,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    const median = amounts.length
      ? amounts[Math.floor(amounts.length / 2)]
      : 0;

    return {
      totalDonations: donations.length,
      totalAmount,
      averageAmount: amounts.length ? totalAmount / amounts.length : 0,
      medianAmount: median,
      donorCount,
      repeatDonorRate: donorCount ? (repeatDonorCount / donorCount) * 100 : 0,
      topDonationContent,
    };
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const [
      totalPetitions,
      activePetitions,
      totalSignatures,
      totalShares,
      donationMetrics,
    ] = await Promise.all([
      this.prisma.petition.count(),
      this.prisma.petition.count({ where: { status: 'APPROVED' } }),
      this.prisma.signature.count(),
      this.prisma.shareLink.count(),
      this.getDonationMetrics(),
    ]);

    // Get top petitions
    const topPetitions = await this.prisma.petition.findMany({
      include: {
        signatures: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const topPetitionsMetrics = await Promise.all(
      topPetitions.map(p => this.getPetitionMetrics(p.id)),
    );

    // Get recent activity trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = await this.prisma.facebookPixelEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const activityByDate = recentEvents.reduce(
      (acc, event) => {
        const date = event.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recentActivity = Object.entries(activityByDate)
      .map(([date, value]) => ({
        date: new Date(date),
        value,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const avgSignaturesPerPetition =
      totalPetitions > 0 ? totalSignatures / totalPetitions : 0;

    return {
      totalPetitions,
      activePetitions,
      totalSignatures,
      totalShares,
      totalDonations: donationMetrics.totalDonations,
      totalDonationAmount: donationMetrics.totalAmount,
      averageSignaturesPerPetition: avgSignaturesPerPetition,
      averageDonationAmount: donationMetrics.averageAmount,
      topPetitions: topPetitionsMetrics,
      recentActivity,
    };
  }

  /**
   * Get audience insights from Facebook custom audiences
   */
  async getAudienceInsights(petitionId: string): Promise<AudienceInsights> {
    const viewsCount = await this.prisma.facebookPixelEvent.count({
      where: { petitionId, eventType: 'ViewContent' },
    });

    const engagedCount = await this.prisma.facebookPixelEvent.count({
      where: { petitionId, eventType: { in: ['Lead', 'Share', 'Purchase'] } },
    });

    const leadsCount = await this.prisma.facebookPixelEvent.count({
      where: { petitionId, eventType: 'Lead' },
    });

    const convertersCount = await this.prisma.facebookPixelEvent.count({
      where: { petitionId, eventType: 'Purchase' },
    });

    const shareMultiplier =
      engagedCount > 0 ? viewsCount / engagedCount : 1;

    return {
      totalReach: viewsCount,
      engaged: engagedCount,
      leads: leadsCount,
      converters: convertersCount,
      shareMultiplier,
      estimatedPotentialReach: Math.round(viewsCount * shareMultiplier),
    };
  }

  /**
   * Get peak activity hours
   */
  async getPeakActivity(
    petitionId?: string,
    days: number = 30,
  ): Promise<PeakActivity[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await this.prisma.facebookPixelEvent.findMany({
      where: {
        ...(petitionId && { petitionId }),
        createdAt: { gte: startDate },
      },
    });

    const activityMap = events.reduce(
      (acc, event) => {
        const date = event.createdAt;
        const dayOfWeek = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ][date.getDay()];
        const hour = date.getHours();
        const key = `${dayOfWeek}-${hour}`;

        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(activityMap)
      .map(([key, count]) => {
        const [dayOfWeek, hour] = key.split('-');
        return {
          dayOfWeek,
          hour: parseInt(hour),
          activityCount: count,
        };
      })
      .sort((a, b) => b.activityCount - a.activityCount);
  }

  /**
   * Get trending petitions
   */
  async getTrendingPetitions(limit: number = 10): Promise<PetitionMetrics[]> {
    const petitions = await this.prisma.petition.findMany({
      where: { status: 'APPROVED' },
      include: {
        signatures: true,
      },
      orderBy: { signatures: { _count: 'desc' } },
      take: limit,
    });

    return Promise.all(
      petitions.map(p => this.getPetitionMetrics(p.id)),
    );
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(
    views: number,
    signatures: number,
    shares: number,
    donations: number,
  ): number {
    if (views === 0) return 0;

    const signupRate = (signatures / views) * 100;
    const shareRate = (shares / views) * 100;
    const donationRate = (donations / views) * 100;

    // Weighted formula: 50% signup rate, 30% share rate, 20% donation rate
    return Math.min(
      100,
      signupRate * 0.5 + shareRate * 0.3 + donationRate * 0.2,
    );
  }

  /**
   * Calculate engagement level
   */
  private calculateEngagementLevel(
    petitionsCreated: number,
    petitionsSupported: number,
    shareCount: number,
    donationCount: number,
  ): 'low' | 'medium' | 'high' | 'very-high' {
    const score =
      petitionsCreated * 3 +
      petitionsSupported * 2 +
      shareCount * 1.5 +
      donationCount * 2;

    if (score >= 20) return 'very-high';
    if (score >= 10) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Export petition analytics to CSV
   */
  async exportPetitionAnalytics(petitionId: string): Promise<string> {
    const metrics = await this.getPetitionMetrics(petitionId);
    const shares = await this.getShareMetrics(petitionId);
    const audience = await this.getAudienceInsights(petitionId);

    const csv = `Petition Analytics Report
Title,${metrics.title}
Status,${metrics.status}
Created,${metrics.createdAt.toISOString()}

Engagement Metrics
Total Views,${metrics.totalViews}
Total Signatures,${metrics.totalSignatures}
Total Shares,${metrics.totalShares}
Total Donations,${metrics.totalDonations}
Total Donation Amount,$${metrics.totalDonationAmount.toFixed(2)}
Engagement Score,${metrics.engagementScore.toFixed(2)}/100

Conversion Funnel
View to Signup Rate,${metrics.conversionFunnel.viewToSignupRate.toFixed(2)}%
View to Share Rate,${metrics.conversionFunnel.viewToShareRate.toFixed(2)}%
View to Donation Rate,${metrics.conversionFunnel.viewToDonationRate.toFixed(2)}%

Share Analytics
Total Shares,${shares.totalShares}
Unique Sharers,${shares.uniqueSharers}
Avg Shares per User,${shares.avgSharesPerUser.toFixed(2)}
Conversion from Shares,${shares.conversionFromShares.toFixed(2)}%

Audience Insights
Total Reach,${audience.totalReach}
Engaged Users,${audience.engaged}
Leads,${audience.leads}
Converters,${audience.converters}
Estimated Potential Reach,${audience.estimatedPotentialReach}
`;

    return csv;
  }

  // ── Platform-wide admin analytics ────────────────────────────────────────

  async getPlatformStats(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [
      totalUsers, newUsers,
      totalPetitions, activePetitions, newPetitions,
      totalSignatures, newSignatures,
      totalSupporters,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.petition.count(),
      this.prisma.petition.count({ where: { status: 'APPROVED' } }),
      this.prisma.petition.count({ where: { createdAt: { gte: since } } }),
      this.prisma.signature.count(),
      this.prisma.signature.count({ where: { createdAt: { gte: since } } }),
      this.prisma.supporter.count(),
    ]);
    return {
      totalUsers, newUsers,
      totalPetitions, activePetitions, newPetitions,
      totalSignatures, newSignatures,
      totalSupporters,
      period: days,
    };
  }

  async getDailyMetrics(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [users, petitions, signatures] = await Promise.all([
      this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "Petition"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "Signature"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    const toMap = (rows: { date: Date; count: bigint }[]) =>
      Object.fromEntries(rows.map((r) => [r.date.toISOString().slice(0, 10), Number(r.count)]));

    const uMap = toMap(users);
    const pMap = toMap(petitions);
    const sMap = toMap(signatures);

    const allDates = [...new Set([...Object.keys(uMap), ...Object.keys(pMap), ...Object.keys(sMap)])].sort();
    return allDates.map((date) => ({
      date,
      newUsers: uMap[date] ?? 0,
      newPetitions: pMap[date] ?? 0,
      newSignatures: sMap[date] ?? 0,
    }));
  }

  async getCategoryStats(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const groups = await this.prisma.petition.groupBy({
      by: ['petitionType'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      _sum: { signaturesCount: true },
    });
    return groups.map((g) => ({
      category: g.petitionType ?? 'OTHER',
      petitionCount: g._count.id,
      signatureCount: g._sum.signaturesCount ?? 0,
    }));
  }

  async getFraudStats(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.prisma.fraudEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const byRule: Record<string, number> = {};
    const flaggedUsers = new Set<string>();
    for (const e of events) {
      byRule[e.ruleKey] = (byRule[e.ruleKey] ?? 0) + 1;
      flaggedUsers.add(e.userId ?? e.ipAddress ?? e.id);
    }
    return {
      totalFlags: events.length,
      flaggedUsers: flaggedUsers.size,
      byRule,
      recentEvents: events.slice(0, 20).map((e) => ({
        id: e.id,
        ruleKey: e.ruleKey,
        details: e.details,
        createdAt: e.createdAt,
      })),
      period: days,
    };
  }
}
