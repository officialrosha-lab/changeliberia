import { Injectable, UnauthorizedException } from '@nestjs/common';
import { VerificationStatus, VerificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly otpStore = new Map<string, { code: string; expiresAt: number }>();

  requestPhoneOtp(phone: string): { success: boolean } {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    // TODO: integrate SMS provider (Twilio, Africa's Talking, etc.)
    console.log(`[OTP] ${phone} → ${code}`);
    return { success: true };
  }

  async verifyPhoneOtp(userId: string, phone: string, code: string) {
    const entry = this.otpStore.get(phone);
    if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }
    this.otpStore.delete(phone);
    return this.applyEvent(userId, VerificationType.OTP, 40, `Phone verified: ${phone}`);
  }

  async recomputeTrust(userId: string) {
    const logs = await this.prisma.verificationLog.findMany({
      where: { userId },
    });
    const score = Math.max(
      0,
      Math.min(
        100,
        logs.reduce((acc, l) => acc + l.delta, 0),
      ),
    );
    const status = this.resolveStatus(
      score,
      logs.some((l) => l.type === VerificationType.IP_GEO && l.delta > 0),
    );
    return this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: score, verificationStatus: status },
    });
  }

  async applyEvent(
    userId: string,
    type: VerificationType,
    delta: number,
    details: string,
  ) {
    await this.prisma.verificationLog.create({
      data: { userId, type, delta, details },
    });
    return this.recomputeTrust(userId);
  }

  private resolveStatus(score: number, liberiaIp: boolean): VerificationStatus {
    if (score >= 80) return VerificationStatus.HIGH_TRUST;
    if (liberiaIp && score >= 60) return VerificationStatus.VERIFIED_LIBERIAN;
    if (score >= 40) return VerificationStatus.VERIFIED_DIASPORA;
    return VerificationStatus.UNVERIFIED;
  }
}
