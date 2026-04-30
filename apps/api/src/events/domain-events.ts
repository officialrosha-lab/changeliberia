/**
 * Domain Events - Core business events across the platform
 */

export abstract class DomainEvent {
  abstract readonly eventType: string;
  abstract readonly entityType: string;
  abstract readonly entityId: string;
  readonly occurredAt = new Date();
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
  }

  abstract getPayload(): Record<string, any>;
}

/**
 * Content Events
 */
export class ContentCreatedEvent extends DomainEvent {
  readonly eventType = 'CONTENT_CREATED';
  readonly entityType = 'content';

  constructor(
    public readonly entityId: string,
    public readonly contentTypeId: string,
    public readonly creatorId: string,
    public readonly title: string,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      contentTypeId: this.contentTypeId,
      creatorId: this.creatorId,
      title: this.title,
    };
  }
}

export class ContentPublishedEvent extends DomainEvent {
  readonly eventType = 'CONTENT_PUBLISHED';
  readonly entityType = 'content';

  constructor(
    public readonly entityId: string,
    public readonly creatorId: string,
    public readonly contentTypeId: string,
    public readonly title: string,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      contentTypeId: this.contentTypeId,
      creatorId: this.creatorId,
      title: this.title,
    };
  }
}

export class ContentRejectedEvent extends DomainEvent {
  readonly eventType = 'CONTENT_REJECTED';
  readonly entityType = 'content';

  constructor(
    public readonly entityId: string,
    public readonly creatorId: string,
    public readonly rejectionReason: string,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      creatorId: this.creatorId,
      rejectionReason: this.rejectionReason,
    };
  }
}

/**
 * Petition Update Events
 */
export class PetitionUpdatePublishedEvent extends DomainEvent {
  readonly eventType = 'PETITION_UPDATE_PUBLISHED';
  readonly entityType = 'petition';

  constructor(
    public readonly entityId: string,   // PetitionUpdate id
    public readonly petitionId: string,
    public readonly petitionTitle: string,
    public readonly updateTitle: string,
  ) {
    super(petitionId);
  }

  getPayload() {
    return {
      petitionId: this.petitionId,
      petitionTitle: this.petitionTitle,
      updateTitle: this.updateTitle,
    };
  }
}

/**
 * Signature Events
 */
export class SignatureAddedEvent extends DomainEvent {
  readonly eventType = 'SIGNATURE_ADDED';
  readonly entityType = 'signature';

  constructor(
    public readonly entityId: string,
    public readonly petitionId: string,
    public readonly userId: string | null,
    public readonly trustScore: number,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      petitionId: this.petitionId,
      userId: this.userId,
      trustScore: this.trustScore,
    };
  }
}

/**
 * User Events
 */
export class UserVerifiedEvent extends DomainEvent {
  readonly eventType = 'USER_VERIFIED';
  readonly entityType = 'user';

  constructor(
    public readonly entityId: string,
    public readonly verificationType: string,
    public readonly trustScoreDelta: number,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      verificationType: this.verificationType,
      trustScoreDelta: this.trustScoreDelta,
    };
  }
}

/**
 * Fraud Events
 */
export class FraudDetectedEvent extends DomainEvent {
  readonly eventType = 'FRAUD_DETECTED';
  readonly entityType = 'fraud';

  constructor(
    public readonly entityId: string,
    public readonly userId: string | null,
    public readonly ruleKey: string,
    public readonly riskPoints: number,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      userId: this.userId,
      ruleKey: this.ruleKey,
      riskPoints: this.riskPoints,
    };
  }
}

/**
 * Donation Events
 */
export class DonationReceivedEvent extends DomainEvent {
  readonly eventType = 'DONATION_RECEIVED';
  readonly entityType = 'donation';

  constructor(
    public readonly entityId: string,
    public readonly contentId: string | null,
    public readonly donorId: string | null,
    public readonly amount: number,
    public readonly currency: string,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      contentId: this.contentId,
      donorId: this.donorId,
      amount: this.amount,
      currency: this.currency,
    };
  }
}

/**
 * Comment Events
 */
export class CommentAddedEvent extends DomainEvent {
  readonly eventType = 'COMMENT_ADDED';
  readonly entityType = 'comment';

  constructor(
    public readonly entityId: string,
    public readonly contentId: string,
    public readonly userId: string | null,
    public readonly authorName: string,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      contentId: this.contentId,
      userId: this.userId,
      authorName: this.authorName,
    };
  }
}

/**
 * Facebook Viral Growth Events
 */
export class FacebookShareCreatedEvent extends DomainEvent {
  readonly eventType = 'FACEBOOK_SHARE_CREATED';
  readonly entityType = 'share';

  constructor(
    public readonly entityId: string,
    public readonly petitionId: string,
    public readonly userId: string,
    public readonly shortCode: string,
    public readonly estimatedReach: number,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      petitionId: this.petitionId,
      userId: this.userId,
      shortCode: this.shortCode,
      estimatedReach: this.estimatedReach,
    };
  }
}

export class FacebookShareClickedEvent extends DomainEvent {
  readonly eventType = 'FACEBOOK_SHARE_CLICKED';
  readonly entityType = 'share';

  constructor(
    public readonly entityId: string,
    public readonly shortCode: string,
    public readonly petitionId: string,
    public readonly referrerUserId: string | null,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      shortCode: this.shortCode,
      petitionId: this.petitionId,
      referrerUserId: this.referrerUserId,
    };
  }
}

export class FacebookConversionTrackedEvent extends DomainEvent {
  readonly eventType = 'FACEBOOK_CONVERSION_TRACKED';
  readonly entityType = 'conversion';

  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly petitionId: string,
    public readonly trustValue: number,
    public readonly conversionType: 'SIGNATURE' | 'SHARE' | 'ENGAGEMENT',
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      userId: this.userId,
      petitionId: this.petitionId,
      trustValue: this.trustValue,
      conversionType: this.conversionType,
    };
  }
}

export class BadgeUnlockedEvent extends DomainEvent {
  readonly eventType = 'BADGE_UNLOCKED';
  readonly entityType = 'badge';

  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly petitionId: string,
    public readonly badgeType: string,
    public readonly multiplierBonus: number,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      userId: this.userId,
      petitionId: this.petitionId,
      badgeType: this.badgeType,
      multiplierBonus: this.multiplierBonus,
    };
  }
}

export class ChallengeCompletedEvent extends DomainEvent {
  readonly eventType = 'CHALLENGE_COMPLETED';
  readonly entityType = 'challenge';

  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly challengeId: string,
    public readonly rewardMultiplier: number,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      userId: this.userId,
      challengeId: this.challengeId,
      rewardMultiplier: this.rewardMultiplier,
    };
  }
}

/**
 * Petition Status Events
 */
export class PetitionApprovedEvent extends DomainEvent {
  readonly eventType = 'PETITION_APPROVED';
  readonly entityType = 'petition';

  constructor(
    public readonly entityId: string,
    public readonly creatorId: string,
    public readonly title: string,
    public readonly moderatorId: string,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      creatorId: this.creatorId,
      title: this.title,
      moderatorId: this.moderatorId,
    };
  }
}

export class PetitionRejectedEvent extends DomainEvent {
  readonly eventType = 'PETITION_REJECTED';
  readonly entityType = 'petition';

  constructor(
    public readonly entityId: string,
    public readonly creatorId: string,
    public readonly title: string,
    public readonly rejectionReason: string,
    public readonly moderatorId: string,
  ) {
    super(entityId);
  }

  getPayload() {
    return {
      creatorId: this.creatorId,
      title: this.title,
      rejectionReason: this.rejectionReason,
      moderatorId: this.moderatorId,
    };
  }
}
