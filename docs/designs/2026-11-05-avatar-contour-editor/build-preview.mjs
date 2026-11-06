import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = path.dirname(fileURLToPath(import.meta.url));
const assetDirectory = path.join(directory, '..', '2026-11-04-avatar-stress-and-expressions', 'assets');
const visualizationDirectory = '/Users/manumena/.codex/visualizations/2026/11/04/01a1a773-db46-79e2-acff-45b0136e0a37';
const [template, spriteTools, editor, presetJson] = await Promise.all([
  readFile(path.join(directory, 'source.template.html'), 'utf8'),
  readFile(path.join(directory, 'sprites.js'), 'utf8'),
  readFile(path.join(directory, 'editor.js'), 'utf8'),
  readFile(path.join(directory, 'contour-presets.json'), 'utf8')
]);
const preset = JSON.parse(presetJson);
if (preset.version !== 1) throw new Error('Unsupported contour preset version.');

const propImages = Object.values(preset.props).map(prop => prop.image);
const assetNames = new Set(['base', 'hair', 'bob', 'buns', ...propImages]);
const assets = Object.fromEntries(await Promise.all([...assetNames].map(async name => {
  const filename = name + '.webp';
  let data;
  try {
    data = await readFile(path.join(directory, 'assets', filename));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    data = await readFile(path.join(assetDirectory, filename));
  }
  return [name, 'data:image/webp;base64,' + data.toString('base64')];
})));

const fragment = template
  .replace('__SPRITE_TOOLS__', () => spriteTools)
  .replace('__CONTOUR_CODE__', () => editor)
  .replace('__CONTOUR_PRESET__', () => JSON.stringify(preset).replaceAll('<', '\\u003c'))
  .replace('__AVATAR_ASSETS__', () => JSON.stringify(assets));

if (Buffer.byteLength(fragment) >= 1_000_000) throw new Error('The contour preview exceeds its size limit.');

await writeFile(path.join(directory, 'source.html'), fragment);
await writeFile(path.join(visualizationDirectory, 'avatar-contour-editor.html'), fragment);
