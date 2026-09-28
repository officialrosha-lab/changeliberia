import { Injectable, Logger } from '@nestjs/common';

// Canonical Title Case county names, matching the COUNTIES list used across
// the frontend (e.g. apps/web/app/create/create-form.tsx) and therefore the
// casing petition.county / declaredCounty are stored in.
const LIBERIA_COUNTIES = [
  'Bomi',
  'Bong',
  'Gbarpolu',
  'Grand Bassa',
  'Grand Cape Mount',
  'Grand Gedeh',
  'Grand Kru',
  'Lofa',
  'Margibi',
  'Maryland',
  'Montserrado',
  'Nimba',
  'River Cess',
  'River Gee',
  'Sinoe',
] as const;

// Liberia's counties double as its ISO 3166-2 subdivisions, so ip-api.com's
// `regionName` often already names one directly — normalized here since
// third-party casing/spacing isn't guaranteed to match our canonical form.
const COUNTY_BY_NORMALIZED_REGION = new Map<string, string>(
  LIBERIA_COUNTIES.map((c) => [c.toUpperCase(), c]),
);
COUNTY_BY_NORMALIZED_REGION.set('RIVERCESS', 'River Cess');

// Fallback for when the geo API reports a city instead of a subdivision.
const COUNTY_BY_CITY = new Map<string, string>([
  ['MONROVIA', 'Montserrado'],
  ['PAYNESVILLE', 'Montserrado'],
  ['BENSONVILLE', 'Montserrado'],
  ['KAKATA', 'Margibi'],
  ['GBARNGA', 'Bong'],
  ['BUCHANAN', 'Grand Bassa'],
  ['VOINJAMA', 'Lofa'],
  ['SANNIQUELLIE', 'Nimba'],
  ['GANTA', 'Nimba'],
  ['HARPER', 'Maryland'],
  ['ZWEDRU', 'Grand Gedeh'],
  ['ROBERTSPORT', 'Grand Cape Mount'],
  ['GREENVILLE', 'Sinoe'],
  ['BARCLAYVILLE', 'Grand Kru'],
  ['FISH TOWN', 'River Gee'],
  ['CESTOS CITY', 'River Cess'],
  ['BOPOLU', 'Gbarpolu'],
  ['TUBMANBURG', 'Bomi'],
]);

interface CacheEntry {
  county: string | null;
  expiresAt: number;
}

// IPs cluster heavily on shared carrier/office NATs in Liberia, so caching
// keeps repeat signers from re-hitting the (rate-limited, free-tier) geo API.
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Resolves a signer's IP to a Liberian county, best-effort, for use as
 * `ipRegionHint` — a corroborating, non-authoritative signal in signature
 * location classification (see LocationClassificationService). Deliberately
 * soft-fails on any error, timeout, or non-Liberia IP: a wrong or missing
 * hint only costs a few confidence-score points, never blocks or alters
 * signing.
 */
@Injectable()
export class IpRegionHintService {
  private readonly logger = new Logger(IpRegionHintService.name);
  private readonly cache = new Map<string, CacheEntry>();

  async lookup(rawIp: string | undefined): Promise<string | null> {
    const ip = this.normalizeIp(rawIp);
    if (!ip) return null;

    const cached = this.cache.get(ip);
    if (cached && cached.expiresAt > Date.now()) return cached.county;

    const county = await this.resolve(ip);
    this.cache.set(ip, { county, expiresAt: Date.now() + CACHE_TTL_MS });
    return county;
  }

  private normalizeIp(rawIp: string | undefined): string | null {
    if (!rawIp) return null;
    const ip = rawIp.replace(/^::ffff:/, '').trim();
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1')
      return null;
    if (
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    )
      return null;
    return ip;
  }

  private async resolve(ip: string): Promise<string | null> {
    try {
      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city`,
        { signal: AbortSignal.timeout(2000) },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        status?: string;
        countryCode?: string;
        regionName?: string;
        city?: string;
      };
      // Only resolve a county for IPs the geo API itself places in Liberia —
      // diaspora signers are identified separately via account verification
      // status, so a foreign IP should never masquerade as an in-country hint.
      if (data.status !== 'success' || data.countryCode !== 'LR') return null;

      const byRegion = data.regionName
        ? COUNTY_BY_NORMALIZED_REGION.get(data.regionName.trim().toUpperCase())
        : undefined;
      if (byRegion) return byRegion;

      const byCity = data.city
        ? COUNTY_BY_CITY.get(data.city.trim().toUpperCase())
        : undefined;
      return byCity ?? null;
    } catch (err) {
      this.logger.debug(
        `IP region hint lookup failed for ${ip}: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
