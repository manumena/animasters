import { CATALOG_SCHEMA_VERSION, CATALOG_SCOPE } from './types.ts';
import type {
  AnimeOption,
  CatalogData,
  CatalogEntry,
  CatalogManifest,
  SeriesFormat,
} from './types.ts';

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export const RESULT_LIMIT = 12;

const FORMAT_LABELS: Record<SeriesFormat, string> = {
  TV: 'TV series',
  ONA: 'Web series',
};

const MATCH_QUALITY = {
  exact: 0,
  titlePrefix: 1,
  aliasPrefix: 2,
  substring: 3,
  reorderedWords: 4,
};

// Normalization affects search only. It must never decide whether two anime
// are the same answer: that is determined by the catalog's stable IDs.
export function normalizeWords(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function normalizeTerm(text: string): string {
  return normalizeWords(text).replace(/ /g, '');
}

// Validate the wire format before constructing arrays used by the search index.
function validateEntry(value: unknown, previousId: number): asserts value is CatalogEntry {
  if (!Array.isArray(value) || value.length !== 5) {
    throw new Error('Invalid catalog entry');
  }

  const [id, title, aliases, priority, release] = value;
  const validId = Number.isSafeInteger(id) && id > previousId;
  const validTitle = typeof title === 'string' && title.trim().length > 0;
  const validAliases =
    Array.isArray(aliases) &&
    aliases.every((alias) => typeof alias === 'string' && alias.trim().length > 0);
  const validPriority = Number.isInteger(priority) && priority >= 0 && priority <= 100;
  const validSeries =
    Array.isArray(release) &&
    release.length === 3 &&
    (release[0] === 'TV' || release[0] === 'ONA') &&
    (release[1] === null || Number.isInteger(release[1])) &&
    (release[2] === null || (Number.isSafeInteger(release[2]) && release[2] > 0)) &&
    // Unknown counts cannot establish that an ONA release is episodic.
    (release[0] !== 'ONA' || (release[2] !== null && release[2] > 1));

  if (!validId || !validTitle || !validAliases || !validPriority || !validSeries) {
    throw new Error('Invalid catalog entry: expected a TV or web series');
  }
}

export function validateCatalog(
  value: unknown,
  manifest: CatalogManifest,
): asserts value is CatalogData {
  const data = value as Partial<CatalogData> | null;
  if (
    !data ||
    data.schemaVersion !== CATALOG_SCHEMA_VERSION ||
    data.scope !== CATALOG_SCOPE ||
    !Array.isArray(data.entries) ||
    data.entries.length !== manifest.entries
  ) {
    throw new Error('Unsupported or incomplete catalog');
  }

  let previousId = 0;
  let aliasCount = 0;
  for (const entry of data.entries) {
    validateEntry(entry, previousId);
    previousId = entry[0];
    aliasCount += entry[2].length;
  }

  if (aliasCount !== manifest.aliases) {
    throw new Error('Incomplete catalog aliases');
  }
}

interface Candidate {
  entryIndex: number;
  aliasIndex: number;
  quality: number;
}

export class CatalogIndex {
  // Answer metadata is stored once. Many aliases can point to the same answer.
  private readonly answers: [id: number, title: string][] = [];
  private readonly normalizedTitles: string[] = [];
  private readonly priorities: number[] = [];
  private readonly details: string[] = [];

  // Parallel arrays avoid allocating a large object for every alias.
  private readonly terms: string[] = [];
  private readonly labels: string[] = [];
  private readonly owners: Uint32Array;
  private readonly sortedAliases: Uint32Array;

  constructor(data: CatalogData) {
    const owners: number[] = [];
    for (const entry of data.entries) {
      this.addEntry(entry, owners);
    }

    this.owners = Uint32Array.from(owners);
    this.sortedAliases = Uint32Array.from(this.terms, (_, index) => index);
    this.sortedAliases.sort((left, right) => {
      if (this.terms[left] < this.terms[right]) return -1;
      if (this.terms[left] > this.terms[right]) return 1;
      return left - right;
    });
  }

  private addEntry([id, title, aliases, priority, [format, year]]: CatalogEntry, owners: number[]) {
    const entryIndex = this.answers.length;
    this.answers.push([id, title]);
    this.normalizedTitles.push(normalizeTerm(title));
    this.priorities.push(priority);
    this.details.push([FORMAT_LABELS[format], year].filter(Boolean).join(' · '));

    // Keep one searchable copy of equivalent aliases within an answer.
    // Identical aliases belonging to different answers remain searchable.
    const seen = new Set<string>();
    for (const label of [title, ...aliases]) {
      const term = normalizeTerm(label);
      if (!term || seen.has(term)) continue;

      seen.add(term);
      this.terms.push(term);
      this.labels.push(label);
      owners.push(entryIndex);
    }
  }

  search(text: string, limit = RESULT_LIMIT): AnimeOption[] {
    const words = normalizeWords(text.slice(0, MAX_QUERY_LENGTH));
    const query = words.replace(/ /g, '');
    if ([...query].length < MIN_QUERY_LENGTH) return [];

    const resultLimit = Math.max(1, Math.min(20, Math.floor(limit)));
    const candidates = new Map<number, Candidate>();
    this.collectPrefixMatches(query, candidates);
    this.collectPartialMatches(query, words.split(' '), candidates);

    return [...candidates.values()]
      .sort((left, right) => this.compareCandidates(left, right))
      .slice(0, resultLimit)
      .map((candidate) => this.toOption(candidate));
  }

  // Binary search finds the first alias at or after the requested prefix.
  private findPrefixStart(query: string): number {
    let left = 0;
    let right = this.sortedAliases.length;
    while (left < right) {
      const middle = Math.floor((left + right) / 2);
      if (this.terms[this.sortedAliases[middle]] < query) left = middle + 1;
      else right = middle;
    }
    return left;
  }

  private collectPrefixMatches(query: string, candidates: Map<number, Candidate>) {
    for (
      let position = this.findPrefixStart(query);
      position < this.sortedAliases.length;
      position++
    ) {
      const aliasIndex = this.sortedAliases[position];
      const term = this.terms[aliasIndex];
      if (!term.startsWith(query)) break;

      const title = this.normalizedTitles[this.owners[aliasIndex]];
      let quality = MATCH_QUALITY.aliasPrefix;
      if (term === query) quality = MATCH_QUALITY.exact;
      else if (title.startsWith(query)) quality = MATCH_QUALITY.titlePrefix;

      this.rememberCandidate(candidates, aliasIndex, quality);
    }
  }

  private collectPartialMatches(
    query: string,
    tokens: string[],
    candidates: Map<number, Candidate>,
  ) {
    // Always consider internal/reordered matches. Otherwise many obscure prefix
    // matches could hide a more popular series whose alias contains the query.
    for (let aliasIndex = 0; aliasIndex < this.terms.length; aliasIndex++) {
      const term = this.terms[aliasIndex];
      if (term.includes(query)) {
        this.rememberCandidate(candidates, aliasIndex, MATCH_QUALITY.substring);
      } else if (tokens.length > 1 && tokens.every((token) => term.includes(token))) {
        this.rememberCandidate(candidates, aliasIndex, MATCH_QUALITY.reorderedWords);
      }
    }
  }

  private rememberCandidate(
    candidates: Map<number, Candidate>,
    aliasIndex: number,
    quality: number,
  ) {
    const entryIndex = this.owners[aliasIndex];
    const previous = candidates.get(entryIndex);
    if (!previous || quality < previous.quality) {
      candidates.set(entryIndex, { entryIndex, aliasIndex, quality });
    }
  }

  private compareCandidates(left: Candidate, right: Candidate): number {
    // Product rule: exact title/alias matches beat every partial match. Within
    // those two groups, popularity/editorial priority comes before match quality.
    const exactOrder =
      Number(left.quality !== MATCH_QUALITY.exact) - Number(right.quality !== MATCH_QUALITY.exact);
    const priorityOrder = this.priorities[right.entryIndex] - this.priorities[left.entryIndex];
    const qualityOrder = left.quality - right.quality;

    // Stable tie-breakers prevent otherwise equal results jumping between queries.
    const titleLengthOrder =
      this.answers[left.entryIndex][1].length - this.answers[right.entryIndex][1].length;
    const idOrder = this.answers[left.entryIndex][0] - this.answers[right.entryIndex][0];
    return exactOrder || priorityOrder || qualityOrder || titleLengthOrder || idOrder;
  }

  private toOption({ entryIndex, aliasIndex }: Candidate): AnimeOption {
    return {
      id: this.answers[entryIndex][0],
      title: this.answers[entryIndex][1],
      matchedAlias: this.labels[aliasIndex],
      detail: this.details[entryIndex],
    };
  }
}
