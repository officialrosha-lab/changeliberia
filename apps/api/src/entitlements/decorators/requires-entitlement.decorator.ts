import { SetMetadata } from '@nestjs/common';

export const REQUIRES_ENTITLEMENT_KEY = 'requiresEntitlement';

/**
 * Gates a route behind an entitlement key (e.g. "ENTITLEMENT_PETITION_BOOST").
 * Mirrors `@Permission()` from the RBAC module. Never place this on a route
 * covered by the civic-principle guardrail — see EntitlementGuard's
 * docstring and civic-principle.e2e-spec.ts.
 */
export const RequiresEntitlement = (key: string) =>
  SetMetadata(REQUIRES_ENTITLEMENT_KEY, key);
