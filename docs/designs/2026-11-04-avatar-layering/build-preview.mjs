import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sketchDirectory = path.dirname(fileURLToPath(import.meta.url));
const visualizationDirectory = '/Users/manumena/.codex/visualizations/2026/11/04/01a1a773-db46-79e2-acff-45b0136e0a37';
const assets = {};

// Embedding the compressed sources keeps the live preview offline and portable.
for (const name of ['base', 'hair', 'props']) {
  const buffer = await readFile(path.join(sketchDirectory, 'assets', name + '.webp'));
  assets[name] = 'data:image/webp;base64,' + buffer.toString('base64');
}

const template = await readFile(path.join(sketchDirectory, 'source.template.html'), 'utf8');
const fragment = template.replace('__AVATAR_ASSETS__', JSON.stringify(assets));

if (Buffer.byteLength(fragment) >= 1_000_000) throw new Error('The inline preview exceeds its size limit.');

await mkdir(visualizationDirectory, { recursive: true });
await writeFile(path.join(sketchDirectory, 'source.html'), fragment);
await writeFile(path.join(visualizationDirectory, 'avatar-layering.html'), fragment);
console.log('Wrote interactive fragment (' + Buffer.byteLength(fragment) + ' bytes).');
