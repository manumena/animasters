/** Bump the schema when an older client could interpret a new catalog incorrectly. */
export const CATALOG_SCHEMA_VERSION = 4;
export const CATALOG_SCOPE = 'series';

// Both formats belong to the same searchable category. They do not automatically
// share an answer ID: season/franchise identity still comes from our mappings.
export type SeriesFormat = 'TV' | 'ONA';

/** Compact wire format; named tuple fields document each position in the JSON. */
export type CatalogEntry = [
  id: number,
  title: string,
  aliases: string[],
  priority: number,
  release: [format: SeriesFormat, year: number | null, episodes: number | null],
];

export interface CatalogData {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  scope: typeof CATALOG_SCOPE;
  entries: CatalogEntry[];
}

export interface CatalogManifest {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  scope: typeof CATALOG_SCOPE;
  version: string;
  url: string;
  bytes: number;
  entries: number;
  aliases: number;
  attribution: string;
  license: string;
  licenseUrl: string;
}

/** Only these small result objects cross from the worker back to React. */
export interface AnimeOption {
  id: number;
  title: string;
  matchedAlias: string;
  detail: string;
}

// Loading state is shared with React through CatalogClient's subscription API.
export type CatalogPhase = 'idle' | 'downloading' | 'indexing' | 'ready' | 'error';

export interface CatalogState {
  phase: CatalogPhase;
  manifest?: CatalogManifest;
  error?: string;
}

// requestId links a search reply to the Promise created for that query.
export type WorkerRequest =
  | { type: 'load'; version?: string }
  | { type: 'search'; requestId: number; query: string };

export type WorkerReply =
  | { type: 'state'; state: CatalogState }
  | { type: 'results'; requestId: number; results: AnimeOption[] };
