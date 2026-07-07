import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GovernmentResponseStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const STAGE_ORDER: GovernmentResponseStage[] = [
  'RECEIVED',
  'ASSIGNED',
  'UNDER_REVIEW',
  'INVESTIGATION',
  'ACTION_PLANNED',
  'IMPLEMENTATION',
  'RESOLVED',
  'CLOSED',
];

/**
 * Public government-response workflow for a petition, tracked per
 * responsible institution. Entirely separate from Petition.status
 * (moderation PENDING/APPROVED/REJECTED) and from the legacy
 * GovernmentContact/PetitionSubmission "submit to an email" flow in
 * ../government/ (left untouched — different purpose, not migrated here).
 */
@Injectable()
export class ResponseWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async assignToInstitution(petitionId: string, institutionId: string, note?: string) {
    const existing = await this.prisma.petitionGovernmentResponse.findUnique({
      where: { petitionId_institutionId: { petitionId, institutionId } },
    });
    if (existing) return existing;

    return this.prisma.petitionGovernmentResponse.create({
      data: {
        petitionId,
        institutionId,
        currentStage: 'RECEIVED',
        timeline: {
          create: { stage: 'RECEIVED', note: note ?? 'Routed to institution' },
        },
      },
      include: { timeline: true },
    });
  }

  async advanceStage(
    responseId: string,
    newStage: GovernmentResponseStage,
    note: string | undefined,
    actorUserId: string,
    isAdmin = false,
    requesterInstitutionId?: string,
  ) {
    const response = await this.prisma.petitionGovernmentResponse.findUnique({
      where: { id: responseId },
    });
    if (!response) throw new NotFoundException('Response record not found');

    if (!isAdmin && (!requesterInstitutionId || response.institutionId !== requesterInstitutionId)) {
      throw new ForbiddenException('This response belongs to a different institution');
    }

    const currentIndex = STAGE_ORDER.indexOf(response.currentStage);
    const newIndex = STAGE_ORDER.indexOf(newStage);

    if (!isAdmin && newIndex <= currentIndex) {
      throw new BadRequestException('Stage transitions must move forward');
    }

    const updated = await this.prisma.petitionGovernmentResponse.update({
      where: { id: responseId },
      data: {
        currentStage: newStage,
        resolvedAt: newStage === 'RESOLVED' ? new Date() : response.resolvedAt,
        timeline: { create: { stage: newStage, note, actorUserId } },
      },
      include: { timeline: { orderBy: { createdAt: 'asc' } } },
    });

    // Web push notification trigger — best-effort, never blocks the
    // stage transition itself.
    this.prisma.petition
      .findUnique({ where: { id: response.petitionId }, select: { title: true } })
      .then((petition) => {
        if (!petition) return;
        this.eventEmitter.emit('petition.government-response-advanced', {
          petitionId: response.petitionId,
          petitionTitle: petition.title,
          stage: newStage,
        });
      })
      .catch(() => {/* non-critical */});

    return updated;
  }

  async getPublicTimeline(petitionId: string) {
    return this.prisma.petitionGovernmentResponse.findMany({
      where: { petitionId },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            officialProfile: { select: { photoUrl: true } },
          },
        },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
