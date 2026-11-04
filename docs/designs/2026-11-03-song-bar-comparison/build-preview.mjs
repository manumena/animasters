/* global URL, console */

import { readFile, writeFile } from 'node:fs/promises';

const directory = new URL('./', import.meta.url);
const read = name => readFile(new URL(name, directory), 'utf8');

// Keep the editable modules small, but make preview.html work from a local file
// without a module server. The worker is bundled into a private Blob URL.
const analysis = (await read('audio-analysis.mjs')).replaceAll('export ', '');
const worker = (await read('analysis-worker.mjs')).replace(/^import .*;\n/m, '');
const workerSource = analysis + '\n' + worker;
const comparison = (await read('comparison.mjs'))
  .replace(/^import \{[\s\S]*?\} from '\.\/audio-analysis\.mjs';\n/m, '')
  .replace(
    "new URL('./analysis-worker.mjs', import.meta.url)",
    `URL.createObjectURL(new Blob([${JSON.stringify(workerSource)}], { type: 'text/javascript' }))`,
  );

const script = analysis + '\n' + comparison;
const source = await read('source.html');
const preview = source.replace(
  '<script type="module" src="./comparison.mjs"></script>',
  `<script type="module">\n${script.replaceAll('</script', '<\\/script')}\n</script>`,
);

await writeFile(new URL('preview.html', directory), preview);
console.log('Updated the standalone audio comparison preview.');
