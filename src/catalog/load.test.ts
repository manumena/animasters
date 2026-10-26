import { webcrypto } from 'node:crypto';
import { beforeEach, expect, it, vi } from 'vitest';
import { loadCatalog } from './load';
import type { CatalogState } from './types';

async function fixture() {
  const bytes = new TextEncoder().encode(
    JSON.stringify({
      schemaVersion: 4,
      scope: 'series',
      entries: [[42, 'Naruto', [], 100, ['TV', 2002, null]]],
    }),
  );
  const hash = await webcrypto.subtle.digest('SHA-256', bytes);
  const version = Buffer.from(hash).toString('hex');
  const manifest = {
    schemaVersion: 4,
    scope: 'series',
    version,
    url: `/catalog/anime.${version}.json`,
    bytes: bytes.byteLength,
    entries: 1,
    aliases: 0,
    attribution: 'Manami',
    license: 'ODbL-1.0',
    licenseUrl: '/catalog/LICENSE.txt',
  };
  return { bytes, manifest };
}

beforeEach(() => vi.stubGlobal('crypto', webcrypto));

it('revalidates the manifest and verifies the full immutable download before indexing', async () => {
  const { bytes, manifest } = await fixture();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => manifest })
    .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => bytes.buffer });
  vi.stubGlobal('fetch', fetch);
  const states: CatalogState[] = [];
  const loaded = await loadCatalog((state) => states.push(state));
  expect(loaded.data.entries[0][0]).toBe(42);
  expect(fetch.mock.calls[0]).toEqual([
    '/catalog/manifest.json',
    expect.objectContaining({ cache: 'no-cache' }),
  ]);
  expect(fetch.mock.calls[1]).toEqual([
    manifest.url,
    expect.objectContaining({ cache: 'default' }),
  ]);
  expect(states.map((state) => state.phase)).toEqual(['downloading', 'downloading', 'indexing']);
});

it('rejects corrupted bytes and unavailable manifests instead of silently reducing the catalog', async () => {
  const { bytes, manifest } = await fixture();
  const corrupt = bytes.slice();
  corrupt[0] = 32;
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => manifest })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => corrupt.buffer }),
  );
  await expect(loadCatalog(() => {})).rejects.toThrow('integrity');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  await expect(loadCatalog(() => {})).rejects.toThrow('unavailable');
});

it('pins an explicit version and rejects a mismatched or unsupported manifest', async () => {
  const { manifest } = await fixture();
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });
  vi.stubGlobal('fetch', fetch);
  await expect(loadCatalog(() => {}, 'b'.repeat(64))).rejects.toThrow('manifest');
  expect(fetch.mock.calls[0][0]).toBe(`/catalog/manifest.${'b'.repeat(64)}.json`);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...manifest, schemaVersion: 99 }) }),
  );
  await expect(loadCatalog(() => {})).rejects.toThrow('manifest');
});
