import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Read side of the canonical geography catalog (County/ElectoralDistrict).
 * This is near-static reference data — the 15 counties never change at
 * runtime and districts change only via admin action — so results are
 * cached in memory with a short TTL rather than hitting the DB on every
 * request (constituency-scoped feeds/reports call this on hot paths).
 */
@Injectable()
export class GeographyService {
  private countiesCache: {
    data: Awaited<ReturnType<GeographyService['fetchCounties']>>;
    expiresAt: number;
  } | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  private async fetchCounties() {
    return this.prisma.county.findMany({
      orderBy: { name: 'asc' },
      include: {
        districts: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async listCounties() {
    const now = Date.now();
    if (this.countiesCache && this.countiesCache.expiresAt > now) {
      return this.countiesCache.data;
    }
    const data = await this.fetchCounties();
    this.countiesCache = { data, expiresAt: now + this.CACHE_TTL_MS };
    return data;
  }

  /** Invalidate the cache — call after any admin write to County/ElectoralDistrict. */
  invalidateCache(): void {
    this.countiesCache = null;
  }

  async getCountyById(countyId: string) {
    const counties = await this.listCounties();
    const county = counties.find((c) => c.id === countyId);
    if (!county) throw new NotFoundException('County not found');
    return county;
  }

  async listDistrictsForCounty(countyId: string) {
    const county = await this.getCountyById(countyId);
    return county.districts;
  }

  /**
   * Resolve a free-text county name to its canonical County row.
   * Case-insensitive, trims whitespace — mirrors the existing
   * `getCountyCentroid` lookup convention in apps/web/lib/liberia-counties.ts.
   * Returns null (does not throw) when no match is found, since callers
   * during the dual-write rollout must tolerate unmatched legacy free text.
   */
  async resolveCountyByName(name: string | null | undefined) {
    if (!name) return null;
    const normalized = name.trim().toLowerCase();
    const counties = await this.listCounties();
    return counties.find((c) => c.name.toLowerCase() === normalized) ?? null;
  }

  async resolveDistrictByName(
    countyId: string,
    districtName: string | null | undefined,
  ) {
    if (!districtName) return null;
    const normalized = districtName.trim().toLowerCase();
    const county = await this.getCountyById(countyId).catch(() => null);
    if (!county) return null;
    return (
      county.districts.find((d) => d.name.toLowerCase() === normalized) ?? null
    );
  }

  // --- Admin-driven district entry -------------------------------------
  // Districts are never bulk-seeded from a static file (see seed-geography.ts
  // comment) — an admin enters them one at a time, source-attributed, and
  // marks them verified once confirmed against an authoritative source.

  async createDistrict(input: {
    countyId: string;
    name: string;
    number?: number;
    seatCount?: number;
    source?: string;
  }) {
    await this.getCountyById(input.countyId); // throws NotFoundException if invalid
    const district = await this.prisma.electoralDistrict.create({
      data: {
        countyId: input.countyId,
        name: input.name,
        number: input.number,
        seatCount: input.seatCount ?? 1,
        source: input.source,
      },
    });
    this.invalidateCache();
    return district;
  }

  async updateDistrict(
    districtId: string,
    input: {
      name?: string;
      number?: number;
      seatCount?: number;
      source?: string;
    },
  ) {
    const district = await this.prisma.electoralDistrict.update({
      where: { id: districtId },
      data: input,
    });
    this.invalidateCache();
    return district;
  }

  async verifyDistrict(districtId: string) {
    const district = await this.prisma.electoralDistrict.update({
      where: { id: districtId },
      data: { verifiedAt: new Date() },
    });
    this.invalidateCache();
    return district;
  }

  async listAllDistricts() {
    return this.prisma.electoralDistrict.findMany({
      orderBy: [{ county: { name: 'asc' } }, { name: 'asc' }],
      include: { county: true },
    });
  }
}
