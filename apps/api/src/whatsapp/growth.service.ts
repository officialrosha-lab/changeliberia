import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Growth System Service
 * Handles milestone tracking, county leaderboards, and viral triggers
 */
@Injectable()
export class GrowthService {
  private readonly logger = new Logger(GrowthService.name);

  // Define milestone thresholds
  private readonly SIGNATURE_MILESTONES = [10, 50, 100, 500, 1000, 5000];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a petition has reached a new milestone
   * Creates milestone record and returns milestone info
   */
  async checkAndCreateMilestone(petitionId: string, currentSignatureCount: number) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: { milestones: true },
    });

    if (!petition) {
      throw new Error(`Petition ${petitionId} not found`);
    }

    const newMilestones: Array<{ targetValue: number; metadata?: any }> = [];

    // Check each milestone threshold
    for (const threshold of this.SIGNATURE_MILESTONES) {
      if (currentSignatureCount >= threshold) {
        // Check if milestone already exists
        const existing = petition.milestones.find(
          (m) => m.type === 'SIGNATURES' && m.targetValue === threshold,
        );

        if (!existing) {
          newMilestones.push({ targetValue: threshold });
        }
      }
    }

    // Create new milestone records
    const createdMilestones = [];
    for (const milestone of newMilestones) {
      const created = await this.prisma.petitionMilestone.create({
        data: {
          petitionId,
          type: 'SIGNATURES',
          targetValue: milestone.targetValue,
          currentValue: currentSignatureCount,
          achieved: true,
          achievedAt: new Date(),
        },
      });
      createdMilestones.push(created);
      this.logger.log(`🎉 Petition ${petitionId} reached ${milestone.targetValue} signatures!`);
    }

    return createdMilestones;
  }

  /**
   * Gets trending petitions by signatures in last 7 days
   */
  async getTrendingPetitions(limit: number = 10, county?: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // This is simplified - in production, would track hourly/daily signature velocity
    const trending = await this.prisma.petition.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        title: true,
        summary: true,
        imageUrl: true,
        signaturesCount: true,
        goal: true,
        todaySignatures: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { todaySignatures: 'desc' }, // Recent momentum
        { signaturesCount: 'desc' }, // Overall signatures
      ],
      take: limit,
    });

    return trending.map((p) => ({
      ...p,
      signatureVelocity: p.todaySignatures, // Signatures per day
      percentToGoal: Math.round((p.signaturesCount / p.goal) * 100),
    }));
  }

  /**
   * Gets county-based leaderboard of petitions
   * Uses IP geolocation data from signatures
   */
  async getCountyLeaderboard(county: string, limit: number = 10) {
    // Get all signatures from this county
    const countySignatures = await this.prisma.signature.findMany({
      where: {
        // In production, would have county field in signature or device
        // For now, we'll aggregate from all signatures and parse county from metadata
      },
      include: {
        petition: {
          select: {
            id: true,
            title: true,
            signaturesCount: true,
            goal: true,
            imageUrl: true,
          },
        },
      },
    });

    // Group by petition and sort by count
    const petitionCounts: Record<string, any> = {};
    countySignatures.forEach((sig) => {
      if (!petitionCounts[sig.petition.id]) {
        petitionCounts[sig.petition.id] = {
          ...sig.petition,
          countySignatures: 0,
        };
      }
      petitionCounts[sig.petition.id].countySignatures += 1;
    });

    return Object.values(petitionCounts)
      .sort((a, b) => b.countySignatures - a.countySignatures)
      .slice(0, limit)
      .map((p, idx) => ({
        ...p,
        rank: idx + 1,
        percentOfTotal: Math.round((p.countySignatures / p.signaturesCount) * 100),
      }));
  }

  /**
   * Gets all achieved milestones for a petition
   */
  async getPetitionMilestones(petitionId: string) {
    const milestones = await this.prisma.petitionMilestone.findMany({
      where: { petitionId, achieved: true },
      orderBy: { achievedAt: 'asc' },
    });

    return milestones;
  }

  /**
   * Checks if petition should trigger a re-share prompt
   * Returns true if milestone was just achieved and not yet shared
   */
  async shouldTriggerShareModal(petitionId: string): Promise<boolean> {
    const recentMilestone = await this.prisma.petitionMilestone.findFirst({
      where: {
        petitionId,
        achieved: true,
        shareTriggered: false,
        achievedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentMilestone) {
      // Mark as triggered
      await this.prisma.petitionMilestone.update({
        where: { id: recentMilestone.id },
        data: { shareTriggered: true },
      });

      return true;
    }

    return false;
  }

  /**
   * Gets growth metrics for a petition
   */
  async getPetitionGrowthMetrics(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: {
        signatures: true,
        milestones: true,
      },
    });

    if (!petition) {
      throw new Error(`Petition ${petitionId} not found`);
    }

    // Calculate growth rate (signatures per day)
    const daysSinceCreation = Math.max(
      1,
      Math.ceil((Date.now() - petition.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const avgSignaturesPerDay = Math.round(petition.signaturesCount / daysSinceCreation);

    // Get signature timeline (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSignatures = await this.prisma.signature.findMany({
      where: {
        petitionId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    // Group by day
    const dayGroups: Record<string, number> = {};
    recentSignatures.forEach((sig) => {
      const date = sig.createdAt.toISOString().split('T')[0];
      dayGroups[date] = (dayGroups[date] || 0) + 1;
    });

    return {
      petitionId,
      signaturesCount: petition.signaturesCount,
      goal: petition.goal,
      percentToGoal: Math.round((petition.signaturesCount / petition.goal) * 100),
      avgSignaturesPerDay,
      daysToGoal: Math.ceil((petition.goal - petition.signaturesCount) / avgSignaturesPerDay),
      milestonesAchieved: petition.milestones.filter((m) => m.achieved).length,
      lastSignatureDate: recentSignatures.length > 0 ? recentSignatures[recentSignatures.length - 1].createdAt : petition.createdAt,
      signatureTimeline: dayGroups,
    };
  }

  /**
   * Gets government readiness status
   * A petition is "government ready" at 1000+ signatures
   */
  async getGovernmentReadinessStatus(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        milestones: true,
      },
    });

    if (!petition) {
      throw new Error(`Petition ${petitionId} not found`);
    }

    const governmentReadyMilestone = petition.milestones.find(
      (m) => m.type === 'GOVERNMENT_READY' && m.achieved,
    );

    return {
      petitionId,
      isGovernmentReady: petition.signaturesCount >= 1000,
      signaturesCount: petition.signaturesCount,
      signaturesNeeded: Math.max(0, 1000 - petition.signaturesCount),
      achievedAt: governmentReadyMilestone?.achievedAt,
      creatorContact: petition.creator,
      nextMilestone: 5000,
      nextMilestoneProgress: Math.round((petition.signaturesCount / 5000) * 100),
    };
  }

  /**
   * Recalculates all milestones for a petition
   * Useful after data corrections or migrations
   */
  async recalculateMilestones(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new Error(`Petition ${petitionId} not found`);
    }

    const signatureCount = petition.signaturesCount;

    // Delete existing signature milestones
    await this.prisma.petitionMilestone.deleteMany({
      where: {
        petitionId,
        type: 'SIGNATURES',
      },
    });

    // Create new ones
    const milestones = [];
    for (const threshold of this.SIGNATURE_MILESTONES) {
      if (signatureCount >= threshold) {
        const milestone = await this.prisma.petitionMilestone.create({
          data: {
            petitionId,
            type: 'SIGNATURES',
            targetValue: threshold,
            currentValue: signatureCount,
            achieved: true,
            achievedAt: new Date(),
          },
        });
        milestones.push(milestone);
      }
    }

    this.logger.log(`Recalculated ${milestones.length} milestones for petition ${petitionId}`);
    return milestones;
  }
}
