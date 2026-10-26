import { validateCatalog } from './search';
import { CATALOG_SCHEMA_VERSION, CATALOG_SCOPE } from './types';
import type { CatalogData, CatalogManifest, CatalogState } from './types';

const VERSION_PATTERN = /^[a-f0-9]{64}$/;
const DOWNLOAD_TIMEOUT_MS = 90_000;
export const MAX_CATALOG_BYTES = 20 * 1024 * 1024;

function isIntegerWithin(value: unknown, minimum: number, maximum: number): boolean {
  return (
    typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum
  );
}

/** Reject unknown schemas, unexpected URLs, and unreasonable sizes before download. */
export function validateManifest(
  value: unknown,
  expectedVersion?: string,
): asserts value is CatalogManifest {
  const manifest = value as Partial<CatalogManifest> | null;
  if (!manifest) throw new Error('Unsupported catalog manifest');

  const supportedSchema =
    manifest.schemaVersion === CATALOG_SCHEMA_VERSION && manifest.scope === CATALOG_SCOPE;
  const validVersion =
    typeof manifest.version === 'string' &&
    VERSION_PATTERN.test(manifest.version) &&
    (!expectedVersion || manifest.version === expectedVersion);
  const validPaths =
    manifest.url === `/catalog/anime.${manifest.version}.json` &&
    manifest.licenseUrl === '/catalog/LICENSE.txt';
  const validCounts =
    isIntegerWithin(manifest.bytes, 1, MAX_CATALOG_BYTES) &&
    isIntegerWithin(manifest.entries, 1, 100_000) &&
    isIntegerWithin(manifest.aliases, 0, 1_000_000);
  const hasAttribution =
    typeof manifest.attribution === 'string' && typeof manifest.license === 'string';

  if (!supportedSchema || !validVersion || !validPaths || !validCounts || !hasAttribution) {
    throw new Error('Unsupported catalog manifest');
  }
}

async function verifyDownload(bytes: ArrayBuffer, manifest: CatalogManifest) {
  if (bytes.byteLength !== manifest.bytes) {
    throw new Error('Incomplete catalog download');
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  if (hash !== manifest.version) {
    throw new Error('Catalog integrity check failed');
  }
}

/** Download once per worker and validate before allowing any search requests. */
export async function loadCatalog(
  onState: (state: CatalogState) => void,
  version?: string,
): Promise<{ data: CatalogData; manifest: CatalogManifest }> {
  if (version && !VERSION_PATTERN.test(version)) {
    throw new Error('Invalid catalog version');
  }

  const signal = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);
  onState({ phase: 'downloading' });

  // Latest manifests revalidate. A room-pinned manifest can use immutable caching.
  const manifestUrl = version ? `/catalog/manifest.${version}.json` : '/catalog/manifest.json';
  const response = await fetch(manifestUrl, {
    cache: version ? 'default' : 'no-cache',
    signal,
  });
  if (!response.ok) throw new Error('Catalog manifest unavailable');

  const manifest: unknown = await response.json();
  validateManifest(manifest, version);
  onState({ phase: 'downloading', manifest });

  // Hash-named catalog files are reusable through the normal browser HTTP cache.
  const asset = await fetch(manifest.url, { cache: 'default', signal });
  if (!asset.ok) throw new Error('Catalog download failed');

  const bytes = await asset.arrayBuffer();
  await verifyDownload(bytes, manifest);

  // Parsing and validation also happen in the worker, away from the UI thread.
  onState({ phase: 'indexing', manifest });
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
  validateCatalog(data, manifest);
  return { data, manifest };
}
