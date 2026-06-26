import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSignatureDto } from './dto';
import { FraudService } from '../fraud/fraud.service';
import { CaptchaService } from '../captcha/captcha.service';
import { signaturesCreatedTotal } from '../metrics/prometheus.metrics';
import { EventBusService } from '../events/event-bus.service';
import { SignatureAddedEvent } from '../events/domain-events';
import { PetitionsRealtimeService } from '../events/petitions-realtime.service';

@Injectable()
export class SignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fraud: FraudService,
    private readonly captchaService: CaptchaService,
    private readonly eventBus: EventBusService,
    @Inject(PetitionsRealtimeService)
    private readonly petitionsRealtime: PetitionsRealtimeService,
  ) {}

  findByUserAndPetition(userId: string, petitionId: string) {
    return this.prisma.signature.findUnique({
      where: { petitionId_userId: { petitionId, userId } },
    });
  }

  async create(
    userId: string | undefined,
    ipAddress: string,
    dto: CreateSignatureDto,
  ) {
    const petition = await this.prisma.petition.findUnique({
      where: { id: dto.petitionId },
    });
    if (!petition) throw new BadRequestException('Petition not found');

    let deviceId: string | undefined;
    if (dto.deviceFingerprint) {
      const device = await this.prisma.device.upsert({
        where: { fingerprint: dto.deviceFingerprint },
        update: { ipAddress, userId, lastSeenAt: new Date() },
        create: { fingerprint: dto.deviceFingerprint, ipAddress, userId },
      });
      deviceId = device.id;
    }

    if (userId) {
      const duplicate = await this.prisma.signature.findFirst({
        where: { petitionId: dto.petitionId, userId },
      });
      if (duplicate)
        throw new BadRequestException('You already signed this petition');
    }

    const risk = await this.fraud.evaluateSignatureRisk({
      petitionId: dto.petitionId,
      userId,
      ipAddress,
      deviceId,
    });
    if (risk.captchaRequired && !dto.captchaToken) {
      return {
        signature: null,
        captchaRequired: true,
        riskReasons: risk.reasons,
      };
    }
    if (risk.captchaRequired) {
      const captcha = await this.captchaService.verifyToken(
        dto.captchaToken,
        ipAddress,
      );
      if (!captcha.success) {
        return {
          signature: null,
          captchaRequired: true,
          riskReasons: [...risk.reasons, `captcha_failed_${captcha.provider}`],
        };
      }
    }

    const { signature, updatedPetition } = await this.prisma.$transaction(async (tx) => {
      const signature = await tx.signature.create({
        data: {
          petitionId: dto.petitionId,
          userId,
          name: dto.name,
          anonymous: dto.anonymous ?? false,
          ipAddress,
          deviceId,
          trustScoreSnapshot: Math.max(0, 100 - risk.riskPoints),
        },
      });
      const updatedPetition = await tx.petition.update({
        where: { id: dto.petitionId },
        data: {
          signaturesCount: { increment: 1 },
          todaySignatures: { increment: 1 },
        },
      });
      return { signature, updatedPetition };
    });
    signaturesCreatedTotal.inc();

    await this.eventBus.publish(
      new SignatureAddedEvent(
        signature.id,
        dto.petitionId,
        userId ?? null,
        Math.max(0, 100 - risk.riskPoints),
      ),
    );

    // Broadcast signature count update to all connected WebSocket clients
    if (updatedPetition) {
      this.petitionsRealtime.notifySignatureAdded(
        dto.petitionId,
        updatedPetition.signaturesCount,
        updatedPetition.todaySignatures || 0,
      );

      // Broadcast new signature event to pulse map and live feed
      this.petitionsRealtime.notifyNewSignatureWithLocation({
        petitionId: dto.petitionId,
        timestamp: new Date().toISOString(),
        signerName: signature.anonymous ? undefined : (signature.name || undefined),
        anonymous: signature.anonymous,
      });
    }

    if (risk.rapidResult.suspicious) {
      await this.fraud.logFraudEvent({
        userId,
        petitionId: dto.petitionId,
        ipAddress,
        deviceId,
        ruleKey: 'rapid_signatures_per_ip',
        details: `IP exceeded threshold (${risk.rapidResult.count}/${risk.rapidResult.threshold}) in one minute`,
        riskPoints: 50,
      });
      if (userId) {
        await this.fraud.flagFraud(
          userId,
          `Rapid signature pattern detected (${risk.rapidResult.count}/${risk.rapidResult.threshold})`,
        );
      }
    }
    return { signature, captchaRequired: false, riskReasons: risk.reasons };
  }
}
