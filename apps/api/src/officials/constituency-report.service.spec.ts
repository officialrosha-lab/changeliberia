import {
  ConstituencyReportPeriod,
  ConstituencyReportStatus,
  Institution,
  InstitutionCategory,
  OfficialVerificationStatus,
} from '@prisma/client';
import { ConstituencyReportService } from './constituency-report.service';

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
    holderUserId: 'user-1',
    officialStatus: OfficialVerificationStatus.VERIFIED,
    slug: null,
    countyId: null,
    electoralDistrictId: null,
    ...overrides,
  } as Institution;
}

describe('ConstituencyReportService', () => {
  const mockPrisma = {
    constituencyReportPreference: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
    },
    constituencyReport: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      findUniqueOrThrow: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    constituencyReportFile: {
      createMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    constituencyReportDelivery: {
      create: jest.fn<Promise<{ id: string }>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    user: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    officialStaffMember: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
  };

  const mockGenerator = {
    generateCsv: jest.fn<
      Promise<string>,
      [unknown, unknown, unknown, unknown]
    >(),
    generatePdf: jest.fn<
      Promise<Buffer>,
      [unknown, unknown, unknown, unknown]
    >(),
  };

  const mockStorage = {
    save: jest.fn<
      Promise<{ filePath: string; publicUrl: string }>,
      [string, string | Buffer]
    >(),
    resolveSafe: jest.fn<string | null, [string]>(),
  };

  const mockEmailService = {
    sendTransactional: jest.fn<
      Promise<unknown>,
      [unknown, unknown, unknown, unknown]
    >(),
  };

  const mockActivityLogger = {
    logAsync: jest.fn(),
  };

  let service: ConstituencyReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.constituencyReportDelivery.create.mockResolvedValue({
      id: 'delivery-1',
    });
    service = new ConstituencyReportService(
      mockPrisma as never,
      mockGenerator as never,
      mockStorage as never,
      mockEmailService as never,
      mockActivityLogger as never,
    );
  });

  describe('processNextQueuedReport', () => {
    it('returns null when the queue is empty', async () => {
      mockPrisma.constituencyReport.findFirst.mockResolvedValue(null);
      const result = await service.processNextQueuedReport();
      expect(result).toBeNull();
      expect(mockPrisma.constituencyReport.update).not.toHaveBeenCalled();
    });

    it('generates files, delivers to the holder, and marks COMPLETED', async () => {
      const institution = makeInstitution();
      const report = {
        id: 'report-1',
        institutionId: institution.id,
        institution,
        period: ConstituencyReportPeriod.MONTHLY,
        periodStart: new Date('2026-08-01'),
        periodEnd: new Date('2026-09-01'),
        status: ConstituencyReportStatus.QUEUED,
      };
      mockPrisma.constituencyReport.findFirst.mockResolvedValue(report);
      mockGenerator.generateCsv.mockResolvedValue('csv-content');
      mockGenerator.generatePdf.mockResolvedValue(Buffer.from('pdf-content'));
      mockStorage.save.mockImplementation((format: string) =>
        Promise.resolve({
          filePath: `/uploads/${format}.file`,
          publicUrl: `https://example.com/${format}.file`,
        }),
      );
      mockPrisma.constituencyReport.findUniqueOrThrow.mockResolvedValue(report);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'holder@example.com',
      });
      mockPrisma.officialStaffMember.findMany.mockResolvedValue([]);
      mockPrisma.constituencyReport.update.mockResolvedValue({
        ...report,
        status: ConstituencyReportStatus.COMPLETED,
      });

      const result = await service.processNextQueuedReport();

      expect(mockPrisma.constituencyReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: {
          status: ConstituencyReportStatus.PROCESSING,
          attempts: { increment: 1 },
        },
      });
      expect(mockPrisma.constituencyReportFile.createMany).toHaveBeenCalled();
      expect(mockEmailService.sendTransactional).toHaveBeenCalledWith(
        'holder@example.com',
        'user-1',
        'CONSTITUENCY_REPORT_READY',
        expect.objectContaining({ institutionName: institution.name }),
      );
      expect(mockPrisma.constituencyReportDelivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'SENT', sentAt: expect.any(Date) as Date },
        }),
      );
      expect(result).toMatchObject({
        status: ConstituencyReportStatus.COMPLETED,
      });
    });

    it('marks the report FAILED and records the error when generation throws', async () => {
      const institution = makeInstitution();
      const report = {
        id: 'report-2',
        institutionId: institution.id,
        institution,
        period: ConstituencyReportPeriod.WEEKLY,
        periodStart: new Date('2026-08-25'),
        periodEnd: new Date('2026-09-01'),
        status: ConstituencyReportStatus.QUEUED,
      };
      mockPrisma.constituencyReport.findFirst.mockResolvedValue(report);
      mockGenerator.generateCsv.mockRejectedValue(new Error('boom'));
      mockGenerator.generatePdf.mockResolvedValue(Buffer.from('pdf-content'));
      mockPrisma.constituencyReport.update.mockResolvedValue({
        ...report,
        status: ConstituencyReportStatus.FAILED,
        error: 'boom',
      });

      const result = await service.processNextQueuedReport();

      expect(mockPrisma.constituencyReport.update).toHaveBeenLastCalledWith({
        where: { id: 'report-2' },
        data: { status: ConstituencyReportStatus.FAILED, error: 'boom' },
      });
      expect(result).toMatchObject({ status: ConstituencyReportStatus.FAILED });
    });
  });

  describe('enqueueScheduledReports', () => {
    it('only queues reports for VERIFIED institutions opted into the period', async () => {
      mockPrisma.constituencyReportPreference.findMany.mockResolvedValue([
        {
          institutionId: 'inst-verified',
          institution: makeInstitution({
            id: 'inst-verified',
            officialStatus: OfficialVerificationStatus.VERIFIED,
          }),
        },
        {
          institutionId: 'inst-revoked',
          institution: makeInstitution({
            id: 'inst-revoked',
            officialStatus: OfficialVerificationStatus.REVOKED,
          }),
        },
      ]);
      mockPrisma.constituencyReport.create.mockResolvedValue({});

      const created = await service.enqueueScheduledReports(
        ConstituencyReportPeriod.MONTHLY,
      );

      expect(created).toBe(1);
      expect(mockPrisma.constituencyReport.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.constituencyReport.create).toHaveBeenCalledWith({
        data: {
          institutionId: 'inst-verified',
          period: ConstituencyReportPeriod.MONTHLY,
          periodStart: expect.any(Date) as Date,
          periodEnd: expect.any(Date) as Date,
          status: ConstituencyReportStatus.QUEUED,
        },
      });
    });
  });
});
