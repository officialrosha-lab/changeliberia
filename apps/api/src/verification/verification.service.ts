import { Injectable } from '@nestjs/common';
import { VerificationStatus, VerificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

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
