import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /whatsapp/generate-message
   * Generates a WhatsApp message for sharing a petition
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Post('generate-message')
  async generateMessage(
    @Body() dto: { petitionId: string; signerName?: string },
    @Req() req: { user?: { userId: string } },
  ) {
    if (!dto.petitionId) {
      throw new BadRequestException('petitionId is required');
    }

    const petition = await this.prisma.petition.findUnique({
      where: { id: dto.petitionId },
    });

    if (!petition) {
      throw new NotFoundException('Petition not found');
    }

    try {
      const message = await this.whatsappService.generateWhatsAppMessage(
        dto.petitionId,
        this.whatsappService.generateReferralCode(), // Generate temp code
        dto.signerName,
      );

      return {
        success: true,
        message,
        petitionId: dto.petitionId,
        petitionTitle: petition.title,
      };
    } catch (error) {
      this.logger.error('Failed to generate message', error);
      throw new BadRequestException('Failed to generate message');
    }
  }

  /**
   * POST /whatsapp/create-referral
   * Creates a referral link for a petition
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  @Post('create-referral')
  async createReferral(
    @Body() dto: { petitionId: string },
    @Req() req: { user: { userId: string } },
  ) {
    if (!dto.petitionId) {
      throw new BadRequestException('petitionId is required');
    }

    const petition = await this.prisma.petition.findUnique({
      where: { id: dto.petitionId },
    });

    if (!petition) {
      throw new NotFoundException('Petition not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const referralCode = this.whatsappService.generateReferralCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiration

      // Generate WhatsApp message
      const whatsappMessage = await this.whatsappService.generateWhatsAppMessage(
        dto.petitionId,
        referralCode,
        user.fullName,
      );

      // Create share link
      const shareUrl = await this.whatsappService.createShareLink(
        dto.petitionId,
        referralCode,
        'whatsapp',
        'organic',
      );

      // Create referral record
      const referral = await this.prisma.referral.create({
        data: {
          petitionId: dto.petitionId,
          referrerId: req.user.userId,
          referralCode,
          shareUrl,
          whatsappMessage,
          expiresAt,
        },
      });

      return {
        success: true,
        referralCode: referral.referralCode,
        shareUrl: referral.shareUrl,
        whatsappMessage: referral.whatsappMessage,
        expiresAt: referral.expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to create referral', error);
      throw new BadRequestException('Failed to create referral');
    }
  }

  /**
   * GET /whatsapp/share-link/:shortCode
   * Redirects share link click and records analytics
   * This is the /r/abc123 endpoint that gets shared
   */
  @Get('share-link/:shortCode')
  async followShareLink(
    @Param('shortCode') shortCode: string,
    @Query() query: Record<string, any>,
  ) {
    try {
      const shareLink = await this.prisma.shareLink.findUnique({
        where: { shortCode },
        include: { petition: true },
      });

      if (!shareLink) {
        throw new NotFoundException('Share link not found');
      }

      // Track the click
      await this.whatsappService.trackShareLinkClick(shortCode);

      // Return redirect response
      return {
        success: true,
        redirectUrl: shareLink.targetUrl,
        petitionId: shareLink.petitionId,
        source: shareLink.source,
        trackingData: {
          shortCode,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to follow share link ${shortCode}`, error);
      throw new NotFoundException('Share link not found');
    }
  }

  /**
   * POST /whatsapp/track-conversion
   * Marks a referral as converted (user signed petition)
   */
  @UseGuards(JwtAuthGuard)
  @Post('track-conversion')
  async trackConversion(
    @Body() dto: { referralCode: string; signatureId: string; trustBonus?: number },
    @Req() req: { user: { userId: string } },
  ) {
    if (!dto.referralCode || !dto.signatureId) {
      throw new BadRequestException('referralCode and signatureId are required');
    }

    try {
      const referral = await this.prisma.referral.findUnique({
        where: { referralCode: dto.referralCode },
      });

      if (!referral) {
        throw new NotFoundException('Referral not found');
      }

      await this.whatsappService.markReferralConverted(
        referral.id,
        dto.signatureId,
        dto.trustBonus || 5,
      );

      return {
        success: true,
        message: 'Referral converted successfully',
        trustBonusApplied: dto.trustBonus || 5,
      };
    } catch (error) {
      this.logger.error('Failed to track conversion', error);
      throw new BadRequestException('Failed to track conversion');
    }
  }

  /**
   * GET /whatsapp/metrics/:petitionId
   * Gets referral metrics for a petition
   */
  @Get('metrics/:petitionId')
  async getReferralMetrics(@Param('petitionId') petitionId: string) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new NotFoundException('Petition not found');
    }

    try {
      const metrics = await this.whatsappService.getReferralMetrics(petitionId);
      const topReferrers = await this.whatsappService.getTopReferrers(petitionId, 5);

      return {
        success: true,
        petitionId,
        metrics,
        topReferrers: topReferrers.map((ref) => ({
          referrer: ref.referrer,
          trustBonus: ref.trustBonusApplied,
          status: ref.status,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get metrics', error);
      throw new BadRequestException('Failed to get metrics');
    }
  }

  /**
   * GET /whatsapp/referral/:referralCode
   * Gets details about a specific referral
   */
  @Get('referral/:referralCode')
  async getReferralDetails(@Param('referralCode') referralCode: string) {
    try {
      const referral = await this.whatsappService.getReferralDetails(referralCode);

      if (!referral) {
        throw new NotFoundException('Referral not found');
      }

      return {
        success: true,
        referral,
      };
    } catch (error) {
      this.logger.error('Failed to get referral details', error);
      throw new NotFoundException('Referral not found');
    }
  }

  /**
   * GET /whatsapp/my-referrals
   * Gets all referrals created by the current user
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-referrals')
  async getMyReferrals(@Req() req: { user: { userId: string } }) {
    try {
      const referrals = await this.prisma.referral.findMany({
        where: { referrerId: req.user.userId },
        include: {
          petition: {
            select: {
              id: true,
              title: true,
              signaturesCount: true,
              goal: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate stats
      const stats = {
        total: referrals.length,
        converted: referrals.filter((r) => r.status === 'CONVERTED').length,
        totalBonusEarned: referrals.reduce((sum, r) => sum + r.trustBonusApplied, 0),
        totalClicks: referrals.reduce((sum, r) => sum + r.clickCount, 0),
      };

      return {
        success: true,
        stats,
        referrals,
      };
    } catch (error) {
      this.logger.error('Failed to get referrals', error);
      throw new BadRequestException('Failed to get referrals');
    }
  }
}
