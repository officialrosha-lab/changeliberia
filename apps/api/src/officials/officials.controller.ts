import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { S3StorageService } from '../storage/s3-storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  PermissionResource,
  PermissionAction,
  GovernmentResponseStage,
  ConstituencyReportPeriod,
} from '@prisma/client';
import {
  OfficialOwnershipGuard,
  OfficialAccess,
} from './guards/official-ownership.guard';
import { OfficialsService } from './officials.service';
import { OfficialInboxService } from './official-inbox.service';
import { ResponseWorkflowService } from './response-workflow.service';
import {
  ConstituencyFeedService,
  ConstituencyFeedFilters,
} from './constituency-feed.service';
import { ConstituencyReportService } from './constituency-report.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdvanceResponseStageDto,
  ClaimInstitutionDto,
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
  const safePage =
    Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const safeLimit =
    Number.isInteger(parsedLimit) && parsedLimit >= 1
      ? Math.min(parsedLimit, 50)
      : 20;
  return { page: safePage, take: safeLimit, skip: (safePage - 1) * safeLimit };
}

@Controller('officials')
export class OfficialsController {
  constructor(
    private readonly officialsService: OfficialsService,
    private readonly inboxService: OfficialInboxService,
    private readonly responseWorkflow: ResponseWorkflowService,
    private readonly constituencyFeed: ConstituencyFeedService,
    private readonly constituencyReport: ConstituencyReportService,
    private readonly prisma: PrismaService,
    private readonly s3: S3StorageService,
  ) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOfficialApplicationDto,
  ) {
    return this.officialsService.apply(user.userId, dto);
  }

  // JwtAuthGuard only (like apply/me): applicants hold no OFFICIAL RBAC role
  // yet. Returns only unheld directory entries with masked emails.
  @Get('claimable')
  @UseGuards(JwtAuthGuard)
  listClaimable(@Query('search') search = '') {
    return this.officialsService.listClaimable(search);
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard)
  claim(@CurrentUser() user: AuthUser, @Body() dto: ClaimInstitutionDto) {
    return this.officialsService.claim(user.userId, dto);
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
  async updateMyProfile(
    @Req() req: OfficialRequest,
    @Body() dto: UpdateOfficialProfileDto,
  ) {
    if (!req.officialAccess?.isOfficeholder && !req.officialAccess?.canDraft) {
      throw new ForbiddenException(
        'You do not have permission to edit this profile',
      );
    }
    return this.officialsService.updateMyProfile(
      req.officialInstitution!.id,
      dto,
    );
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getDashboard(@CurrentUser() user: AuthUser) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );

    const [byStage, unreadMessages, totalPetitions, directlyAffectedCount] =
      await Promise.all([
        this.prisma.petitionGovernmentResponse.groupBy({
          by: ['currentStage'],
          where: { institutionId: institution.id },
          _count: { id: true },
        }),
        this.inboxService.getUnreadCount(user.userId),
        this.prisma.petitionGovernmentResponse.count({
          where: { institutionId: institution.id },
        }),
        this.prisma.signatureLocation.count({
          where: {
            classification: 'DIRECTLY_AFFECTED',
            signature: {
              petition: {
                governmentResponses: {
                  some: { institutionId: institution.id },
                },
              },
            },
          },
        }),
      ]);

    return {
      institution: {
        id: institution.id,
        name: institution.name,
        county: institution.county,
        district: institution.district,
      },
      petitionsByStage: byStage.map((s) => ({
        stage: s.currentStage,
        count: s._count.id,
      })),
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
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    // Delegates to ConstituencyFeedService.getConstituencySummary(), the
    // single source of truth also used by the report generator (Milestone 5)
    // — fixes the previously hardcoded `{ county: institution.county }`-only
    // filter that silently ignored district scoping for Representatives.
    return this.constituencyFeed.getConstituencySummary(institution);
  }

  @Get('me/constituency/petitions')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getConstituencyPetitions(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('category') category?: string,
  ) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    const filters: ConstituencyFeedFilters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      category,
    };
    return this.constituencyFeed.getConstituencyPetitionFeed(
      institution,
      filters,
    );
  }

  @Get('me/constituency/polls')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getConstituencyPolls(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('category') category?: string,
  ) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    const filters: ConstituencyFeedFilters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      category,
    };
    return this.constituencyFeed.getConstituencyPollFeed(institution, filters);
  }

  @Get('me/constituency/issues')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getConstituencyIssues(
    @CurrentUser() user: AuthUser,
    @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    return this.constituencyFeed.getIssueTrends(institution, period);
  }

  @Get('me/constituency/community')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getConstituencyCommunity(@CurrentUser() user: AuthUser) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    return this.constituencyFeed.getCommunityInsights(institution);
  }

  @Get('me/reports')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async listReports(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    return this.constituencyReport.listReports(
      institution.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Post('me/reports/generate')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.UPDATE)
  async generateReport(
    @CurrentUser() user: AuthUser,
    @Req() req: OfficialRequest,
    @Body() body: { period?: ConstituencyReportPeriod },
  ) {
    if (
      !req.officialAccess?.isOfficeholder &&
      !req.officialAccess?.canGenerateReports
    ) {
      throw new ForbiddenException(
        'You do not have permission to generate reports for this office',
      );
    }
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    const period = body.period ?? ConstituencyReportPeriod.MONTHLY;
    if (!Object.values(ConstituencyReportPeriod).includes(period)) {
      throw new BadRequestException(`Invalid report period: ${String(period)}`);
    }
    return this.constituencyReport.enqueueOnDemandReport(institution, period);
  }

  @Get('me/reports/preferences')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getReportPreferences(@CurrentUser() user: AuthUser) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    return this.constituencyReport.getPreference(institution.id);
  }

  @Patch('me/reports/preferences')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.UPDATE)
  async updateReportPreferences(
    @CurrentUser() user: AuthUser,
    @Req() req: OfficialRequest,
    @Body()
    body: {
      weeklyEnabled?: boolean;
      monthlyEnabled?: boolean;
      quarterlyEnabled?: boolean;
      annualEnabled?: boolean;
    },
  ) {
    if (!req.officialAccess?.isOfficeholder) {
      throw new ForbiddenException(
        'Only the officeholder can change report preferences',
      );
    }
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    return this.constituencyReport.upsertPreference(
      institution.id,
      user.userId,
      body,
    );
  }

  @Get('me/reports/:reportId/download/:format')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async downloadReport(
    @CurrentUser() user: AuthUser,
    @Param('reportId') reportId: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    const normalizedFormat = format.toUpperCase();
    if (normalizedFormat !== 'PDF' && normalizedFormat !== 'CSV') {
      throw new BadRequestException('Format must be PDF or CSV');
    }
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    const key = await this.constituencyReport.getReportFile(
      institution.id,
      reportId,
      normalizedFormat,
    );
    const obj = await this.s3.getObject(key);
    if (!obj) throw new NotFoundException('Report file not found');
    res.setHeader(
      'Content-Type',
      obj.contentType ??
        (normalizedFormat === 'PDF' ? 'application/pdf' : 'text/csv'),
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="constituency-report-${reportId}.${normalizedFormat.toLowerCase()}"`,
    );
    res.send(obj.buffer);
  }

  /**
   * Matches the URL embedded in the CONSTITUENCY_REPORT_READY email.
   * Note: like the download route above, this still requires a Bearer
   * token — a bare click from an email client won't authenticate. Real
   * fix needs a frontend page (or a signed, token-less URL scheme) to
   * deep-link into; out of scope here, this just makes the route behave
   * like every other authenticated download instead of a hard 404.
   */
  @Get('me/reports/files/:filename')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async downloadReportByFilename(
    @CurrentUser() user: AuthUser,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    const { key, format } =
      await this.constituencyReport.getReportFileByFilename(
        institution.id,
        filename,
      );
    const obj = await this.s3.getObject(key);
    if (!obj) throw new NotFoundException('Report file not found');
    res.setHeader(
      'Content-Type',
      obj.contentType ?? (format === 'PDF' ? 'application/pdf' : 'text/csv'),
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(obj.buffer);
  }

  @Get('me/feed')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getFeed(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
    const { page: safePage, take, skip } = parsePagination(page, limit);

    const [rows, total] = await Promise.all([
      this.prisma.petitionGovernmentResponse.findMany({
        where: { institutionId: institution.id },
        include: {
          petition: {
            select: {
              id: true,
              title: true,
              summary: true,
              category: true,
              county: true,
              signaturesCount: true,
              goal: true,
              status: true,
              createdAt: true,
              // Public Officials Portal: cross-institution collaboration —
              // surface which other institutions are also handling this
              // petition, so the official knows they're not the only one.
              governmentResponses: {
                select: {
                  institutionId: true,
                  currentStage: true,
                  institution: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
          timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.petitionGovernmentResponse.count({
        where: { institutionId: institution.id },
      }),
    ]);

    const data = rows.map((row) => {
      const { governmentResponses, ...petitionRest } = row.petition;
      const collaboratingInstitutions = governmentResponses
        .filter((gr) => gr.institutionId !== institution.id)
        .map((gr) => ({
          id: gr.institution.id,
          name: gr.institution.name,
          slug: gr.institution.slug,
          stage: gr.currentStage,
        }));
      return { ...row, petition: petitionRest, collaboratingInstitutions };
    });

    return {
      data,
      pagination: {
        page: safePage,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
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

    const institution = await this.officialsService.getMyInstitution(
      user.userId,
    );
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
      throw new ForbiddenException(
        'You do not have permission to publish responses on behalf of this office',
      );
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
