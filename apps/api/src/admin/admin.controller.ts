import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole, VerificationType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestUser } from '../auth/roles.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from '../verification/verification.service';
import { AdminSocialMediaService } from './admin-social-media.service';
import { ActivityLoggerService } from '../activity/activity-logger.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
    private readonly socialMedia: AdminSocialMediaService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  @Get('petitions/pending')
  pendingPetitions() {
    return this.prisma.petition.findMany({
      where: { status: 'PENDING' },
      select: { id: true, title: true, category: true, summary: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get('polls/pending')
  async pendingPolls() {
    try {
      return await this.prisma.poll.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          category: true,
          county: true,
          createdAt: true,
          creator: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      // Return empty array if Poll table doesn't exist
      console.warn('Poll table not found or query failed:', error);
      return [];
    }
  }

  @Get('id-documents/pending')
  pendingIdDocuments() {
    return this.prisma.iDDocument.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    });
  }

  @Get('users')
  async listUsers(
    @Query('page') page = '0',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(0, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    return this.prisma.user.findMany({
      skip: pageNum * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        trustScore: true,
        verificationStatus: true,
        createdAt: true,
      },
    });
  }

  @Delete('petitions/:id')
  async deletePetition(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    try {
      const petition = await this.prisma.petition.findUnique({ where: { id } });
      if (!petition) throw new NotFoundException('Petition not found');

      // Delete all child records explicitly — do not rely on DB-level cascades
      // because cascade migrations may not have run on the production database.
      await this.prisma.$transaction(async (tx) => {
        await tx.fraudEvent.deleteMany({ where: { petitionId: id } });
        await tx.signature.deleteMany({ where: { petitionId: id } });
        await tx.petitionComment.deleteMany({ where: { petitionId: id } });
        await tx.petitionFollower.deleteMany({ where: { petitionId: id } });
        await tx.petitionUpdate.deleteMany({ where: { petitionId: id } });
        await tx.petitionSubmission.deleteMany({ where: { petitionId: id } });
        await tx.petitionMilestone.deleteMany({ where: { petitionId: id } });
        await tx.socialEngagementBadge.deleteMany({ where: { petitionId: id } });
        await tx.customAudience.deleteMany({ where: { petitionId: id } });
        // ShareLink before Referral — ShareLink.referralId is SetNull, not Cascade
        await tx.shareLink.deleteMany({ where: { petitionId: id } });
        await tx.referral.deleteMany({ where: { petitionId: id } });
        await tx.routingLog.deleteMany({ where: { petitionId: id } });
        await tx.petition.delete({ where: { id } });
      });

      // Log the deletion action
      this.activityLogger.logAsync({
        userId: petition.creatorId,
        adminId: req.user.userId,
        action: 'DELETE_PETITION',
        entityType: 'PETITION',
        entityId: id,
        description: `Admin deleted petition: "${petition.title}"`,
        changes: { status: petition.status, action: 'deletion' },
      });

      return { success: true, message: 'Petition deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[admin] deletePetition ${id} failed:`, msg);
      throw new InternalServerErrorException(`Failed to delete petition: ${msg}`);
    }
  }

  @Patch('id-documents/:id')
  async reviewDoc(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    const doc = await this.prisma.iDDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    const updated = await this.prisma.iDDocument.update({
      where: { id },
      data: { status: body.status, reviewedBy: req.user.userId },
    });
    
    // Log the ID document review action
    const action = body.status === 'APPROVED' ? 'APPROVE_ID_DOCUMENT' : 'REJECT_ID_DOCUMENT';
    this.activityLogger.logAsync({
      userId: doc.userId,
      adminId: req.user.userId,
      action,
      entityType: 'ID_DOCUMENT',
      entityId: id,
      description: `Admin ${body.status === 'APPROVED' ? 'approved' : 'rejected'} ID document (${doc.type})`,
      changes: { previousStatus: doc.status, newStatus: body.status },
    });
    
    if (body.status === 'APPROVED') {
      const prior = await this.prisma.verificationLog.findFirst({
        where: { userId: doc.userId, type: VerificationType.ID_UPLOAD },
      });
      if (!prior) {
        await this.verification.applyEvent(
          doc.userId,
          VerificationType.ID_UPLOAD,
          30,
          `Government ID approved (${doc.type})`,
        );
      }
    }
    return updated;
  }

  @Get('fraud/flags')
  async flags() {
    const [verificationFlags, fraudEvents] = await Promise.all([
      this.prisma.verificationLog.findMany({
        where: { type: 'FRAUD' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.fraudEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return [
      ...verificationFlags.map((entry) => ({
        id: entry.id,
        details: entry.details,
        createdAt: entry.createdAt,
      })),
      ...fraudEvents.map((entry) => ({
        id: entry.id,
        details: `${entry.ruleKey}: ${entry.details}`,
        createdAt: entry.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);
  }

  // ==================== Social Media Admin Endpoints ====================

  /**
   * Social Media Dashboard - Overview of Facebook and WhatsApp integrations
   */
  @Get('social-media/dashboard')
  async getSocialMediaDashboard() {
    return this.socialMedia.getSocialMediaDashboard();
  }

  /**
   * Facebook Integration Health and Configuration
   */
  @Get('social-media/facebook/health')
  async getFacebookHealth() {
    return this.socialMedia.getFacebookHealth();
  }

  /**
   * Facebook Pixel Event Statistics
   */
  @Get('social-media/facebook/pixel-stats')
  async getFacebookPixelStats(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.socialMedia.getFacebookPixelStats(daysNum);
  }

  /**
   * WhatsApp Integration Health and Configuration
   */
  @Get('social-media/whatsapp/health')
  async getWhatsAppHealth() {
    return this.socialMedia.getWhatsAppHealth();
  }

  /**
   * WhatsApp Viral Growth Metrics
   */
  @Get('social-media/whatsapp/growth-metrics')
  async getWhatsAppGrowthMetrics(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.socialMedia.getWhatsAppGrowthMetrics(daysNum);
  }

  /**
   * WhatsApp Campaign Statistics
   */
  @Get('social-media/whatsapp/campaign-stats')
  async getWhatsAppCampaignStats() {
    return this.socialMedia.getWhatsAppCampaignStats();
  }
}
