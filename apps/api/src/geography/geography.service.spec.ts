import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GeographyService } from './geography.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GeographyService', () => {
  let service: GeographyService;

  const montserrado = {
    id: 'county-mo',
    name: 'Montserrado',
    code: 'MO',
    capital: 'Bensonville',
    districts: [
      {
        id: 'district-1',
        countyId: 'county-mo',
        name: 'District #1',
        number: 1,
      },
    ],
  };
  const bomi = {
    id: 'county-bm',
    name: 'Bomi',
    code: 'BM',
    capital: 'Tubmanburg',
    districts: [],
  };

  const mockPrismaService = {
    county: {
      findMany: jest.fn(),
    },
    electoralDistrict: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    mockPrismaService.county.findMany.mockResolvedValue([montserrado, bomi]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeographyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GeographyService>(GeographyService);
  });

  describe('listCounties', () => {
    it('fetches counties from Prisma on first call', async () => {
      const result = await service.listCounties();
      expect(result).toEqual([montserrado, bomi]);
      expect(mockPrismaService.county.findMany).toHaveBeenCalledTimes(1);
    });

    it('serves subsequent calls from the in-memory cache', async () => {
      await service.listCounties();
      await service.listCounties();
      expect(mockPrismaService.county.findMany).toHaveBeenCalledTimes(1);
    });

    it('re-fetches after invalidateCache() is called', async () => {
      await service.listCounties();
      service.invalidateCache();
      await service.listCounties();
      expect(mockPrismaService.county.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCountyById', () => {
    it('returns the matching county', async () => {
      const result = await service.getCountyById('county-mo');
      expect(result.name).toBe('Montserrado');
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(service.getCountyById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listDistrictsForCounty', () => {
    it('returns the districts of the given county', async () => {
      const result = await service.listDistrictsForCounty('county-mo');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('District #1');
    });

    it('returns an empty array for a county with no seeded districts', async () => {
      const result = await service.listDistrictsForCounty('county-bm');
      expect(result).toEqual([]);
    });
  });

  describe('resolveCountyByName', () => {
    it('resolves case-insensitively and trims whitespace', async () => {
      const result = await service.resolveCountyByName('  montserrado  ');
      expect(result?.id).toBe('county-mo');
    });

    it('returns null for unmatched free text rather than throwing', async () => {
      const result = await service.resolveCountyByName(
        'MONTSERRADO COUNTY, LIBERIA',
      );
      expect(result).toBeNull();
    });

    it('returns null for null/undefined input', async () => {
      expect(await service.resolveCountyByName(null)).toBeNull();
      expect(await service.resolveCountyByName(undefined)).toBeNull();
    });
  });

  describe('resolveDistrictByName', () => {
    it('resolves a district within the given county, case-insensitively', async () => {
      const result = await service.resolveDistrictByName(
        'county-mo',
        'district #1',
      );
      expect(result?.id).toBe('district-1');
    });

    it('returns null when the county has no matching district', async () => {
      const result = await service.resolveDistrictByName(
        'county-bm',
        'District #1',
      );
      expect(result).toBeNull();
    });
  });

  describe('createDistrict', () => {
    it('validates the county exists before creating', async () => {
      await expect(
        service.createDistrict({
          countyId: 'nonexistent',
          name: 'District #2',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.electoralDistrict.create).not.toHaveBeenCalled();
    });

    it('creates the district and invalidates the cache', async () => {
      mockPrismaService.electoralDistrict.create.mockResolvedValue({
        id: 'district-2',
        countyId: 'county-mo',
        name: 'District #2',
      });
      await service.listCounties(); // prime the cache
      await service.createDistrict({
        countyId: 'county-mo',
        name: 'District #2',
      });

      expect(mockPrismaService.electoralDistrict.create).toHaveBeenCalledWith({
        data: {
          countyId: 'county-mo',
          name: 'District #2',
          number: undefined,
          seatCount: 1,
          source: undefined,
        },
      });

      // cache was invalidated by the write, so the next read re-fetches
      await service.listCounties();
      expect(mockPrismaService.county.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyDistrict', () => {
    it('sets verifiedAt and invalidates the cache', async () => {
      mockPrismaService.electoralDistrict.update.mockResolvedValue({
        id: 'district-1',
        verifiedAt: new Date(),
      });
      await service.verifyDistrict('district-1');
      expect(mockPrismaService.electoralDistrict.update).toHaveBeenCalledWith({
        where: { id: 'district-1' },
        data: { verifiedAt: expect.any(Date) as Date },
      });
    });
  });
});
