import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { CreateEndorsementDto, RejectEndorsementDto } from './dto';

/**
 * Community leader endorsements — distinct from petition signing. A
 * verified traditional/religious/civic/business leader can publicly back a
 * petition; admin-reviewed before it appears on the petition page
 * (mirrors the Officials Portal application/approval pattern, but lighter
 * weight — no Institution/RBAC involvement).
 */
@Injectable()
export class EndorsementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async submit(petitionId: string, userId: string | undefined, dto: CreateEndorsementDto) {
    const petition = await this.prisma.petition.findUnique({ where: { id: petitionId } });
    if (!petition) throw new NotFoundException('Petition not found');

    const endorsement = await this.prisma.petitionEndorsement.create({
      data: {
        petitionId,
        userId: userId ?? null,
        endorserName: dto.endorserName,
        endorserType: dto.endorserType,
        endorserTitle: dto.endorserTitle,
        organization: dto.organization,
        statement: dto.statement,
        status: 'PENDING',
      },
    });

    this.activityLogger.logAsync({
      userId,
      action: 'ENDORSEMENT_SUBMITTED',
      entityType: 'PETITION_ENDORSEMENT',
      entityId: endorsement.id,
      description: `Endorsement submitted for petition ${petitionId} by ${dto.endorserName}`,
    });

    return endorsement;
  }

  async listApproved(petitionId: string) {
    return this.prisma.petitionEndorsement.findMany({
      where: { petitionId, status: 'APPROVED' },
      select: {
        id: true,
        endorserName: true,
        endorserTitle: true,
        endorserType: true,
        organization: true,
        statement: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPending() {
    return this.prisma.petitionEndorsement.findMany({
      where: { status: 'PENDING' },
      include: { petition: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(id: string, adminUserId: string) {
    const endorsement = await this.prisma.petitionEndorsement.findUnique({ where: { id } });
    if (!endorsement) throw new NotFoundException('Endorsement not found');
    if (endorsement.status !== 'PENDING') {
      throw new BadRequestException('Only pending endorsements can be approved');
    }

    const updated = await this.prisma.petitionEndorsement.update({
      where: { id },
      data: { status: 'APPROVED', reviewedBy: adminUserId, reviewedAt: new Date() },
    });

    this.activityLogger.logAsync({
      adminId: adminUserId,
      action: 'ENDORSEMENT_APPROVED',
      entityType: 'PETITION_ENDORSEMENT',
      entityId: id,
      description: `Approved endorsement from ${updated.endorserName}`,
    });

    return updated;
  }

  async reject(id: string, adminUserId: string, dto: RejectEndorsementDto) {
    const endorsement = await this.prisma.petitionEndorsement.findUnique({ where: { id } });
    if (!endorsement) throw new NotFoundException('Endorsement not found');
    if (endorsement.status !== 'PENDING') {
      throw new BadRequestException('Only pending endorsements can be rejected');
    }

    const updated = await this.prisma.petitionEndorsement.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy: adminUserId, reviewedAt: new Date(), reviewNotes: dto.notes },
    });

    this.activityLogger.logAsync({
      adminId: adminUserId,
      action: 'ENDORSEMENT_REJECTED',
      entityType: 'PETITION_ENDORSEMENT',
      entityId: id,
      description: `Rejected endorsement from ${updated.endorserName}`,
    });

    return updated;
  }
}
