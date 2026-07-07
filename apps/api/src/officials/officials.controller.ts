import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';
import { OfficialOwnershipGuard } from './guards/official-ownership.guard';
import { OfficialsService } from './officials.service';
import { OfficialInboxService } from './official-inbox.service';
import { ResponseWorkflowService } from './response-workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdvanceResponseStageDto,
  CreateOfficialApplicationDto,
  UpdateOfficialProfileDto,
} from './dto';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
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

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  getMe(@CurrentUser() user: AuthUser) {
    return this.officialsService.getMyInstitution(user.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.UPDATE)
  async updateMyProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateOfficialProfileDto) {
    const institution = await this.officialsService.getMyInstitution(user.userId);
    return this.officialsService.updateMyProfile(institution.id, dto);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getDashboard(@CurrentUser() user: AuthUser) {
    const institution = await this.officialsService.getMyInstitution(user.userId);

    const [byStage, unreadMessages, totalPetitions] = await Promise.all([
      this.prisma.petitionGovernmentResponse.groupBy({
        by: ['currentStage'],
        where: { institutionId: institution.id },
        _count: { id: true },
      }),
      this.prisma.message.count({ where: { recipientId: user.userId, isRead: false } }),
      this.prisma.petitionGovernmentResponse.count({ where: { institutionId: institution.id } }),
    ]);

    return {
      institution: { id: institution.id, name: institution.name, county: institution.county, district: institution.district },
      petitionsByStage: byStage.map((s) => ({ stage: s.currentStage, count: s._count.id })),
      totalPetitions,
      unreadInboxCount: unreadMessages,
    };
  }

  @Get('me/constituency')
  @UseGuards(JwtAuthGuard, PermissionGuard, OfficialOwnershipGuard)
  @Permission(PermissionResource.OFFICIAL, PermissionAction.READ)
  async getConstituency(@CurrentUser() user: AuthUser) {
    const institution = await this.officialsService.getMyInstitution(user.userId);
    if (!institution.county) {
      return { county: null, district: institution.district, petitionsCount: 0, signaturesTotal: 0, topCategories: [] };
    }

    const [petitionsCount, signaturesAgg, topCategories] = await Promise.all([
      this.prisma.petition.count({ where: { county: institution.county, status: 'APPROVED' } }),
      this.prisma.petition.aggregate({
        where: { county: institution.county, status: 'APPROVED' },
        _sum: { signaturesCount: true },
      }),
      this.prisma.petition.groupBy({
        by: ['category'],
        where: { county: institution.county, status: 'APPROVED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      county: institution.county,
      district: institution.district,
      petitionsCount,
      signaturesTotal: signaturesAgg._sum.signaturesCount ?? 0,
      topCategories: topCategories.map((c) => ({ category: c.category, count: c._count.id })),
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
    const take = Math.min(parseInt(limit, 10) || 20, 50);
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.petitionGovernmentResponse.findMany({
        where: { institutionId: institution.id },
        include: {
          petition: {
            select: {
              id: true, title: true, summary: true, category: true, county: true,
              signaturesCount: true, goal: true, status: true, createdAt: true,
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

    return { data, pagination: { page: parseInt(page, 10) || 1, limit: take, total, totalPages: Math.ceil(total / take) } };
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
    const institution = await this.officialsService.getMyInstitution(user.userId);
    return this.inboxService.getInbox(
      institution.id,
      user.userId,
      { stage, unreadOnly: unreadOnly === 'true' },
      parseInt(page, 10) || 1,
      Math.min(parseInt(limit, 10) || 20, 50),
    );
  }

  @Post('responses/:responseId/advance')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission(PermissionResource.RESPONSE, PermissionAction.UPDATE)
  async advanceResponse(
    @CurrentUser() user: AuthUser,
    @Param('responseId') responseId: string,
    @Body() dto: AdvanceResponseStageDto,
  ) {
    const isAdmin = user.role === 'ADMIN';
    const institution = isAdmin ? null : await this.officialsService.getMyInstitution(user.userId);
    return this.responseWorkflow.advanceStage(
      responseId,
      dto.stage,
      dto.note,
      user.userId,
      isAdmin,
      institution?.id,
    );
  }

  // Public: petition timelines are always visible to citizens, no auth required
  @Get('responses/:petitionId')
  getResponses(@Param('petitionId') petitionId: string) {
    return this.responseWorkflow.getPublicTimeline(petitionId);
  }
}
