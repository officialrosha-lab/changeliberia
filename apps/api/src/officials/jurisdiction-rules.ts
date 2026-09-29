import { InstitutionCategory } from '@prisma/client';

export type JurisdictionGranularity = 'COUNTY' | 'COUNTY_AND_DISTRICT' | 'NONE';

/**
 * Maps each individual-office InstitutionCategory to the jurisdiction
 * granularity its constituency is scoped at — the single source of truth
 * for constituency-scoping (ConstituencyScopeService), verification
 * validation, and verified-officeholder uniqueness enforcement
 * (OfficialsService.approve()).
 *
 * Institutional (non-office) categories — MINISTRY/AGENCY/PARLIAMENT/
 * LOCAL_AUTHORITY/UTILITY/HEALTH/EDUCATION/SECURITY/NGO — are NONE here:
 * their county/district fields (when set) are directory/routing metadata,
 * not an elected/appointed constituency, so no uniqueness rule applies.
 */
export const JURISDICTION_RULES: Record<
  InstitutionCategory,
  JurisdictionGranularity
> = {
  // Individual elected/appointed offices
  SENATOR: 'COUNTY', // 2 senators elected at-large per county
  REPRESENTATIVE: 'COUNTY_AND_DISTRICT', // 1 representative per electoral district
  MAYOR: 'COUNTY', // city-level office; no normalized city/township geography yet, scoped at county
  SUPERINTENDENT: 'COUNTY', // county superintendent
  COMMISSIONER: 'COUNTY_AND_DISTRICT', // district-level administrative office in most counties
  DISTRICT_COMMISSIONER: 'COUNTY_AND_DISTRICT',
  EXECUTIVE_OFFICE: 'NONE', // national office (President/Vice President), not county/district-scoped

  // Institutional/directory categories — not individual constituencies
  MINISTRY: 'NONE',
  AGENCY: 'NONE',
  PARLIAMENT: 'NONE',
  LOCAL_AUTHORITY: 'NONE',
  UTILITY: 'NONE',
  HEALTH: 'NONE',
  EDUCATION: 'NONE',
  SECURITY: 'NONE',
  NGO: 'NONE',
};

/** Categories that represent a single-officeholder elected/appointed constituency. */
export const INDIVIDUAL_OFFICE_CATEGORIES_WITH_JURISDICTION: InstitutionCategory[] =
  (
    Object.entries(JURISDICTION_RULES) as [
      InstitutionCategory,
      JurisdictionGranularity,
    ][]
  )
    .filter(([, rule]) => rule !== 'NONE')
    .map(([category]) => category);
