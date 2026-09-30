import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProfessionalServiceRequest,
  ServiceRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { InvoicesService } from './invoices.service';

export interface SubmitServiceRequestDto {
  title: string;
  description: string;
  organizationId?: string;
  institutionId?: string;
}

export interface AdvanceServiceRequestDto {
  toStatus: ServiceRequestStatus;
  note?: string;
  quotedAmount?: number;
  currency?: string;
}

/**
 * "Change Liberia Studio" professional-services intake — modeled on the
 * existing officials apply/review flow: a status pipeline plus an
 * append-only audit-log side table (ServiceRequestStatusLog), not a
 * payment-webhook-driven purchase.
 */
const ALLOWED_TRANSITIONS: Record<
  ServiceRequestStatus,
  ServiceRequestStatus[]
> = {
  SUBMITTED: ['SCOPING', 'DECLINED'],
  SCOPING: ['QUOTED', 'DECLINED'],
  QUOTED: ['IN_PROGRESS', 'DECLINED'],
  IN_PROGRESS: ['DELIVERED'],
  DELIVERED: ['CLOSED'],
  CLOSED: [],
  DECLINED: [],
};

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoices: InvoicesService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  async submit(
    userId: string,
    dto: SubmitServiceRequestDto,
  ): Promise<ProfessionalServiceRequest> {
    const request = await this.prisma.professionalServiceRequest.create({
      data: {
        requesterUserId: userId,
        organizationId: dto.organizationId,
        institutionId: dto.institutionId,
        title: dto.title,
        description: dto.description,
        statusLogs: {
          create: {
            toStatus: ServiceRequestStatus.SUBMITTED,
            changedByUserId: userId,
          },
        },
      },
    });
    this.activityLogger.logAsync({
      userId,
      action: 'SERVICE_REQUEST_SUBMITTED',
      entityType: 'PROFESSIONAL_SERVICE_REQUEST',
      entityId: request.id,
      description: `User submitted Studio request: ${dto.title}`,
    });
    return request;
  }

  async listMine(userId: string): Promise<ProfessionalServiceRequest[]> {
    return this.prisma.professionalServiceRequest.findMany({
      where: { requesterUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(): Promise<ProfessionalServiceRequest[]> {
    return this.prisma.professionalServiceRequest.findMany({
      include: {
        requester: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, userId: string, isAdmin: boolean) {
    const request = await this.prisma.professionalServiceRequest.findUnique({
      where: { id },
      include: {
        statusLogs: { orderBy: { createdAt: 'asc' } },
        invoices: true,
      },
    });
    if (!request)
      throw new NotFoundException(`Service request not found: ${id}`);
    if (!isAdmin && request.requesterUserId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this service request',
      );
    }
    return request;
  }

  /** Admin-only: advances the pipeline. Auto-drafts an Invoice the moment a request reaches QUOTED with an amount. */
  async advance(
    id: string,
    actorUserId: string,
    dto: AdvanceServiceRequestDto,
  ): Promise<ProfessionalServiceRequest> {
    const request = await this.prisma.professionalServiceRequest.findUnique({
      where: { id },
    });
    if (!request)
      throw new NotFoundException(`Service request not found: ${id}`);

    const allowed = ALLOWED_TRANSITIONS[request.status];
    if (!allowed.includes(dto.toStatus)) {
      throw new BadRequestException(
        `Cannot move a request from ${request.status} to ${dto.toStatus}`,
      );
    }
    if (
      dto.toStatus === ServiceRequestStatus.QUOTED &&
      dto.quotedAmount === undefined
    ) {
      throw new BadRequestException(
        'quotedAmount is required when moving to QUOTED',
      );
    }

    const updated = await this.prisma.professionalServiceRequest.update({
      where: { id },
      data: {
        status: dto.toStatus,
        quotedAmount: dto.quotedAmount,
        currency: dto.currency ?? request.currency,
        statusLogs: {
          create: {
            fromStatus: request.status,
            toStatus: dto.toStatus,
            changedByUserId: actorUserId,
            note: dto.note,
          },
        },
      },
    });

    if (
      dto.toStatus === ServiceRequestStatus.QUOTED &&
      dto.quotedAmount !== undefined
    ) {
      await this.invoices.createDraft({
        userId: request.requesterUserId,
        organizationId: request.organizationId ?? undefined,
        institutionId: request.institutionId ?? undefined,
        serviceRequestId: request.id,
        currency: dto.currency ?? request.currency,
        notes: `Change Liberia Studio — ${request.title}`,
        lineItems: [
          { description: request.title, unitAmount: dto.quotedAmount },
        ],
      });
    }

    return updated;
  }
}
