import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PetitionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SmartRoutingService } from '../contact-directory/routing/smart-routing.service';
import { StakeholderGroupService } from '../stakeholder-groups/stakeholder-group.service';
import {
  CreatePetitionCommentDto,
  CreatePetitionDto,
  CreatePetitionUpdateDto,
  UpdatePetitionDto,
} from './dto';
import { PetitionUpdatePublishedEvent } from '../events/domain-events';

@Injectable()
export class PetitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smartRouting: SmartRoutingService,
    private readonly eventEmitter: EventEmitter2,
    private readonly stakeholderGroupService: StakeholderGroupService,
  ) {}

  private async rankByRisk(
    petitions: Array<{
      id: string;
      createdAt: Date;
      todaySignatures: number;
      signaturesCount: number;
      title: string;
      summary: string;
      imageUrl: string | null;
      description: string;
      goal: number;
      status: PetitionStatus;
      updatedAt: Date;
      creatorId: string;
    }>,
  ) {
    if (petitions.length === 0) return [];
    const now = Date.now();
    const riskCounts = await this.prisma.fraudEvent.groupBy({
      by: ['petitionId'],
      _count: { _all: true },
      where: {
        petitionId: { in: petitions.map((petition) => petition.id) },
      },
    });
    const riskMap = new Map(
      riskCounts.map((entry) => [entry.petitionId, entry._count._all]),
    );

    return petitions
      .map((petition) => {
        const ageHours = Math.max(
          1,
          (now - petition.createdAt.getTime()) / (1000 * 60 * 60),
        );
        const riskCount = riskMap.get(petition.id) ?? 0;
        const momentum =
          petition.todaySignatures * 1.5 + petition.signaturesCount * 0.2;
        const freshnessBoost = 10 / ageHours;
        const score = momentum + freshnessBoost - riskCount * 8;
        return { ...petition, discoveryScore: Number(score.toFixed(2)) };
      })
      .sort((a, b) => b.discoveryScore - a.discoveryScore);
  }

  async stats() {
    const [totals, goalData] = await Promise.all([
      this.prisma.petition.aggregate({
        where: { status: PetitionStatus.APPROVED },
        _count: { _all: true },
        _sum: { signaturesCount: true },
      }),
      this.prisma.petition.findMany({
        where: { status: PetitionStatus.APPROVED },
        select: { signaturesCount: true, goal: true },
      }),
    ]);

    const campaignsWon = goalData.filter((p) => p.signaturesCount >= p.goal).length;

    return {
      totalPetitions: totals._count._all,
      totalSignatures: totals._sum.signaturesCount ?? 0,
      campaignsWon,
      countiesReached: 15,
    };
  }

  async create(userId: string, dto: CreatePetitionDto) {
    // Check if phone verification is required
    const phoneVerificationToggle = await this.prisma.featureToggle.findUnique({
      where: { name: 'phoneVerificationRequired' },
    });
    const phoneVerificationRequired = phoneVerificationToggle?.enabled ?? true;

    if (phoneVerificationRequired) {
      const phoneLog = await this.prisma.verificationLog.findFirst({
        where: { userId, type: 'OTP' },
      });
      if (!phoneLog) {
        throw new ForbiddenException(
          'Please verify your phone number before creating a petition.',
        );
      }
    }

    const petition = await this.prisma.petition.create({
      data: { ...dto, goal: dto.goal ?? 1000, creatorId: userId },
    });
    await this.prisma.petitionStatusLog.create({
      data: { petitionId: petition.id, status: 'submitted' },
    });
    return petition;
  }

  async updatePetition(petitionId: string, userId: string, dto: UpdatePetitionDto) {
    const petition = await this.prisma.petition.findUnique({ where: { id: petitionId } });
    if (!petition) throw new NotFoundException('Petition not found');
    if (petition.creatorId !== userId) throw new ForbiddenException('Not your petition');
    return this.prisma.petition.update({ where: { id: petitionId }, data: { ...dto } });
  }

  async list() {
    const petitions = await this.prisma.petition.findMany({
      where: { status: PetitionStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return this.rankByRisk(petitions);
  }

  async trending() {
    const petitions = await this.prisma.petition.findMany({
      where: { status: PetitionStatus.APPROVED },
      orderBy: { todaySignatures: 'desc' },
      take: 25,
    });
    const ranked = await this.rankByRisk(petitions);
    return ranked.slice(0, 6);
  }

  getById(id: string) {
    return this.prisma.petition.findUnique({ where: { id } });
  }

  async approve(id: string, category?: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id },
      include: { creator: { select: { id: true, email: true, fullName: true } } },
    });
    if (!petition) throw new NotFoundException('Petition not found');
    if (petition.status !== PetitionStatus.PENDING) {
      throw new BadRequestException('Only pending petitions can be approved');
    }

    // Approve petition and log status transition
    const approved = await this.prisma.petition.update({
      where: { id },
      data: {
        status: PetitionStatus.APPROVED,
        ...(category && { category }),
      },
    });
    await this.prisma.petitionStatusLog.create({
      data: { petitionId: id, status: 'approved', note: 'Petition approved by admin' },
    });
    await this.prisma.petitionStatusLog.create({
      data: { petitionId: id, status: 'gathering_signatures' },
    });

    // Notify creator via email
    this.eventEmitter.emit('petition.approved', {
      petitionId: id,
      petitionTitle: petition.title,
      creatorId: petition.creator.id,
      creatorEmail: petition.creator.email,
      creatorName: petition.creator.fullName,
      petitionUrl: `/petitions/${id}`,
    });

    // Auto-create stakeholder groups for the petition
    try {
      await this.stakeholderGroupService.createGroupsForPetition(id);
    } catch (error) {
      // Log error but don't fail petition approval
      console.error(`Error creating stakeholder groups for petition ${id}:`, error);
    }

    // Auto-route petition to institution
    try {
      const tags = category ? [category] : [];
      const routingResult = await this.smartRouting.routePetition(
        petition.title,
        category || null,
        tags,
      );

      // Log routing decision
      await this.smartRouting.logRoutingDecision(id, routingResult);

      // Emit event to send email to institution
      this.eventEmitter.emit('petition.routed', {
        petitionId: id,
        routingResult,
      });
    } catch (error) {
      // Log routing error but don't fail petition approval
      console.error(`Error routing petition ${id}:`, error);
    }

    return approved;
  }

  async reject(id: string, reason?: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id },
      include: { creator: { select: { id: true, email: true, fullName: true } } },
    });
    if (!petition) throw new NotFoundException('Petition not found');
    if (petition.status !== PetitionStatus.PENDING) {
      throw new BadRequestException('Only pending petitions can be rejected');
    }
    const rejected = await this.prisma.petition.update({
      where: { id },
      data: { status: PetitionStatus.REJECTED },
    });

    // Notify creator via email
    this.eventEmitter.emit('petition.rejected', {
      petitionId: id,
      petitionTitle: petition.title,
      creatorId: petition.creator.id,
      creatorEmail: petition.creator.email,
      creatorName: petition.creator.fullName,
      reason: reason || 'Your petition did not meet our guidelines at this time.',
    });

    return rejected;
  }

  async listUpdates(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });
    if (!petition || petition.status !== PetitionStatus.APPROVED) return [];
    return this.prisma.petitionUpdate.findMany({
      where: { petitionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listComments(petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });
    if (!petition || petition.status !== PetitionStatus.APPROVED) return [];
    return this.prisma.petitionComment.findMany({
      where: { petitionId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createUpdate(
    petitionId: string,
    userId: string,
    dto: CreatePetitionUpdateDto,
  ) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });
    if (!petition) throw new NotFoundException('Petition not found');
    if (petition.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the petition creator can post updates',
      );
    }
    const update = await this.prisma.petitionUpdate.create({
      data: { petitionId, title: dto.title, body: dto.body },
    });

    this.eventEmitter.emit(
      'PETITION_UPDATE_PUBLISHED',
      new PetitionUpdatePublishedEvent(update.id, petitionId, petition.title, dto.title),
    );

    return update;
  }

  async followPetition(userId: string, petitionId: string) {
    await this.prisma.petitionFollower.upsert({
      where: { userId_petitionId: { userId, petitionId } },
      create: { userId, petitionId },
      update: {},
    });
    return { following: true };
  }

  async unfollowPetition(userId: string, petitionId: string) {
    await this.prisma.petitionFollower.deleteMany({ where: { userId, petitionId } });
    return { following: false };
  }

  async isFollowing(userId: string, petitionId: string) {
    const row = await this.prisma.petitionFollower.findUnique({
      where: { userId_petitionId: { userId, petitionId } },
    });
    return { following: !!row };
  }

  async createComment(
    petitionId: string,
    dto: CreatePetitionCommentDto,
    userId?: string,
  ) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });
    if (!petition || petition.status !== PetitionStatus.APPROVED) {
      throw new BadRequestException('Petition is not open for comments');
    }
    return this.prisma.petitionComment.create({
      data: {
        petitionId,
        authorName: dto.authorName,
        body: dto.body,
        userId,
      },
    });
  }

  async browse() {
    // Fetch all approved petitions with creator info
    const petitions = await this.prisma.petition.findMany({
      where: { status: PetitionStatus.APPROVED },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group petitions by category
    const grouped = new Map<string | null, typeof petitions>();
    for (const petition of petitions) {
      const cat = petition.category || 'Uncategorized';
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(petition);
    }

    // Get trending petitions (top 6 by today's signatures)
    const trendingPetitions = petitions
      .sort((a, b) => b.todaySignatures - a.todaySignatures)
      .slice(0, 6);

    return {
      categories: Object.fromEntries(grouped),
      trending: trendingPetitions,
      total: petitions.length,
    };
  }

  async getStatusLog(petitionId: string) {
    return this.prisma.petitionStatusLog.findMany({
      where: { petitionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getOrCreateShareLink(petitionId: string): Promise<{ shortCode: string; shortUrl: string }> {
    const petition = await this.prisma.petition.findUnique({ where: { id: petitionId } });
    if (!petition) throw new NotFoundException('Petition not found');

    const existing = await this.prisma.shareLink.findFirst({
      where: { petitionId, source: 'direct' },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) {
      return { shortCode: existing.shortCode, shortUrl: `https://changelib.org/r/${existing.shortCode}` };
    }

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';
    for (let i = 0; i < 8; i++) shortCode += chars[Math.floor(Math.random() * chars.length)];

    const link = await this.prisma.shareLink.create({
      data: {
        shortCode,
        targetUrl: `https://changelib.org/petitions/${petitionId}`,
        petitionId,
        source: 'direct',
        medium: 'organic',
      },
    });
    return { shortCode: link.shortCode, shortUrl: `https://changelib.org/r/${link.shortCode}` };
  }
}
