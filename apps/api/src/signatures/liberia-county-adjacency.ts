// Approximate county-adjacency graph for Liberia's 15 counties. Used only
// as a soft "how geographically close is this signer to the petition's
// affected counties?" signal (NEARBY_COMMUNITY vs. no match) in
// LocationClassificationService — NOT precise administrative boundaries,
// the same caveat as apps/web/lib/liberia-counties.ts's centroid table.
// Keys/values are the canonical Title Case county names used throughout
// the app (see apps/web/app/create/create-form.tsx COUNTIES).
const COUNTY_NEIGHBORS: Record<string, string[]> = {
  Bomi: ['Grand Cape Mount', 'Gbarpolu', 'Bong', 'Montserrado'],
  Bong: [
    'Lofa',
    'Gbarpolu',
    'Bomi',
    'Montserrado',
    'Margibi',
    'Grand Bassa',
    'River Cess',
    'Nimba',
  ],
  Gbarpolu: ['Lofa', 'Bong', 'Bomi', 'Grand Cape Mount'],
  'Grand Bassa': ['Margibi', 'Bong', 'River Cess'],
  'Grand Cape Mount': ['Gbarpolu', 'Bomi'],
  'Grand Gedeh': ['Nimba', 'River Cess', 'Sinoe', 'Grand Kru', 'River Gee'],
  'Grand Kru': ['Sinoe', 'Grand Gedeh', 'River Gee'],
  Lofa: ['Gbarpolu', 'Bong', 'Nimba'],
  Margibi: ['Montserrado', 'Bong', 'Grand Bassa'],
  Maryland: ['River Gee'],
  Montserrado: ['Bomi', 'Bong', 'Margibi'],
  Nimba: ['Lofa', 'Bong', 'River Cess', 'Grand Gedeh'],
  'River Cess': ['Bong', 'Grand Bassa', 'Nimba', 'Grand Gedeh', 'Sinoe'],
  'River Gee': ['Grand Gedeh', 'Grand Kru', 'Maryland'],
  Sinoe: ['River Cess', 'Grand Gedeh', 'Grand Kru'],
};

export function isAdjacentCounty(a: string, b: string): boolean {
  return COUNTY_NEIGHBORS[a]?.includes(b) ?? false;
}

export function isAdjacentToAny(county: string, others: string[]): boolean {
  return others.some((other) => isAdjacentCounty(county, other));
}
