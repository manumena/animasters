import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const designs = path.dirname(directory);
const artworkDirectory = path.join(designs, '2026-11-04-avatar-stress-and-expressions', 'assets');
const contourDirectory = path.join(designs, '2026-11-05-avatar-contour-editor');
const visualizationDirectory = '/Users/manumena/.codex/visualizations/2026/11/04/01a1a773-db46-79e2-acff-45b0136e0a37';
const [template, spriteTools, renderer, editor, presetJson] = await Promise.all([
  readFile(path.join(directory, 'source.template.html'), 'utf8'),
  readFile(path.join(designs, '2026-11-05-combined-avatar-creator', 'sprites.js'), 'utf8'),
  readFile(path.join(directory, 'renderer.js'), 'utf8'),
  readFile(path.join(directory, 'interaction.js'), 'utf8'),
  readFile(path.join(contourDirectory, 'contour-presets.json'), 'utf8')
]);
const preset = JSON.parse(presetJson);
if (preset.version !== 1) throw new Error('Unsupported prop contour version.');

const assetNames = new Set(['blank3d', 'features3d', 'hair', 'bob', 'buns']);
for (const prop of Object.values(preset.props)) assetNames.add(prop.image);
const assets = Object.fromEntries(await Promise.all([...assetNames].map(async name => {
  const filename = name + '.webp';
  let data;
  try {
    data = await readFile(path.join(contourDirectory, 'assets', filename));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    data = await readFile(path.join(artworkDirectory, filename));
  }
  return [name, 'data:image/webp;base64,' + data.toString('base64')];
})));

const fragment = template
  .replace('__SPRITE_TOOLS__', () => spriteTools)
  .replace('__RENDERER__', () => renderer)
  .replace('__INTERACTION__', () => editor)
  .replace('__PROP_PROFILES__', () => JSON.stringify(preset.props).replaceAll('<', '\\u003c'))
  .replace('__AVATAR_ASSETS__', () => JSON.stringify(assets));

if (Buffer.byteLength(fragment) >= 1_000_000) throw new Error('The creator preview exceeds its size limit.');

await writeFile(path.join(directory, 'source.html'), fragment);
await writeFile(path.join(visualizationDirectory, 'avatar-arrow-layouts.html'), fragment);
