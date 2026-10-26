import fs from 'node:fs';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { setImmediate } from 'node:timers/promises';
import { URL } from 'node:url';
import console from 'node:console';
import assert from 'node:assert/strict';
import { CatalogIndex, validateCatalog } from '../src/catalog/search.ts';

// Load the same immutable asset shipped to the browser.
const manifest = JSON.parse(
  fs.readFileSync(new URL('../public/catalog/manifest.json', import.meta.url), 'utf8'),
);
globalThis.gc?.();
const before = process.memoryUsage();
function buildIndex() {
  const data = JSON.parse(
    fs.readFileSync(new URL(`../public${manifest.url}`, import.meta.url), 'utf8'),
  );
  validateCatalog(data, manifest);
  const start = performance.now();
  const index = new CatalogIndex(data);
  return { index, indexMs: performance.now() - start };
}
// Release parsing temporaries before measuring retained index memory.
const { index, indexMs } = buildIndex();
await setImmediate();
globalThis.gc?.();
await setImmediate();
globalThis.gc?.();
const after = process.memoryUsage();
const queries = [
  'Nanat',
  'Nanatsu no Umi no Tico',
  'naruto',
  'Shippuden',
  'attack titan',
  'boku hero',
  '進撃',
  'pokémon',
  'steins;gate',
  're zero',
  'one piece',
  'bleach',
  'dragon ball',
  'zzzznoanime',
  'na',
  'slayers',
  'hunterxhunter',
];
// Warm the same implementation used by the browser worker, then measure searches.
for (const query of queries) index.search(query);
const timings = [];
for (let repeat = 0; repeat < 10; repeat++) {
  for (const query of queries) {
    const start = performance.now();
    index.search(query);
    timings.push(performance.now() - start);
  }
}
timings.sort((a, b) => a - b);
// Check representative ranking and curation results against the real export.
assert.equal(index.search('Nanat')[0].title, 'Nanatsu no Taizai');
// Language cleanup must preserve supported translations and Japanese romaji.
for (const title of [
  'Attack on Titan',
  'Ataque a los Titanes',
  '進撃の巨人',
  'Shingeki no Kyojin',
]) {
  assert.equal(index.search(title)[0].id, 57);
}
assert.equal(index.search('Sakura Card Captors')[0].id, 6);
assert.equal(index.search('ナルト')[0].id, 42);
assert.deepEqual(index.search('אקאמה הרוצחת'), []);
assert.deepEqual(index.search('Убийца Акамэ!'), []);

assert.equal(index.search('Nanatsu no Umi no Tico')[0].title, 'Nanatsu no Umi no Tico');
assert.equal(
  index
    .search('one piece')
    .filter((row) => row.title === 'One Piece' && row.detail === 'TV series · 1999').length,
  1,
);
console.log(
  JSON.stringify(
    {
      environment: `Node ${process.version} ${process.platform}/${process.arch}; not a phone/browser benchmark`,
      version: manifest.version,
      entries: manifest.entries,
      additionalAliases: manifest.aliases,
      indexMs,
      retainedHeapBytes: after.heapUsed - before.heapUsed,
      retainedArrayBufferBytes: after.arrayBuffers - before.arrayBuffers,
      warmQueries: timings.length,
      searchP50Ms: timings[Math.floor(timings.length * 0.5)],
      searchP95Ms: timings[Math.floor(timings.length * 0.95)],
      searchMaxMs: timings.at(-1),
      note: 'Retained memory excludes startup peak. UI debounce, message delivery and rendering are not included.',
    },
    null,
    2,
  ),
);
