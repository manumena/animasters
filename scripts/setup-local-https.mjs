import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { fileURLToPath, URL } from 'node:url';
import { join } from 'node:path';
import console from 'node:console';

// Keep private keys outside public/ and out of Git. Only the public root
// certificate is copied for installation on phones and other test devices.
const certificateDirectory = fileURLToPath(
  new URL('../.certs/', import.meta.url),
);
const addresses = Object.values(networkInterfaces())
  .flat()
  .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal)
  .map((entry) => entry.address);
const names = [...new Set(['localhost', '127.0.0.1', '::1', ...addresses])];

try {
  execFileSync('mkcert', ['-version'], { stdio: 'ignore' });
} catch {
  throw new Error('Install mkcert first (on macOS: brew install mkcert).');
}

mkdirSync(certificateDirectory, { recursive: true, mode: 0o700 });
execFileSync('mkcert', ['-install'], { stdio: 'inherit' });
execFileSync(
  'mkcert',
  [
    '-cert-file',
    join(certificateDirectory, 'localhost.pem'),
    '-key-file',
    join(certificateDirectory, 'localhost-key.pem'),
    ...names,
  ],
  { stdio: 'inherit' },
);

const authorityDirectory = execFileSync('mkcert', ['-CAROOT'], {
  encoding: 'utf8',
}).trim();
const deviceCertificate = join(certificateDirectory, 'animasters-local-CA.crt');
copyFileSync(join(authorityDirectory, 'rootCA.pem'), deviceCertificate);

console.log(
  `\nInstall this public CA certificate on each test device:\n${deviceCertificate}`,
);
console.log(
  '\nStart match-generator with npm run dev:lan and animasters with yarn dev:lan.',
);
for (const address of addresses) console.log(`  https://${address}:3000`);
console.log(
  'Run yarn https:setup again if your Mac’s network address changes.',
);
