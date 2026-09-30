import { normalizeName, resolveRows, GeoRow } from './backfill-geography';

describe('backfill-geography', () => {
  describe('normalizeName', () => {
    it('lowercases and strips whitespace', () => {
      expect(normalizeName('  Montserrado  ')).toBe('montserrado');
    });

    it('handles the real casing mismatch already present in the codebase', () => {
      expect(normalizeName('MONTSERRADO')).toBe(normalizeName('Montserrado'));
    });

    it('handles a spacing variant (River Cess vs Rivercess)', () => {
      expect(normalizeName('River Cess')).toBe(normalizeName('RIVERCESS'));
    });

    it('strips a trailing/embedded "county" word', () => {
      expect(normalizeName('Montserrado County')).toBe(
        normalizeName('Montserrado'),
      );
    });

    it('strips punctuation', () => {
      expect(normalizeName('Grand Cape Mount,')).toBe(
        normalizeName('Grand Cape Mount'),
      );
    });
  });

  describe('resolveRows', () => {
    const montserradoId = 'county-mo';
    const bongId = 'county-bg';
    const countyByNormalizedName = new Map([
      ['montserrado', { id: montserradoId }],
      ['bong', { id: bongId }],
    ]);
    const districtByCounty = new Map([
      [montserradoId, new Map([['district10', { id: 'district-10' }]])],
      [bongId, new Map()],
    ]);

    it('resolves a matched county and groups rows by resolved county', () => {
      const rows: GeoRow[] = [
        { id: 'p1', county: 'MONTSERRADO', district: null },
        { id: 'p2', county: 'Montserrado', district: null },
        { id: 'p3', county: 'Bong', district: null },
      ];
      const { groups, unmatched } = resolveRows(
        rows,
        countyByNormalizedName,
        districtByCounty,
      );
      expect(unmatched.size).toBe(0);
      const montserradoGroup = groups.find((g) => g.countyId === montserradoId);
      const bongGroup = groups.find((g) => g.countyId === bongId);
      expect(montserradoGroup?.ids.sort()).toEqual(['p1', 'p2']);
      expect(bongGroup?.ids).toEqual(['p3']);
    });

    it('resolves a matched district within the matched county', () => {
      const rows: GeoRow[] = [
        { id: 'p1', county: 'Montserrado', district: 'District #10' },
      ];
      const { groups } = resolveRows(
        rows,
        countyByNormalizedName,
        districtByCounty,
      );
      expect(groups).toHaveLength(1);
      expect(groups[0].electoralDistrictId).toBe('district-10');
    });

    it('resolves the county but leaves electoralDistrictId null for an unseeded district', () => {
      const rows: GeoRow[] = [
        { id: 'p1', county: 'Montserrado', district: 'District #99' },
      ];
      const { groups, unmatched } = resolveRows(
        rows,
        countyByNormalizedName,
        districtByCounty,
      );
      expect(groups).toHaveLength(1);
      expect(groups[0].electoralDistrictId).toBeNull();
      // An unmatched district does NOT count as an unmatched row — only an
      // unmatched county does, since districts are incrementally seeded.
      expect(unmatched.size).toBe(0);
    });

    it('logs an unmatched county value with its row count rather than throwing', () => {
      const rows: GeoRow[] = [
        { id: 'p1', county: 'Atlantis', district: null },
        { id: 'p2', county: 'Atlantis', district: null },
        { id: 'p3', county: 'Narnia', district: null },
      ];
      const { groups, unmatched } = resolveRows(
        rows,
        countyByNormalizedName,
        districtByCounty,
      );
      expect(groups).toHaveLength(0);
      expect(unmatched.get('Atlantis')).toBe(2);
      expect(unmatched.get('Narnia')).toBe(1);
    });

    it('skips rows with a null county entirely', () => {
      const rows: GeoRow[] = [{ id: 'p1', county: null, district: null }];
      const { groups, unmatched } = resolveRows(
        rows,
        countyByNormalizedName,
        districtByCounty,
      );
      expect(groups).toHaveLength(0);
      expect(unmatched.size).toBe(0);
    });
  });
});
