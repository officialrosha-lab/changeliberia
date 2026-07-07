import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSignatureDto } from './dto';
import { FraudService } from '../fraud/fraud.service';
import { CaptchaService } from '../captcha/captcha.service';
import { signaturesCreatedTotal } from '../metrics/prometheus.metrics';
import { EventBusService } from '../events/event-bus.service';
import { SignatureAddedEvent } from '../events/domain-events';
import { PetitionsRealtimeService } from '../events/petitions-realtime.service';
import {
  LocationClassificationService,
  LocationSource,
} from './location-classification.service';

@Injectable()
export class SignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fraud: FraudService,
    private readonly captchaService: CaptchaService,
    private readonly eventBus: EventBusService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(PetitionsRealtimeService)
    private readonly petitionsRealtime: PetitionsRealtimeService,
    private readonly locationClassification: LocationClassificationService,
  ) {}

  findByUserAndPetition(userId: string, petitionId: string) {
    return this.prisma.signature.findUnique({
      where: { petitionId_userId: { petitionId, userId } },
    });
  }

  /**
   * Offline petition collection: sign via inbound SMS (see SmsInboundController).
   * A phone number is its own trust signal (carrier-gated) — this
   * intentionally skips the fraud/CAPTCHA pipeline used by the web `create()`
   * path, since neither IP nor device fingerprint exist for an SMS sender.
   * Auto-registers a minimal phone-only account if the sender isn't already
   * a platform user, mirroring the existing phone-first signup convention.
   */
  async createFromSms(phone: string, petitionId: string): Promise<{ success: boolean; message: string }> {
    const petition = await this.prisma.petition.findUnique({ where: { id: petitionId } });
    if (!petition) return { success: false, message: 'Petition not found.' };
    if (petition.status !== 'APPROVED') {
      return { success: false, message: 'This petition is not currently open for signatures.' };
    }

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, fullName: 'SMS Signer', authProvider: 'PHONE' },
      });
    }

    const duplicate = await this.prisma.signature.findFirst({ where: { petitionId, userId: user.id } });
    if (duplicate) return { success: false, message: 'You already signed this petition.' };

    let txResult: { signature: any; updatedPetition: any };
    try {
      txResult = await this.prisma.$transaction(async (tx) => {
        const signature = await tx.signature.create({
          data: {
            petitionId,
            userId: user!.id,
            name: user!.fullName,
            anonymous: false,
            trustScoreSnapshot: 30, // lower baseline: SMS channel has no device/fraud signal
          },
        });

        const classificationInput = await this.buildClassificationInput(
          tx,
          petition,
          user!.id,
          { personallyAffected: undefined, relationshipType: undefined } as unknown as CreateSignatureDto,
        );
        const { classification, confidenceScore } = this.locationClassification.classify(classificationInput);
        await tx.signatureLocation.create({
          data: {
            signatureId: signature.id,
            county: classificationInput.declaredCounty,
            district: classificationInput.declaredDistrict,
            community: classificationInput.declaredCommunity,
            locationSource: classificationInput.locationSource,
            classification,
            confidenceScore,
          },
        });

        const updatedPetition = await tx.petition.update({
          where: { id: petitionId },
          data: { signaturesCount: { increment: 1 }, todaySignatures: { increment: 1 } },
        });
        return { signature, updatedPetition };
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        return { success: false, message: 'You already signed this petition.' };
      }
      throw err;
    }

    const { updatedPetition } = txResult;
    signaturesCreatedTotal.inc();

    this.petitionsRealtime.notifySignatureAdded(
      petitionId,
      updatedPetition.signaturesCount,
      updatedPetition.todaySignatures || 0,
    );
    this.petitionsRealtime.notifyNewSignatureWithLocation({
      petitionId,
      timestamp: new Date().toISOString(),
      signerName: undefined,
      anonymous: false,
    });

    return { success: true, message: `Thank you! You've signed "${updatedPetition.title}". Total signatures: ${updatedPetition.signaturesCount}.` };
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

    let txResult: { signature: any; updatedPetition: any };
    try {
      txResult = await this.prisma.$transaction(async (tx) => {
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

        // Petition Location Verification & Impact Area System (Phase 1) —
        // additive: never blocks or alters signature creation above/below.
        const classificationInput = await this.buildClassificationInput(tx, petition, userId, dto);
        const { classification, confidenceScore } = this.locationClassification.classify(classificationInput);
        await tx.signatureLocation.create({
          data: {
            signatureId: signature.id,
            personallyAffected: dto.personallyAffected ?? null,
            relationshipType: dto.relationshipType ?? null,
            county: classificationInput.declaredCounty,
            district: classificationInput.declaredDistrict,
            community: classificationInput.declaredCommunity,
            locationSource: classificationInput.locationSource,
            classification,
            confidenceScore,
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
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('You already signed this petition');
      }
      throw err;
    }
    const { signature, updatedPetition } = txResult;
    signaturesCreatedTotal.inc();

    await this.eventBus.publish(
      new SignatureAddedEvent(
        signature.id,
        dto.petitionId,
        userId ?? null,
        Math.max(0, 100 - risk.riskPoints),
      ),
    );

    // Emit milestone email events at key signature thresholds — best-effort,
    // must not cause create() to reject after the signature is already committed
    const MILESTONES = [10, 25, 50, 100, 500, 1000];
    const count = updatedPetition.signaturesCount;
    if (MILESTONES.includes(count)) {
      this.prisma.user
        .findUnique({
          where: { id: updatedPetition.creatorId },
          select: { id: true, email: true, fullName: true },
        })
        .then((creator) => {
          if (!creator) return;
          this.eventEmitter.emit('petition.milestone', {
            creatorId: creator.id,
            creatorEmail: creator.email,
            creatorName: creator.fullName,
            petitionId: updatedPetition.id,
            petitionTitle: updatedPetition.title,
            petitionUrl: `/petitions/${updatedPetition.id}`,
            milestone: count,
            currentSignatures: count,
          });
        })
        .catch(() => { /* milestone notification is non-critical */ });
    }

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

  /**
   * Resolves the classification engine's input. If the client omitted the
   * Step 3 confirmation fields and the signer is logged in, falls back to
   * their saved profile location (locationSource: 'profile_match') — this is
   * the "skip Step 3 if profile already matches" fast path.
   */
  private async buildClassificationInput(
    tx: Prisma.TransactionClient,
    petition: { impactScope: any; county: string | null; district: string | null; community: string | null; counties: string[] },
    userId: string | undefined,
    dto: CreateSignatureDto,
  ) {
    let declaredCounty = dto.confirmedCounty ?? null;
    let declaredDistrict = dto.confirmedDistrict ?? null;
    let declaredCommunity = dto.confirmedCommunity ?? null;
    let locationSource: LocationSource = (dto.locationSource as LocationSource) ?? 'unconfirmed';
    let userVerificationStatus: any = null;

    if (userId) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { county: true, district: true, community: true, verificationStatus: true },
      });
      userVerificationStatus = user?.verificationStatus ?? null;

      if (!dto.confirmedCounty && user) {
        declaredCounty = user.county;
        declaredDistrict = user.district;
        declaredCommunity = user.community;
        locationSource = 'profile_match';
      }
    }

    return {
      petition: {
        impactScope: petition.impactScope,
        county: petition.county,
        district: petition.district,
        community: petition.community,
        counties: petition.counties,
      },
      personallyAffected: dto.personallyAffected ?? null,
      relationshipType: dto.relationshipType ?? null,
      declaredCounty,
      declaredDistrict,
      declaredCommunity,
      locationSource,
      userVerificationStatus,
    };
  }
}
