// Approximate centroid coordinates for Liberia's 15 counties, for
// visualization purposes only (marker placement on a heat-zone map) —
// NOT precise administrative boundaries. Keys are normalized to uppercase
// for case-insensitive lookup, since county values are free-text elsewhere
// in this codebase (e.g. "Montserrado" from petition creation vs
// "MONTSERRADO" from seeded Institution/User records).
export const LIBERIA_COUNTY_CENTROIDS: Record<string, [number, number]> = {
  BOMI: [6.75, -10.85],
  BONG: [6.83, -9.37],
  GBARPOLU: [7.5, -10.0],
  'GRAND BASSA': [6.05, -9.72],
  'GRAND CAPE MOUNT': [7.0, -11.1],
  'GRAND GEDEH': [5.85, -8.2],
  'GRAND KRU': [4.75, -8.2],
  LOFA: [8.3, -9.75],
  MARGIBI: [6.51, -10.11],
  MARYLAND: [4.75, -7.7],
  MONTSERRADO: [6.45, -10.35],
  NIMBA: [7.0, -8.75],
  'RIVER CESS': [5.9, -9.3],
  RIVERCESS: [5.9, -9.3],
  'RIVER GEE': [5.2, -7.8],
  SINOE: [5.3, -8.8],
};

// Liberia's approximate geographic center, used as the map's default view.
export const LIBERIA_CENTER: [number, number] = [6.45, -9.43];

export function getCountyCentroid(county: string): [number, number] | null {
  return LIBERIA_COUNTY_CENTROIDS[county.trim().toUpperCase()] ?? null;
}
