import { createRequire } from 'node:module';
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('/Users/manumena/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const directory = path.dirname(fileURLToPath(import.meta.url));
const generatedDirectory = '/Users/manumena/.codex/generated_images/01a1a773-db46-79e2-acff-45b0136e0a37';
const assetsDirectory = path.join(directory, 'assets');
const visualizationDirectory = '/Users/manumena/.codex/visualizations/2026/11/04/01a1a773-db46-79e2-acff-45b0136e0a37';
const generatedAssets = {
  headphones: ['exec-e15ab76e-43fd-47cd-a3fa-7b2700d62a1c.png', 640],
  glasses: ['exec-4dea8124-6215-4b46-adce-f5d0a1e54e50.png', 640],
  scarf: ['exec-430010bb-8ad5-46db-a934-386e8bec6d31.png', 640],
  bob: ['exec-7009b535-101b-4442-9934-409141554530.png', 640],
  buns: ['exec-b9cf587f-25c9-474b-95f4-b9612cb2836a.png', 640],
  blank3d: ['exec-f0c381b8-3270-40e7-ac0a-e500c918a985.png', 640],
  blankpixel: ['exec-02e207a4-6251-469b-bc2a-17a603d359fa.png', 640],
  features3d: ['exec-3b0021e6-837f-4c54-b52a-fba3f00c30b4.png', 900],
  featurespixel: ['exec-90e632cd-899f-4acd-931d-29efd930c4cc.png', 600]
};

await mkdir(assetsDirectory, { recursive: true });

// Original generated images remain available for art revisions. The embedded
// versions change only encoding/size, keeping their alpha channel intact.
for (const [name, [filename, width]] of Object.entries(generatedAssets)) {
  const input = path.join(assetsDirectory, name + '-source.png');
  try {
    await access(input);
  } catch {
    await copyFile(path.join(generatedDirectory, filename), input);
  }
  const image = sharp(input);
  if (name.includes('pixel')) {
    await image.resize({ width, kernel: 'nearest' }).webp({ lossless: true }).toFile(path.join(assetsDirectory, name + '.webp'));
  } else {
    await image.resize({ width }).webp({ quality: 88, alphaQuality: 100 }).toFile(path.join(assetsDirectory, name + '.webp'));
  }
}

for (const name of ['base', 'hair', 'props']) {
  const previous = path.join(directory, '..', '2026-11-04-avatar-layering', 'assets', name + '.webp');
  await copyFile(previous, path.join(assetsDirectory, name + '.webp'));
}

const definitions = [
  { template: 'props.template.html', name: 'avatar-prop-stress-test', assets: ['base', 'hair', 'props', 'headphones', 'glasses', 'scarf', 'bob', 'buns'] },
  { template: 'faces.template.html', name: 'avatar-expression-comparison', assets: ['blank3d', 'blankpixel', 'hair', 'features3d', 'featurespixel'] }
];

for (const definition of definitions) {
  const embedded = {};
  for (const name of definition.assets) {
    const bytes = await readFile(path.join(assetsDirectory, name + '.webp'));
    embedded[name] = 'data:image/webp;base64,' + bytes.toString('base64');
  }
  const template = await readFile(path.join(directory, definition.template), 'utf8');
  const fragment = template.replace('__AVATAR_ASSETS__', JSON.stringify(embedded));
  const size = Buffer.byteLength(fragment);
  if (size >= 1_000_000) throw new Error(definition.name + ' exceeds the inline size limit.');
  await writeFile(path.join(directory, definition.name + '.html'), fragment);
  await writeFile(path.join(visualizationDirectory, definition.name + '.html'), fragment);
  console.log(definition.name + ': ' + size + ' bytes');
}
