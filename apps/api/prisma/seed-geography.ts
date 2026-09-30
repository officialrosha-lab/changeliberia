import { PrismaClient } from '@prisma/client';

// Liberia's 15 counties — canonical Title Case names, matching the casing
// already used as the source of truth elsewhere in this codebase:
// apps/api/src/signatures/liberia-county-adjacency.ts and
// apps/web/app/create/create-form.tsx's COUNTIES list.
//
// Electoral districts are deliberately NOT seeded here — see the
// AdminGeographyController for admin-driven, source-attributed district
// entry. Liberia's National Elections Commission periodically redraws
// district lines and no verified authoritative dataset was available at
// build time; fabricating district boundaries/counts would be worse than
// leaving them empty.
export const LIBERIA_COUNTIES: {
  name: string;
  code: string;
  capital: string;
}[] = [
  { name: 'Bomi', code: 'BM', capital: 'Tubmanburg' },
  { name: 'Bong', code: 'BG', capital: 'Gbarnga' },
  { name: 'Gbarpolu', code: 'GP', capital: 'Bopolu' },
  { name: 'Grand Bassa', code: 'GB', capital: 'Buchanan' },
  { name: 'Grand Cape Mount', code: 'GC', capital: 'Robertsport' },
  { name: 'Grand Gedeh', code: 'GG', capital: 'Zwedru' },
  { name: 'Grand Kru', code: 'GK', capital: 'Barclayville' },
  { name: 'Lofa', code: 'LO', capital: 'Voinjama' },
  { name: 'Margibi', code: 'MG', capital: 'Kakata' },
  { name: 'Maryland', code: 'MY', capital: 'Harper' },
  { name: 'Montserrado', code: 'MO', capital: 'Bensonville' },
  { name: 'Nimba', code: 'NI', capital: 'Sanniquellie' },
  { name: 'River Cess', code: 'RC', capital: 'Cestos City' },
  { name: 'River Gee', code: 'RG', capital: 'Fish Town' },
  { name: 'Sinoe', code: 'SI', capital: 'Greenville' },
];

export async function seedGeography(prisma: PrismaClient): Promise<void> {
  for (const county of LIBERIA_COUNTIES) {
    await prisma.county.upsert({
      where: { name: county.name },
      update: { code: county.code, capital: county.capital },
      create: county,
    });
  }
  console.log(`✅ Seeded ${LIBERIA_COUNTIES.length} counties`);
}
