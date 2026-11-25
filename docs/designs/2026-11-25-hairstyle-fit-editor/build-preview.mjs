import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const visualizationDirectory = '/Users/manumena/.codex/visualizations/2026/11/04/01a1a773-db46-79e2-acff-45b0136e0a37';
const [template, spriteTools, editor, presetJson, savedFitsJson] = await Promise.all([
  readFile(path.join(directory, 'source.template.html'), 'utf8'),
  readFile(path.join(directory, 'sprites.js'), 'utf8'),
  readFile(path.join(directory, 'editor.js'), 'utf8'),
  readFile(path.join(directory, 'hair-presets.json'), 'utf8'),
  readFile(path.join(directory, 'owner-hair-fit-export.json'), 'utf8'),
]);
const preset = JSON.parse(presetJson);
if (preset.version !== 1) throw new Error('Unsupported hairstyle preset version.');

const names = ['base', 'face', ...Object.keys(preset.styles)];
const assetEntries = await Promise.all(names.map(async name => {
  const image = await readFile(path.join(directory, 'assets', name + '.webp'));
  return [name, 'data:image/webp;base64,' + image.toString('base64')];
}));

// Asset data is inserted last so replacements never interpret embedded content.
const fragment = template
  .replace('__SPRITE_TOOLS__', () => spriteTools)
  .replace('__HAIR_EDITOR__', () => editor)
  .replace('__HAIR_PRESET__', () => JSON.stringify(preset).replaceAll('<', '\\u003c'))
  .replace('__SAVED_HAIR_FITS__', () => JSON.stringify(JSON.parse(savedFitsJson)).replaceAll('<', '\\u003c'))
  .replace('__HAIR_ASSETS__', () => JSON.stringify(Object.fromEntries(assetEntries)));

if (Buffer.byteLength(fragment) >= 1_000_000) throw new Error('The hairstyle editor exceeds its inline size limit.');
await writeFile(path.join(directory, 'source.html'), fragment);
// Refresh the archive without replacing a live calibration surface when integrating.
if (!process.argv.includes('--archive-only')) {
  await writeFile(path.join(visualizationDirectory, 'hairstyle-fit-editor.html'), fragment);
}
