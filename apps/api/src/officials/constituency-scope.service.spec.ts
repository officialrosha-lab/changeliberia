import { Institution, InstitutionCategory } from '@prisma/client';
import { ConstituencyScopeService } from './constituency-scope.service';

function makeInstitution(overrides: Partial<Institution>): Institution {
  return {
    id: 'inst-1',
    name: 'Test Office',
    type: 'GOVERNMENT',
    category: InstitutionCategory.SENATOR,
    officialEmail: 'test@example.com',
    secondaryEmails: '[]',
    contactPerson: null,
    phone: null,
    verified: true,
    logo: null,
    description: null,
    website: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    country: 'Liberia',
    lastVerifiedAt: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    county: 'Montserrado',
    district: null,
    termStartDate: null,
    termEndDate: null,
    politicalParty: null,
    holderUserId: null,
    officialStatus: 'VERIFIED',
    slug: null,
    countyId: null,
    electoralDistrictId: null,
    ...overrides,
  } as Institution;
}

describe('ConstituencyScopeService', () => {
  const service = new ConstituencyScopeService();

  it('scopes a Senator to county only, even when a district happens to be set', () => {
    const institution = makeInstitution({
      category: InstitutionCategory.SENATOR,
      county: 'Montserrado',
      district: 'District #10', // should be ignored — senators are county-wide
    });
    expect(service.buildScopeFilter(institution)).toEqual({
      county: 'Montserrado',
    });
  });

  it(
    'REGRESSION: scopes a Representative to county AND district — this is the ' +
      'confirmed bug being fixed (getConstituency previously filtered by county ' +
      'only, silently ignoring district, so a Representative saw county-wide ' +
      'data instead of their own district)',
    () => {
      const institution = makeInstitution({
        category: InstitutionCategory.REPRESENTATIVE,
        county: 'Montserrado',
        district: 'District #10',
      });
      const scope = service.buildScopeFilter(institution);
      expect(scope).toEqual({
        county: 'Montserrado',
        district: 'District #10',
      });
      // The concrete failure mode: a petition in Montserrado / District #8
      // must NOT match this scope, even though it shares the same county.
      expect(scope).not.toEqual({ county: 'Montserrado' });
    },
  );

  it('falls back to county-only for a Representative missing district data, rather than returning no scope', () => {
    const institution = makeInstitution({
      category: InstitutionCategory.REPRESENTATIVE,
      county: 'Montserrado',
      district: null,
    });
    expect(service.buildScopeFilter(institution)).toEqual({
      county: 'Montserrado',
    });
  });

  it('returns null for an office with no county/district jurisdiction (e.g. EXECUTIVE_OFFICE)', () => {
    const institution = makeInstitution({
      category: InstitutionCategory.EXECUTIVE_OFFICE,
      county: 'Montserrado',
    });
    expect(service.buildScopeFilter(institution)).toBeNull();
  });

  it('returns null for an institutional/directory category (e.g. MINISTRY)', () => {
    const institution = makeInstitution({
      category: InstitutionCategory.MINISTRY,
      county: 'Montserrado',
    });
    expect(service.buildScopeFilter(institution)).toBeNull();
  });

  it('returns null when the institution has no county set yet', () => {
    const institution = makeInstitution({
      category: InstitutionCategory.SENATOR,
      county: null,
    });
    expect(service.buildScopeFilter(institution)).toBeNull();
  });
});
