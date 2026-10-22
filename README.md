# AniMasters

Browser-based anime song guessing, built with React, React Router, TypeScript, and Vite. This migration preserves the existing local-player game; multiplayer is described in [the architecture document](docs/multiplayer-architecture.md).

## Requirements

- Node.js 24.18 or newer within the 24.x line (`.nvmrc` pins 24.18.0).
- Yarn 4.5.1, pinned by `packageManager` in `package.json`.

Use Yarn for dependency changes and commit `yarn.lock`. The previous npm lockfile has been removed so installs have one source of truth. `.yarnrc.yml` uses `nodeLinker: node-modules`.

```sh
nvm use
corepack enable
yarn install --immutable
yarn dev
```

The development server uses [localhost:3000](http://localhost:3000). `yarn start` is an alias for the same server.

## Commands

| Command | Purpose |
| --- | --- |
| `yarn dev` / `yarn start` | Development server with hot updates. |
| `yarn typecheck` | Check application, test, and Vite configuration types. |
| `yarn lint` | Run ESLint independently of the build. |
| `yarn test` | Run the Vitest regression suite once. |
| `yarn test:watch` | Run tests in watch mode. |
| `yarn build` | Type-check and build production assets into `dist/`. |
| `yarn preview` | Serve the production build locally. |

Tests mock match generation and verify player entry, settings, reveal/navigation, manual scoring, new rounds, and the `/pochita` route. They do not certify live backend availability or real-device audio playback.

## Cloudflare Pages

- Root directory: repository root.
- Build command: `yarn build`.
- Build output directory: **`dist`**, replacing CRA's `build` directory.
- Node.js: match `.nvmrc` (set `NODE_VERSION=24.18.0` if the dashboard overrides it).
- Use the pinned Yarn version; clear an old dependency cache if it retains CRA tooling.

`wrangler.toml` declares the Pages output directory. Update any dashboard override before the next deployment. This migration does not deploy the app or change dashboard settings.

The app still uses `BrowserRouter`, with `/` and `/pochita` routes. Cloudflare Pages provides SPA fallback when there is no top-level `404.html`; preserve that behavior so direct route visits and refreshes load the app. Vite's development and preview servers also support SPA fallback.

## Build conventions

- `index.html` lives at the repository root and loads `src/index.tsx`.
- Files in `public/` are served from `/`; imported images and CSS assets are bundled by Vite.
- Vite exposes browser configuration through `import.meta.env.VITE_*`. These values are public: do not put credentials in them. The current API and media URLs remain unchanged.
- React 18, React Router 6, Zustand, and the existing UI libraries are retained. React 19 and UI consolidation can be reviewed independently after this build-tool migration.

## Architecture and recovery

- [Multiplayer architecture](docs/multiplayer-architecture.md)
- [Technology review](docs/technology-review.md)

Private pre-migration archives of both repositories are stored locally in `.local-backups/2026-10-22-pre-frontend-migration/`, with checksums and restoration instructions. They include Git history and local configuration, so the entire backup directory is ignored by Git and blocked by the Vite development server. They are not included in a clone or deployment.
