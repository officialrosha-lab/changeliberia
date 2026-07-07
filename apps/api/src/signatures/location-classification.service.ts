import { Injectable } from '@nestjs/common';
import {
  ImpactScope,
  RelationshipType,
  SignatureClassification,
  VerificationStatus,
} from '@prisma/client';

export type LocationSource = 'profile_match' | 'user_confirmed' | 'unconfirmed';

export interface ClassificationInput {
  petition: {
    impactScope: ImpactScope | null;
    county: string | null;
    district: string | null;
    community: string | null;
    counties: string[];
  };
  personallyAffected: boolean | null; // Step 1
  relationshipType: RelationshipType | null; // Step 2 (only if personallyAffected)
  declaredCounty: string | null; // Step 3 (profile-matched or user-confirmed)
  declaredDistrict: string | null;
  declaredCommunity: string | null;
  locationSource: LocationSource;
  userVerificationStatus: VerificationStatus | null;
  ipRegionHint?: string | null; // optional, non-blocking supporting signal only
}

export interface ClassificationResult {
  classification: SignatureClassification;
  confidenceScore: number;
}

const STRONG_RELATIONSHIPS: RelationshipType[] = [
  'LIVES_HERE',
  'WORKS_HERE',
  'OWNS_PROPERTY_HERE',
  'ATTENDS_SCHOOL_HERE',
  'BUSINESS_OPERATES_HERE',
];

function isDiaspora(status: VerificationStatus | null): boolean {
  return status === 'VERIFIED_DIASPORA';
}

/**
 * Rule-based classification + confidence-scoring engine for the Petition
 * Location Verification & Impact Area System (Phase 1). Deterministic,
 * evaluated top-down (first match wins). Never blocks signing — an UNKNOWN
 * classification is a valid, accepted outcome, not an error.
 */
@Injectable()
export class LocationClassificationService {
  classify(input: ClassificationInput): ClassificationResult {
    const classification = this.determineClassification(input);
    const confidenceScore = this.scoreConfidence(input, classification);
    return { classification, confidenceScore };
  }

  private determineClassification(input: ClassificationInput): SignatureClassification {
    const { petition, personallyAffected, userVerificationStatus } = input;

    // Rule 1: explicitly not personally affected
    if (personallyAffected === false) {
      return isDiaspora(userVerificationStatus) ? 'DIASPORA_SUPPORTER' : 'SUPPORTER';
    }

    // Legacy petitions with no impact scope set can't be evaluated
    if (!petition.impactScope) {
      return 'UNKNOWN';
    }

    if (personallyAffected === true) {
      // Rule 2: national scope — any in-country claim counts as directly
      // affected, unless the signer is diaspora-verified (diaspora label
      // takes precedence for national-scope petitions).
      if (petition.impactScope === 'NATIONAL') {
        return isDiaspora(userVerificationStatus) ? 'DIASPORA_SUPPORTER' : 'DIRECTLY_AFFECTED';
      }

      if (petition.impactScope === 'MULTI_COUNTY') {
        if (input.declaredCounty && petition.counties.includes(input.declaredCounty)) {
          return 'DIRECTLY_AFFECTED';
        }
        // No geo-adjacency table this phase — can't compute NEARBY_COMMUNITY
        // for multi-county petitions, fall through to the ambiguous case.
        return this.fallbackClassification(input);
      }

      const match = this.matchLevel(input);
      if (match === 'full') return 'DIRECTLY_AFFECTED';
      if (match === 'partial') return 'NEARBY_COMMUNITY';
      return this.fallbackClassification(input);
    }

    // personallyAffected is null/undefined (Step 1 skipped/dismissed)
    return this.fallbackClassification(input);
  }

  private fallbackClassification(input: ClassificationInput): SignatureClassification {
    if (isDiaspora(input.userVerificationStatus)) return 'DIASPORA_SUPPORTER';
    if (input.locationSource === 'unconfirmed' && !input.declaredCounty) return 'UNKNOWN';
    return 'UNKNOWN';
  }

  /**
   * Compares the signer's declared county/district/community against only
   * the fields the petition's impactScope actually requires.
   */
  private matchLevel(input: ClassificationInput): 'full' | 'partial' | 'none' {
    const { petition, declaredCounty, declaredDistrict, declaredCommunity } = input;

    if (!declaredCounty || !petition.county) return 'none';
    const countyMatches = declaredCounty === petition.county;
    if (!countyMatches) return 'none';

    if (petition.impactScope === 'COUNTY') return 'full';

    if (petition.impactScope === 'DISTRICT') {
      if (!petition.district) return 'full'; // scope requires county only if district unset
      return declaredDistrict === petition.district ? 'full' : 'partial';
    }

    if (petition.impactScope === 'COMMUNITY') {
      if (!petition.district) return 'full';
      if (declaredDistrict !== petition.district) return 'partial';
      if (!petition.community) return 'full';
      return declaredCommunity === petition.community ? 'full' : 'partial';
    }

    return 'partial';
  }

  private scoreConfidence(
    input: ClassificationInput,
    classification: SignatureClassification,
  ): number {
    if (classification === 'UNKNOWN') return Math.min(20, this.rawScore(input));
    return Math.min(100, this.rawScore(input));
  }

  private rawScore(input: ClassificationInput): number {
    let score = 0;
    if (input.locationSource === 'profile_match') score += 40;
    else if (input.locationSource === 'user_confirmed') score += 25;

    const match = this.matchLevel(input);
    if (match === 'full') score += 20;
    else if (input.declaredCounty && input.petition.county === input.declaredCounty) score += 10;

    if (input.relationshipType) {
      score += STRONG_RELATIONSHIPS.includes(input.relationshipType) ? 15 : 5;
    }

    if (input.ipRegionHint && input.declaredCounty && input.ipRegionHint === input.declaredCounty) {
      score += 5;
    }

    return score;
  }
}
