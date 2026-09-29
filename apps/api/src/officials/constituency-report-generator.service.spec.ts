import { Institution, InstitutionCategory } from '@prisma/client';
import { ConstituencyReportGeneratorService } from './constituency-report-generator.service';
import { ConstituencyFeedService } from './constituency-feed.service';

function makeInstitution(overrides: Partial<Institution> = {}): Institution {
  return {
    id: 'inst-1',
    name: 'Senator Jane Doe',
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

describe('ConstituencyReportGeneratorService', () => {
  const summary = {
    scope: { county: 'Montserrado' },
    county: 'Montserrado',
    district: null,
    petitionsCount: 3,
    signaturesTotal: 450,
    topCategories: [{ category: 'infrastructure', count: 2 }],
    directlyAffectedCount: 100,
    nearbyCommunityCount: 50,
    topAffectedAreas: [{ community: 'Paynesville', count: 30 }],
  };

  const mockFeed = {
    getConstituencySummary: jest
      .fn<Promise<typeof summary>, [Institution, unknown]>()
      .mockResolvedValue(summary),
  };

  let service: ConstituencyReportGeneratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeed.getConstituencySummary.mockResolvedValue(summary);
    service = new ConstituencyReportGeneratorService(
      mockFeed as unknown as ConstituencyFeedService,
    );
  });

  it('scopes the summary lookup to the exact report period window', async () => {
    const institution = makeInstitution();
    const start = new Date('2026-08-01');
    const end = new Date('2026-09-01');

    await service.generateCsv(institution, 'MONTHLY', start, end);

    expect(mockFeed.getConstituencySummary).toHaveBeenCalledWith(institution, {
      start,
      end,
    });
  });

  it('generateCsv includes participation figures and top categories', async () => {
    const institution = makeInstitution();
    const csv = await service.generateCsv(
      institution,
      'MONTHLY',
      new Date('2026-08-01'),
      new Date('2026-09-01'),
    );

    expect(csv).toContain('Approved Petitions,3');
    expect(csv).toContain('Total Signatures,450');
    expect(csv).toContain('infrastructure');
    expect(csv).toContain('Paynesville');
  });

  it('generatePdf produces a non-empty PDF buffer', async () => {
    const institution = makeInstitution();
    const pdf = await service.generatePdf(
      institution,
      'QUARTERLY',
      new Date('2026-06-01'),
      new Date('2026-09-01'),
    );

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(0);
    // PDF magic bytes
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
