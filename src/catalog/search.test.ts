import { describe, expect, it } from 'vitest';
import { CatalogIndex, validateCatalog } from './search';
import type { CatalogData, CatalogManifest } from './types';

// Small fixtures cover aliases and identity boundaries independently of the real export.
const data: CatalogData = {
  schemaVersion: 4,
  scope: 'series',
  entries: [
    [42, 'Naruto', ['NARUTO', 'ナルト']],
    [43, 'Naruto Shippuden', ['Naruto: Shippuuden', 'Shippuden']],
    [100, 'Boku no Hero Academia', ['My Hero Academia', 'Boku no Hero Academia Season 2', 'MHA']],
    [101, 'Pokémon', ['Pocket Monsters']],
    [102, 'Steins;Gate', ['STEINS GATE']],
    [103, 'Unrelated anime with no songs', ['Shared name']],
    [104, 'Different anime', ['Shared name']],
    [105, 'Attack on Titan', ['Shingeki no Kyojin']],
  ].map(
    ([id, title, aliases]) =>
      [id, title, aliases, 0, ['TV', 2000, null]] as CatalogData['entries'][number],
  ),
};
const index = new CatalogIndex(data);

describe('local catalog search', () => {
  it('returns stable canonical IDs, deduplicates aliases, and keeps major sequels distinct', () => {
    const results = index.search('naruto');
    expect(results[0].id).toBe(42);
    expect(results.filter((result) => result.id === 42)).toHaveLength(1);
    expect(results.some((result) => result.id === 43)).toBe(true);
    expect(index.search('Boku no Hero Academia Season 2')[0].id).toBe(100);
  });

  it('supports accents, punctuation, scripts, and aliases without using song availability', () => {
    expect(index.search('pokemon')[0].id).toBe(101);
    expect(index.search('steins gate')[0].id).toBe(102);
    expect(index.search('ナルト')[0].id).toBe(42);
    expect(index.search('MHA')[0].id).toBe(100);
    expect(index.search('Shared name').map((result) => result.id)).toEqual(
      expect.arrayContaining([103, 104]),
    );
  });

  it('finds internal and reordered words; bounds output and handles empty/missing queries', () => {
    expect(index.search('Titan Attack')[0].id).toBe(105);
    expect(index.search('no hero')[0].id).toBe(100);
    expect(index.search('a')).toEqual([]);
    expect(index.search('  ')).toEqual([]);
    expect(index.search('nonexistent')).toEqual([]);
    expect(index.search('naruto', 1)).toHaveLength(1);
  });

  it('rejects malformed entries and mismatched counts before building an index', () => {
    const manifest = { entries: data.entries.length, aliases: 12 } as CatalogManifest;
    expect(() => validateCatalog(data, manifest)).not.toThrow();
    expect(() => validateCatalog({ schemaVersion: 1, entries: [] }, manifest)).toThrow();
    expect(() =>
      validateCatalog(
        { ...data, entries: [...data.entries, data.entries[0]] },
        { ...manifest, entries: 9 },
      ),
    ).toThrow();
    expect(() => validateCatalog(data, { ...manifest, aliases: 100 })).toThrow();
  });
});

it('ranks exact title or alias matches first, then editorial popularity across all partial matches', () => {
  const ranked = new CatalogIndex({
    schemaVersion: 4,
    scope: 'series',
    entries: [
      [1, 'Nanatsu no Umi no Tico', [], 0, ['TV', 1994, null]],
      [2, 'Nanatsu no Taizai', ['The Seven Deadly Sins'], 90, ['TV', 2014, null]],
      [3, 'Obscure title', ['Nanatsu no Umi no Tico'], 5, ['ONA', 2015, 12]],
      [4, 'The Extremely Famous Nanatsu Story', [], 100, ['TV', 2020, null]],
    ],
  });
  expect(ranked.search('Nanatsu').map((row) => row.id)).toEqual([4, 2, 3, 1]);
  expect(ranked.search('Nanatsu no Umi no Tico').map((row) => row.id)).toEqual([3, 1]);
  expect(ranked.search('The Seven Deadly Sins')[0].id).toBe(2);
  expect(ranked.search('Nanatsu')[1].detail).toBe('TV series · 2014');
});

it.each(['MOVIE', 'OVA', 'SPECIAL', 'UNKNOWN', null])('rejects non-series format %s', (format) => {
  const catalog = { ...data, entries: [[42, 'Excluded anime', [], 0, [format, 2000, 12]]] };
  const manifest = { entries: 1, aliases: 0 } as CatalogManifest;
  expect(() => validateCatalog(catalog, manifest)).toThrow();
});

it('accepts web series and rejects an incorrectly scoped catalog', () => {
  const catalog = {
    schemaVersion: 4,
    scope: 'series',
    entries: [[42, 'Web series', [], 0, ['ONA', 2020, 12]]],
  };
  const manifest = { entries: 1, aliases: 0 } as CatalogManifest;
  expect(() => validateCatalog(catalog, manifest)).not.toThrow();
  expect(() => validateCatalog({ ...catalog, scope: 'all' }, manifest)).toThrow();
});

it.each([null, 0, 1, -1, 2.5])('rejects a web release with episode count %s', (episodes) => {
  const catalog = {
    schemaVersion: 4,
    scope: 'series',
    entries: [[42, 'Not eligible', [], 0, ['ONA', 2020, episodes]]],
  };
  const manifest = { entries: 1, aliases: 0 } as CatalogManifest;
  expect(() => validateCatalog(catalog, manifest)).toThrow();
});
