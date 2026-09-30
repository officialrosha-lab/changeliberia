import { Institution, InstitutionCategory } from '@prisma/client';
import { ConstituencyFeedService } from './constituency-feed.service';
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

describe('ConstituencyFeedService', () => {
  const mockPrisma = {
    petition: {
      findMany: jest.fn<Promise<unknown[]>, [Record<string, unknown>]>(),
      count: jest.fn<Promise<number>, [Record<string, unknown>]>(),
    },
    signature: {
      groupBy: jest.fn<Promise<unknown[]>, [Record<string, unknown>]>(),
    },
    signatureLocation: {
      groupBy: jest.fn<Promise<unknown[]>, [Record<string, unknown>]>(),
      count: jest.fn<Promise<number>, [Record<string, unknown>]>(),
    },
    poll: {
      findMany: jest.fn<Promise<unknown[]>, [Record<string, unknown>]>(),
      count: jest.fn<Promise<number>, [Record<string, unknown>]>(),
    },
  };

  let service: ConstituencyFeedService;

  beforeEach(() => {
    jest.resetAllMocks();
    mockPrisma.petition.findMany.mockResolvedValue([]);
    mockPrisma.petition.count.mockResolvedValue(0);
    mockPrisma.signature.groupBy.mockResolvedValue([]);
    mockPrisma.signatureLocation.groupBy.mockResolvedValue([]);
    mockPrisma.signatureLocation.count.mockResolvedValue(0);
    mockPrisma.poll.findMany.mockResolvedValue([]);
    mockPrisma.poll.count.mockResolvedValue(0);
    service = new ConstituencyFeedService(
      mockPrisma as never,
      new ConstituencyScopeService(),
    );
  });

  describe('getConstituencyPetitionFeed', () => {
    it(
      'REGRESSION: a Representative with a district issues a Prisma query ' +
        'filtered by BOTH county and district — the confirmed bug (county-only ' +
        'filtering) can no longer leak county-wide data into a district-scoped feed',
      async () => {
        const institution = makeInstitution({
          category: InstitutionCategory.REPRESENTATIVE,
          county: 'Montserrado',
          district: 'District #10',
        });

        await service.getConstituencyPetitionFeed(institution);

        const expectedWhere = {
          county: 'Montserrado',
          district: 'District #10',
          status: 'APPROVED',
        };
        expect(mockPrisma.petition.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: expectedWhere }),
        );
        expect(mockPrisma.petition.count).toHaveBeenCalledWith({
          where: expectedWhere,
        });
      },
    );

    it('a Senator issues a county-only query (no district key at all, not even undefined-district)', async () => {
      const institution = makeInstitution({
        category: InstitutionCategory.SENATOR,
        county: 'Montserrado',
      });

      await service.getConstituencyPetitionFeed(institution);

      // Exact equality (not objectContaining) so this also proves `district`
      // is entirely absent from the where clause, not merely unset.
      expect(mockPrisma.petition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { county: 'Montserrado', status: 'APPROVED' },
        }),
      );
    });

    it('returns an empty result with scope: null for an office with no jurisdiction', async () => {
      const institution = makeInstitution({
        category: InstitutionCategory.EXECUTIVE_OFFICE,
      });

      const result = await service.getConstituencyPetitionFeed(institution);

      expect(result).toEqual({
        scope: null,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
      expect(mockPrisma.petition.findMany).not.toHaveBeenCalled();
    });

    it('flags isAwaitingResponse when no government response exists yet for this institution', async () => {
      const institution = makeInstitution({ county: 'Montserrado' });
      mockPrisma.petition.findMany.mockResolvedValue([
        {
          id: 'p1',
          title: 'Fix the road',
          summary: 's',
          category: 'infrastructure',
          county: 'Montserrado',
          district: null,
          signaturesCount: 5,
          goal: 100,
          status: 'APPROVED',
          createdAt: new Date(),
          governmentResponses: [],
        },
      ]);
      mockPrisma.petition.count.mockResolvedValue(1);

      const result = await service.getConstituencyPetitionFeed(institution);

      expect(result.data[0].indicators.isAwaitingResponse).toBe(true);
    });

    it('does not flag isAwaitingResponse once the response has moved past RECEIVED', async () => {
      const institution = makeInstitution({ county: 'Montserrado' });
      mockPrisma.petition.findMany.mockResolvedValue([
        {
          id: 'p1',
          title: 'Fix the road',
          summary: 's',
          category: 'infrastructure',
          county: 'Montserrado',
          district: null,
          signaturesCount: 5,
          goal: 100,
          status: 'APPROVED',
          createdAt: new Date(),
          governmentResponses: [
            { currentStage: 'ACTION_PLANNED', createdAt: new Date() },
          ],
        },
      ]);
      mockPrisma.petition.count.mockResolvedValue(1);

      const result = await service.getConstituencyPetitionFeed(institution);

      expect(result.data[0].indicators.isAwaitingResponse).toBe(false);
    });
  });

  describe('getConstituencyPollFeed', () => {
    it('scopes a Representative with a district by both county and district', async () => {
      const institution = makeInstitution({
        category: InstitutionCategory.REPRESENTATIVE,
        county: 'Montserrado',
        district: 'District #10',
      });

      await service.getConstituencyPollFeed(institution);

      expect(mockPrisma.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            county: 'Montserrado',
            district: 'District #10',
            status: { in: ['ACTIVE', 'EXPIRED', 'CLOSED'] },
          },
        }),
      );
    });
  });

  describe('getCommunityInsights', () => {
    it('REGRESSION: a Representative with a district scopes signatureLocation queries by BOTH county and district, not county alone', async () => {
      const institution = makeInstitution({
        category: InstitutionCategory.REPRESENTATIVE,
        county: 'Montserrado',
        district: 'District #10',
      });

      await service.getCommunityInsights(institution);

      const expectedPetitionWhere = {
        county: 'Montserrado',
        district: 'District #10',
        status: 'APPROVED',
      };
      expect(mockPrisma.signatureLocation.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['county'],
          where: expect.objectContaining({
            signature: { petition: expectedPetitionWhere },
          }) as unknown,
        }),
      );
      expect(mockPrisma.signatureLocation.count).toHaveBeenCalledWith({
        where: {
          classification: 'DIASPORA_SUPPORTER',
          signature: { petition: expectedPetitionWhere },
        },
      });
    });

    it('returns an empty result with scope: null for an office with no jurisdiction', async () => {
      const institution = makeInstitution({
        category: InstitutionCategory.EXECUTIVE_OFFICE,
      });

      const result = await service.getCommunityInsights(institution);

      expect(result).toEqual({
        scope: null,
        byCounty: [],
        byDistrict: [],
        byCommunity: [],
        diasporaTotal: 0,
      });
      expect(mockPrisma.signatureLocation.groupBy).not.toHaveBeenCalled();
    });

    it('shapes groupBy rows into {label, count} and passes through the diaspora count', async () => {
      const institution = makeInstitution({ county: 'Montserrado' });
      mockPrisma.signatureLocation.groupBy
        .mockResolvedValueOnce([
          { county: 'Montserrado', _count: { _all: 12 } },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ community: 'Sinkor', _count: { _all: 5 } }]);
      mockPrisma.signatureLocation.count.mockResolvedValue(3);

      const result = await service.getCommunityInsights(institution);

      expect(result.byCounty).toEqual([{ label: 'Montserrado', count: 12 }]);
      expect(result.byDistrict).toEqual([]);
      expect(result.byCommunity).toEqual([{ label: 'Sinkor', count: 5 }]);
      expect(result.diasporaTotal).toBe(3);
    });
  });
});
