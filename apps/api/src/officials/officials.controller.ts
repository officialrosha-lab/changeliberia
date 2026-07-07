import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionResource, PermissionAction, GovernmentResponseStage } from '@prisma/client';
import { OfficialOwnershipGuard, OfficialAccess } from './guards/official-ownership.guard';
import { OfficialsService } from './officials.service';
import { OfficialInboxService } from './official-inbox.service';
import { ResponseWorkflowService } from './response-workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdvanceResponseStageDto,
  CreateOfficialApplicationDto,
  UpdateOfficialProfileDto,
} from './dto';

interface OfficialRequest {
  officialAccess?: OfficialAccess;
  officialInstitution?: { id: string };
}

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

const RESPONSE_STAGES = Object.values(GovernmentResponseStage);

function parsePagination(page: string, limit: string) {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const safePage = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit >= 1 ? Math.min(parsedLimit, 50) : 20;
  return { page: safePage, take: safeLimit, skip: (safePage - 1) * safeLimit };
}

@Controller('officials')
export class OfficialsController {
  constructor(
    private readonly officialsService: OfficialsService,
    private readonly inboxService: OfficialInboxService,
    private readonly responseWorkflow: ResponseWorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(@CurrentUser() user: AuthUser, @Body() dto: CreateOfficialApplicationDto) {
    return this.officialsService.apply(user.userId, dto);
  }

  // Intentionally not gated by OfficialOwnershipGuard/PermissionGuard: this is
  // the status-check endpoint the frontend polls for pending/rejected
  // applicants (who don't hold OFFICIAL RBAC permissions or VERIFIED status
  // yet). getMyInstitution() already scopes strictly to the caller's own
  // holderUserId, so JwtAuthGuard alone is sufficient here.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthUser) {
    return this.officialsService.getMyInstitution(user.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.UPDATE)
  async updateMyProfile(@Req() req: OfficialRequest, @Body() dto: UpdateOfficialProfileDto) {
    if (!req.officialAccess?.isOfficeholder && !req.officialAccess?.canDraft) {
      throw new ForbiddenException('You do not have permission to edit this profile');
    }
    return this.officialsService.updateMyProfile(req.officialInstitution!.id, dto);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getDashboard(@CurrentUser() user: AuthUser) {
    const institution = await this.officialsService.getMyInstitution(user.userId);

    const [byStage, unreadMessages, totalPetitions, directlyAffectedCount] = await Promise.all([
      this.prisma.petitionGovernmentResponse.groupBy({
        by: ['currentStage'],
        where: { institutionId: institution.id },
        _count: { id: true },
      }),
      this.inboxService.getUnreadCount(user.userId),
      this.prisma.petitionGovernmentResponse.count({ where: { institutionId: institution.id } }),
      this.prisma.signatureLocation.count({
        where: {
          classification: 'DIRECTLY_AFFECTED',
          signature: { petition: { governmentResponses: { some: { institutionId: institution.id } } } },
        },
      }),
    ]);

    return {
      institution: { id: institution.id, name: institution.name, county: institution.county, district: institution.district },
      petitionsByStage: byStage.map((s) => ({ stage: s.currentStage, count: s._count.id })),
      totalPetitions,
      unreadInboxCount: unreadMessages,
      // Petition Location Verification & Impact Area System (Phase 2)
      directlyAffectedCount,
    };
  }

  @Get('me/constituency')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getConstituency(@CurrentUser() user: AuthUser) {
    const institution = await this.officialsService.getMyInstitution(user.userId);
    if (!institution.county) {
      return {
        county: null,
        district: institution.district,
        petitionsCount: 0,
        signaturesTotal: 0,
        topCategories: [],
        directlyAffectedCount: 0,
        nearbyCommunityCount: 0,
        topAffectedAreas: [],
      };
    }

    const countyPetitionFilter = { county: institution.county, status: 'APPROVED' as const };

    const [petitionsCount, signaturesAgg, topCategories, directlyAffectedCount, nearbyCommunityCount, topAffectedAreas] =
      await Promise.all([
        this.prisma.petition.count({ where: countyPetitionFilter }),
        this.prisma.petition.aggregate({
          where: countyPetitionFilter,
          _sum: { signaturesCount: true },
        }),
        this.prisma.petition.groupBy({
          by: ['category'],
          where: countyPetitionFilter,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),
        this.prisma.signatureLocation.count({
          where: { classification: 'DIRECTLY_AFFECTED', signature: { petition: countyPetitionFilter } },
        }),
        this.prisma.signatureLocation.count({
          where: { classification: 'NEARBY_COMMUNITY', signature: { petition: countyPetitionFilter } },
        }),
        this.prisma.signatureLocation.groupBy({
          by: ['community'],
          where: { community: { not: null }, signature: { petition: countyPetitionFilter } },
          _count: { _all: true },
          orderBy: { _count: { community: 'desc' } },
          take: 5,
        }),
      ]);

    return {
      county: institution.county,
      district: institution.district,
      petitionsCount,
      signaturesTotal: signaturesAgg._sum.signaturesCount ?? 0,
      topCategories: topCategories.map((c) => ({ category: c.category, count: c._count.id })),
      // Petition Location Verification & Impact Area System (Phase 2):
      // how much of the county's support is directly affected vs. nearby,
      // and which communities have the most concentrated concern.
      directlyAffectedCount,
      nearbyCommunityCount,
      topAffectedAreas: topAffectedAreas.map((a) => ({ community: a.community as string, count: a._count._all })),
    };
  }

  @Get('me/feed')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getFeed(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const institution = await this.officialsService.getMyInstitution(user.userId);
    const { page: safePage, take, skip } = parsePagination(page, limit);

    const [rows, total] = await Promise.all([
      this.prisma.petitionGovernmentResponse.findMany({
        where: { institutionId: institution.id },
        include: {
          petition: {
            select: {
              id: true, title: true, summary: true, category: true, county: true,
              signaturesCount: true, goal: true, status: true, createdAt: true,
              // Public Officials Portal: cross-institution collaboration —
              // surface which other institutions are also handling this
              // petition, so the official knows they're not the only one.
              governmentResponses: {
                select: { institutionId: true, currentStage: true, institution: { select: { id: true, name: true, slug: true } } },
              },
            },
          },
          timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.petitionGovernmentResponse.count({ where: { institutionId: institution.id } }),
    ]);

    const data = rows.map((row) => {
      const { governmentResponses, ...petitionRest } = row.petition;
      const collaboratingInstitutions = governmentResponses
        .filter((gr) => gr.institutionId !== institution.id)
        .map((gr) => ({ id: gr.institution.id, name: gr.institution.name, slug: gr.institution.slug, stage: gr.currentStage }));
      return { ...row, petition: petitionRest, collaboratingInstitutions };
    });

    return { data, pagination: { page: safePage, limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  @Get('me/inbox')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.INBOX, PermissionAction.READ)
  async getInbox(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('stage') stage?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    if (stage && !RESPONSE_STAGES.includes(stage as GovernmentResponseStage)) {
      throw new BadRequestException(`Invalid stage filter: ${stage}`);
    }

    const institution = await this.officialsService.getMyInstitution(user.userId);
    const { page: safePage, take } = parsePagination(page, limit);
    return this.inboxService.getInbox(
      institution.id,
      user.userId,
      { stage, unreadOnly: unreadOnly === 'true' },
      safePage,
      take,
    );
  }

  @Post('responses/:responseId/advance')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.RESPONSE, PermissionAction.UPDATE)
  async advanceResponse(
    @CurrentUser() user: AuthUser,
    @Req() req: OfficialRequest,
    @Param('responseId') responseId: string,
    @Body() dto: AdvanceResponseStageDto,
  ) {
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && !req.officialAccess?.canRespond) {
      throw new ForbiddenException('You do not have permission to publish responses on behalf of this office');
    }
    return this.responseWorkflow.advanceStage(
      responseId,
      dto.stage,
      dto.note,
      user.userId,
      isAdmin,
      req.officialInstitution?.id,
    );
  }

  // Public: petition timelines are always visible to citizens, no auth required
  @Get('responses/:petitionId')
  getResponses(@Param('petitionId') petitionId: string) {
    return this.responseWorkflow.getPublicTimeline(petitionId);
  }
}
