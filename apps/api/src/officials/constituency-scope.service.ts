import { Injectable } from '@nestjs/common';
import { Institution } from '@prisma/client';
import { JURISDICTION_RULES } from './jurisdiction-rules';

export interface ConstituencyScopeFilter {
  county: string;
  district?: string;
}

/**
 * Single source of truth for scoping a query to a verified officeholder's
 * constituency. Consulted by the (fixed) `GET /officials/me/constituency`
 * endpoint and by `ConstituencyFeedService` — centralizing this here is
 * what prevents the confirmed county-only bug (Representatives silently
 * seeing county-wide data instead of their own district) from being
 * reintroduced by a future consumer.
 *
 * Scopes on the free-text county/district columns, not the countyId/
 * electoralDistrictId FKs — the FK-based read cutover is a later, separate
 * migration step (see the geography dual-write plan); this service's
 * signature is stable across that transition.
 */
@Injectable()
export class ConstituencyScopeService {
  /**
   * Returns the scope filter for the given institution, or null when the
   * office has no county/district-scoped constituency (e.g. EXECUTIVE_OFFICE,
   * or an institutional/directory category) or the institution's county
   * hasn't been set yet.
   */
  buildScopeFilter(institution: Institution): ConstituencyScopeFilter | null {
    const rule = JURISDICTION_RULES[institution.category];
    if (rule === 'NONE') return null;
    if (!institution.county) return null;

    if (rule === 'COUNTY_AND_DISTRICT') {
      if (!institution.district) {
        // District-scoped office with no district on file yet — fall back
        // to county-only rather than returning no scope at all, since a
        // Representative missing district data is still better served by
        // county-wide data than nothing (this is a data-completeness gap
        // to flag for the officeholder to fix, not a reason to withhold
        // constituency access entirely).
        return { county: institution.county };
      }
      return { county: institution.county, district: institution.district };
    }

    return { county: institution.county };
  }
}
