import { Injectable, UnauthorizedException } from '@nestjs/common';
import { VerificationStatus, VerificationType } from '@prisma/client';
import { SmsService } from '../sms/sms.service';
import { PrismaService } from '../prisma/prisma.service';

function normalizePhone(raw: string): string {
  // Strip spaces, dashes, dots, parentheses
  let p = raw.replace(/[\s\-().]/g, '');

  if (p.startsWith('+')) {
    const digits = p.slice(1);
    // +2310XXXXXXX → +231XXXXXXX (leading 0 after Liberian country code)
    if (digits.startsWith('2310')) return '+231' + digits.slice(4);
    return p;
  }

  // 2310XXXXXXX or 231XXXXXXX
  if (p.startsWith('231')) {
    const local = p.slice(3).replace(/^0+/, '');
    return '+231' + local;
  }

  // 0XXXXXXX (local Liberian format)
  if (p.startsWith('0')) return '+231' + p.slice(1);

  // bare digits — assume Liberian
  return '+231' + p;
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  private readonly otpStore = new Map<string, { code: string; expiresAt: number }>();

  async requestPhoneOtp(phone: string): Promise<{ success: boolean }> {
    const normalized = normalizePhone(phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Send SMS first — only persist the code if delivery succeeds
    await this.sms.sendSms(normalized, `Your Change Liberia verification code is: ${code}. It expires in 10 minutes.`);
    this.otpStore.set(normalized, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    return { success: true };
  }

  async verifyPhoneOtp(userId: string, phone: string, code: string) {
    const normalized = normalizePhone(phone);
    const entry = this.otpStore.get(normalized);
    if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }
    this.otpStore.delete(normalized);
    return this.applyEvent(userId, VerificationType.OTP, 40, `Phone verified: ${normalized}`);
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
