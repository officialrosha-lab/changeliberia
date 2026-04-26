import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * WhatsApp Viral Growth Engine Service
 * Handles message generation, deep link building, and referral tracking
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a WhatsApp-optimized share message for a petition
   * Includes: Liberia identity trigger, urgency, CTA, and referral link
   */
  async generateWhatsAppMessage(
    petitionId: string,
    referralCode: string,
    signerName?: string,
  ): Promise<string> {
    const petition = await this.prisma.petition.findUnique({
      where: { id: petitionId },
    });

    if (!petition) {
      throw new Error(`Petition ${petitionId} not found`);
    }

    // Get current signature count
    const signatureCount = petition.signaturesCount || 0;
    const remainingToGoal = Math.max(0, petition.goal - signatureCount);

    // Build referral URL (must be URL-encoded for WhatsApp)
    const referralUrl = `${process.env.WEB_URL || 'https://changeliberia.com'}/r/${referralCode}`;

    // Determine urgency message based on progress
    let urgencyEmoji = '🔥'; // Default: hot topic
    let urgencyText = `Only ${remainingToGoal} more signatures needed!`;

    if (signatureCount >= petition.goal * 0.75) {
      urgencyEmoji = '⚡';
      urgencyText = `${remainingToGoal} signatures away from submission!`;
    } else if (signatureCount >= petition.goal * 0.5) {
      urgencyEmoji = '📈';
      urgencyText = `${signatureCount} people have signed - JOIN US!`;
    } else if (signatureCount < 10) {
      urgencyEmoji = '🆕';
      urgencyText = 'Be one of the first to sign!';
    }

    // Build message with Liberia identity + urgency + CTA
    const message = [
      `🇱🇷 *${petition.title}*`,
      ``,
      petition.summary,
      ``,
      `${urgencyEmoji} ${urgencyText}`,
      `✍️ Current: ${signatureCount} signatures | Goal: ${petition.goal}`,
      ``,
      ...(signerName ? [`✅ Signed by ${signerName}`, ``] : []),
      `📍 Click to sign & help change Liberia:`,
      referralUrl,
    ].join('\n');

    return message;
  }

  /**
   * Builds a WhatsApp deep link that pre-fills the message
   * Format: https://wa.me/whatsapp_number?text=encoded_message
   */
  buildWhatsAppDeepLink(phoneNumber: string, message: string): string {
    // Remove non-numeric characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Ensure it starts with country code (Liberia is +231)
    const formattedPhone = cleanPhone.startsWith('231')
      ? cleanPhone
      : cleanPhone.replace(/^0+/, '231');

    // URL-encode the message
    const encodedMessage = encodeURIComponent(message);

    // Return WhatsApp API link
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  /**
   * Creates a shareable deep link for a petition with referral tracking
   */
  async createShareLink(
    petitionId: string,
    referralId: string,
    source: string = 'whatsapp',
    medium: string = 'organic',
  ): Promise<string> {
    // Generate short code for tracking
    const shortCode = this.generateShortCode();

    await this.prisma.shareLink.create({
      data: {
        shortCode,
        petitionId,
        referralId,
        targetUrl: `${process.env.WEB_URL || 'https://changeliberia.com'}/petitions/${petitionId}`,
        source,
        medium,
      },
    });

    return `${process.env.WEB_URL || 'https://changeliberia.com'}/r/${shortCode}`;
  }

  /**
   * Tracks a share link click and increments analytics
   */
  async trackShareLinkClick(shortCode: string): Promise<void> {
    await this.prisma.shareLink.update({
      where: { shortCode },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: new Date(),
      },
    });
  }

  /**
   * Marks a referral as converted when user signs petition
   */
  async markReferralConverted(
    referralId: string,
    signatureId: string,
    trustBonus: number = 5, // Default +5 trust score
  ): Promise<void> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: { referrer: true },
    });

    if (!referral) {
      throw new Error(`Referral ${referralId} not found`);
    }

    // Update referral status
    await this.prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'CONVERTED',
        convertedSignatureId: signatureId,
        trustBonusApplied: trustBonus,
        conversionDate: new Date(),
      },
    });

    // Apply trust bonus to referrer
    if (referral.referrer) {
      await this.prisma.user.update({
        where: { id: referral.referrer.id },
        data: {
          trustScore: { increment: trustBonus },
        },
      });

      this.logger.log(
        `Referral ${referralId} converted - ${referral.referrer.fullName} earned +${trustBonus} trust`,
      );
    }
  }

  /**
   * Generates referral metrics for a petition
   */
  async getReferralMetrics(petitionId: string) {
    const referrals = await this.prisma.referral.groupBy({
      by: ['status'],
      where: { petitionId },
      _count: true,
      _sum: {
        trustBonusApplied: true,
        clickCount: true,
      },
    });

    const totalBonusAwarded = await this.prisma.user.aggregate({
      _sum: { trustScore: true },
    });

    return {
      referrals: Object.fromEntries(
        referrals.map((r) => [
          r.status,
          {
            count: r._count,
            totalBonus: r._sum.trustBonusApplied || 0,
            totalClicks: r._sum.clickCount || 0,
          },
        ]),
      ),
      conversionRate: referrals.find((r) => r.status === 'CONVERTED')?._count || 0,
    };
  }

  /**
   * Gets top referrers for a petition
   */
  async getTopReferrers(petitionId: string, limit: number = 10) {
    return this.prisma.referral.findMany({
      where: {
        petitionId,
        status: 'CONVERTED',
      },
      include: {
        referrer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
      orderBy: { trustBonusApplied: 'desc' },
      take: limit,
    });
  }

  /**
   * Generates unique short code for share links
   */
  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generates unique referral code
   */
  generateReferralCode(): string {
    return this.generateShortCode();
  }

  /**
   * Gets referral status and conversion metrics
   */
  async getReferralDetails(referralCode: string) {
    return this.prisma.referral.findUnique({
      where: { referralCode },
      include: {
        petition: {
          select: {
            id: true,
            title: true,
            signaturesCount: true,
            goal: true,
          },
        },
        referrer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });
  }
}
