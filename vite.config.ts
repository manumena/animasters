import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ command, mode }) => {
  const lan = command === 'serve' && mode === 'lan';

  // LAN clients use their own page origin for HTTP and WebSocket requests.
  // The proxy keeps Wrangler private on localhost and avoids mixed content.
  const https = lan
    ? {
        cert: readFileSync(new URL('./.certs/localhost.pem', import.meta.url)),
        key: readFileSync(
          new URL('./.certs/localhost-key.pem', import.meta.url),
        ),
      }
    : undefined;

  return {
    plugins: [react()],
    define: lan
      ? { 'import.meta.env.VITE_API_URL': JSON.stringify('/api') }
      : {},
    server: {
      port: 3000,
      host: lan ? '0.0.0.0' : undefined,
      strictPort: lan,
      https,
      proxy: lan
        ? {
            '^/api/rooms(?:[/?]|$)': {
              target: 'http://127.0.0.1:8787',
              changeOrigin: true,
              ws: true,
              // Preserve the browser Origin: the backend validates LAN origins too.
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
      fs: {
        // Preserve Vite's default exclusions and keep private recovery archives offline.
        deny: [
          '.env',
          '.env.*',
          '*.{crt,pem,key,p12,pfx,cer,der}',
          '.npmrc',
          '.yarnrc.yml',
          '**/.git/**',
          '**/.local-backups/**',
          '**/.certs/**',
        ],
      },
      watch: {
        ignored: ['**/.local-backups/**', '**/.certs/**'],
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      clearMocks: true,
      restoreMocks: true,
    },
  };
});
