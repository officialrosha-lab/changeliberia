import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PetitionsService } from '../petitions/petitions.service';
import { RolePermissionService } from '../rbac/role-permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { PetitionStatus } from '@prisma/client';
import {
  PetitionApprovedEvent,
  PetitionRejectedEvent,
} from '../events/domain-events';

@Controller('moderator')
@UseGuards(JwtAuthGuard)
export class ModeratorController {
  constructor(
    private petitionsService: PetitionsService,
    private rolePermissionService: RolePermissionService,
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Get pending petitions for moderator review (filtered by moderator scope)
   */
  @Get('petitions')
  async getPetitions(
    @CurrentUser() user: { id: string; email: string },
    @Query('status') status?: string,
  ) {
    // Check permission
    const can = await this.rolePermissionService.hasPermission(user.id, 'PETITION', 'APPROVE');
    if (!can) {
      throw new Error('No permission to review petitions');
    }

    const statusFilter = status as PetitionStatus | undefined;

    // TODO: In production, implement category scoping via role metadata or separate ModeratorScope table
    // For now, return all pending petitions for the moderator

    return this.prisma.petition.findMany({
      where: {
        status: statusFilter || 'PENDING',
      },
      include: {
        creator: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get moderator's scope (allowed categories)
   */
  @Get('scope')
  async getScope(@CurrentUser() user: { id: string; email: string }) {
    // TODO: In production, implement via ModeratorScope table or role metadata
    // For now, return empty (all categories allowed)
    return {
      allowedCategories: [],
    };
  }

  /**
   * Approve a petition
   */
  @Post('petitions/:id/approve')
  async approvePetition(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') petitionId: string,
    @Body('feedback') feedback?: string,
  ) {
    // Check permission
    const can = await this.rolePermissionService.hasPermission(user.id, 'PETITION', 'APPROVE');
    if (!can) {
      throw new Error('No permission to approve petitions');
    }

    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new Error('Petition not found');
    }

    // Update petition status
    const updatedPetition = await this.prisma.petition.update({
      where: { id: petitionId },
      data: {
        status: 'APPROVED' as PetitionStatus,
        updatedAt: new Date(),
      },
    });

    // Publish domain event for notification trigger
    await this.eventBus.publish(
      new PetitionApprovedEvent(
        petitionId,
        petition.creatorId,
        petition.title,
        user.id,
      ),
    );

    return { success: true, message: 'Petition approved' };
  }

  /**
   * Reject a petition
   */
  @Post('petitions/:id/reject')
  async rejectPetition(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') petitionId: string,
    @Body('reason') reason: string,
  ) {
    // Check permission
    const can = await this.rolePermissionService.hasPermission(user.id, 'PETITION', 'REJECT');
    if (!can) {
      throw new Error('No permission to reject petitions');
    }

    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new Error('Petition not found');
    }

    // Update petition status
    await this.prisma.petition.update({
      where: { id: petitionId },
      data: {
        status: 'REJECTED' as PetitionStatus,
        updatedAt: new Date(),
      },
    });

    // Publish domain event for notification trigger
    await this.eventBus.publish(
      new PetitionRejectedEvent(
        petitionId,
        petition.creatorId,
        petition.title,
        reason,
        user.id,
      ),
    );

    return { success: true, message: 'Petition rejected', reason };
  }

  /**
   * Get moderator statistics
   */
  @Get('stats')
  async getModerationStats(
    @CurrentUser() user: { id: string; email: string },
    @Query('days') daysStr?: string,
  ) {
    const days = parseInt(daysStr || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Query petitions reviewed by this moderator
    // This assumes we're tracking moderator actions - using petition timestamps as proxy
    const petitions = await this.prisma.petition.findMany({
      where: {
        updatedAt: { gte: since },
      },
    });

    const reviewed = petitions.length;
    const approved = petitions.filter((p) => p.status === 'APPROVED').length;
    const rejected = petitions.filter((p) => p.status === 'REJECTED').length;

    return {
      petitionsReviewed: reviewed,
      petitionsApproved: approved,
      petitionsRejected: rejected,
      averageReviewTime: 15, // Placeholder - would need tracking in production
      approvalRate: reviewed > 0 ? approved / reviewed : 0,
      flagsReviewed: 0, // Placeholder
      fraudFlagsResolved: 0, // Placeholder
    };
  }

  /**
   * Get fraud flags for moderator review
   */
  @Get('fraud-flags')
  async getFraudFlags(
    @CurrentUser() user: { id: string; email: string },
    @Query('status') status?: string,
  ) {
    // Check permission
    const can = await this.rolePermissionService.hasPermission(user.id, 'PETITION', 'APPROVE');
    if (!can) {
      throw new Error('No permission to review fraud flags');
    }

    // Placeholder: return empty array until FraudLog model is added to schema
    // In production, would query FraudLog model filtered by status
    const statusFilter = status === 'all' ? undefined : status || 'PENDING';

    // Mock data structure:
    return [];
    /*
    return this.prisma.fraudLog.findMany({
      where: {
        status: statusFilter,
      },
      include: {
        petition: { select: { id: true, title: true } },
        user: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    */
  }

  /**
   * Resolve a fraud flag
   */
  @Post('fraud-flags/:id/resolve')
  async resolveFraudFlag(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') flagId: string,
    @Body('action') action: 'approve' | 'ban' | 'dismiss',
    @Body('notes') notes?: string,
  ) {
    // Check permission
    const can = await this.rolePermissionService.hasPermission(user.id, 'PETITION', 'APPROVE');
    if (!can) {
      throw new Error('No permission to resolve fraud flags');
    }

    // Implementation would depend on FraudLog model
    // For now, return success
    return { success: true, message: 'Fraud flag resolved', action, notes };
  }
}
