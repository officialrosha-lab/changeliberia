/**
 * One-off backfill: resolves existing free-text county/district values on
 * Institution, Petition, User, Poll, PollVote, and SignatureLocation to the
 * canonical County/ElectoralDistrict rows introduced for the Lawmaker
 * Constituency Portal (see apps/api/src/geography).
 *
 * Additive and idempotent — only touches rows where `countyId` is still
 * null, never drops or overwrites the free-text columns, and never throws
 * on an unmatched value; unmatched rows are logged for manual admin
 * cleanup via the county/district free-text columns (which remain the
 * source of truth for those rows until resolved).
 *
 * Run: npx tsx src/scripts/backfill-geography.ts
 * Not wired into any Nest module or the app's own seed/start scripts —
 * this is a deliberate one-time migration step, run manually per
 * environment.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Normalizes a free-text geography name for matching: lowercases, strips
 * a trailing/embedded "county" word, and strips all non-alphanumeric
 * characters. This single normalization handles the casing mismatch
 * already documented in this codebase (`'MONTSERRADO'` vs `'Montserrado'`)
 * and spacing variants (`'River Cess'` vs `'RIVERCESS'`, both of which
 * appear in apps/web/lib/liberia-counties.ts) without a hand-maintained
 * alias table.
 */
export function normalizeName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\bcounty\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export interface GeoRow {
  id: string;
  county: string | null;
  district: string | null;
}

interface ResolvedGroup {
  countyId: string;
  electoralDistrictId: string | null;
  ids: string[];
}

interface ResolveResult {
  groups: ResolvedGroup[];
  unmatched: Map<string, number>;
}

export function resolveRows(
  rows: GeoRow[],
  countyByNormalizedName: Map<string, { id: string }>,
  districtByCounty: Map<string, Map<string, { id: string }>>,
): ResolveResult {
  const groupMap = new Map<string, ResolvedGroup>();
  const unmatched = new Map<string, number>();

  for (const row of rows) {
    if (!row.county) continue;
    const county = countyByNormalizedName.get(normalizeName(row.county));
    if (!county) {
      unmatched.set(row.county, (unmatched.get(row.county) ?? 0) + 1);
      continue;
    }

    let electoralDistrictId: string | null = null;
    if (row.district) {
      const districtMap = districtByCounty.get(county.id);
      const district = districtMap?.get(normalizeName(row.district));
      electoralDistrictId = district?.id ?? null;
      // Note: an unmatched district (with a matched county) is NOT logged
      // as "unmatched" — districts are admin-populated incrementally (see
      // seed-geography.ts), so most rows legitimately have no district
      // match yet. The county-level FK still gets backfilled.
    }

    const key = `${county.id}::${electoralDistrictId ?? ''}`;
    let group = groupMap.get(key);
    if (!group) {
      group = { countyId: county.id, electoralDistrictId, ids: [] };
      groupMap.set(key, group);
    }
    group.ids.push(row.id);
  }

  return { groups: [...groupMap.values()], unmatched };
}

function report(
  label: string,
  totalRows: number,
  groups: ResolvedGroup[],
  unmatched: Map<string, number>,
): void {
  const matched = groups.reduce((sum, g) => sum + g.ids.length, 0);
  console.log(`\n${label}: ${matched}/${totalRows} rows resolved to a county`);
  if (unmatched.size > 0) {
    console.log(
      `  ${unmatched.size} distinct unmatched county value(s) — needs admin review:`,
    );
    for (const [value, count] of [...unmatched.entries()].sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`    "${value}" (${count} row${count === 1 ? '' : 's'})`);
    }
  }
}

async function backfillModel<T extends GeoRow>(
  label: string,
  findRows: () => Promise<T[]>,
  updateMany: (
    ids: string[],
    countyId: string,
    electoralDistrictId: string | null,
  ) => Promise<unknown>,
  countyByNormalizedName: Map<string, { id: string }>,
  districtByCounty: Map<string, Map<string, { id: string }>>,
): Promise<void> {
  const rows = await findRows();
  const { groups, unmatched } = resolveRows(
    rows,
    countyByNormalizedName,
    districtByCounty,
  );
  for (const group of groups) {
    await updateMany(group.ids, group.countyId, group.electoralDistrictId);
  }
  report(label, rows.length, groups, unmatched);
}

async function main() {
  const counties = await prisma.county.findMany({
    include: { districts: true },
  });
  if (counties.length === 0) {
    console.error(
      'No counties found — run `npx prisma db seed` (or seed-geography.ts) before backfilling.',
    );
    process.exitCode = 1;
    return;
  }

  const countyByNormalizedName = new Map(
    counties.map((c) => [normalizeName(c.name), { id: c.id }]),
  );
  const districtByCounty = new Map(
    counties.map((c) => [
      c.id,
      new Map(c.districts.map((d) => [normalizeName(d.name), { id: d.id }])),
    ]),
  );

  console.log(`Loaded ${counties.length} counties for matching.`);

  await backfillModel(
    'Institution',
    () =>
      prisma.institution.findMany({
        where: { countyId: null, county: { not: null } },
        select: { id: true, county: true, district: true },
      }),
    (ids, countyId, electoralDistrictId) =>
      prisma.institution.updateMany({
        where: { id: { in: ids } },
        data: { countyId, electoralDistrictId },
      }),
    countyByNormalizedName,
    districtByCounty,
  );

  await backfillModel(
    'Petition',
    () =>
      prisma.petition.findMany({
        where: { countyId: null, county: { not: null } },
        select: { id: true, county: true, district: true },
      }),
    (ids, countyId, electoralDistrictId) =>
      prisma.petition.updateMany({
        where: { id: { in: ids } },
        data: { countyId, electoralDistrictId },
      }),
    countyByNormalizedName,
    districtByCounty,
  );

  await backfillModel(
    'User',
    () =>
      prisma.user.findMany({
        where: { countyId: null, county: { not: null } },
        select: { id: true, county: true, district: true },
      }),
    (ids, countyId, electoralDistrictId) =>
      prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { countyId, electoralDistrictId },
      }),
    countyByNormalizedName,
    districtByCounty,
  );

  await backfillModel(
    'Poll',
    () =>
      prisma.poll.findMany({
        where: { countyId: null, county: { not: null } },
        select: { id: true, county: true, district: true },
      }),
    (ids, countyId, electoralDistrictId) =>
      prisma.poll.updateMany({
        where: { id: { in: ids } },
        data: { countyId, electoralDistrictId },
      }),
    countyByNormalizedName,
    districtByCounty,
  );

  await backfillModel(
    'PollVote',
    () =>
      prisma.pollVote.findMany({
        where: { countyId: null, county: { not: null } },
        select: { id: true, county: true, district: true },
      }),
    (ids, countyId, electoralDistrictId) =>
      prisma.pollVote.updateMany({
        where: { id: { in: ids } },
        data: { countyId, electoralDistrictId },
      }),
    countyByNormalizedName,
    districtByCounty,
  );

  await backfillModel(
    'SignatureLocation',
    () =>
      prisma.signatureLocation.findMany({
        where: { countyId: null, county: { not: null } },
        select: { id: true, county: true, district: true },
      }),
    (ids, countyId, electoralDistrictId) =>
      prisma.signatureLocation.updateMany({
        where: { id: { in: ids } },
        data: { countyId, electoralDistrictId },
      }),
    countyByNormalizedName,
    districtByCounty,
  );

  console.log('\nBackfill complete.');
}

// Guard against running as a side effect of import (e.g. from a unit test
// that only wants the exported pure functions) — only run when invoked
// directly as the script entrypoint.
if (require.main === module) {
  main()
    .catch((err: unknown) => {
      console.error(
        'Backfill failed:',
        err instanceof Error ? err.message : err,
      );
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
