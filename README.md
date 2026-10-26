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
- React and React DOM use 19.3.1 with matching React 19 types. React Router 6 and Zustand remain in place.
- UI components use MUI 9.5.0 and its Emotion styling engine. Bootstrap, React Bootstrap, and styled-components have been removed. Shared controls in `src/components/GameControls.tsx` and the small reset in `src/styles.css` preserve the existing layout, typography, colors, and interactions. React Icons retains the existing icon artwork.

## Architecture and recovery

- [Multiplayer architecture](docs/multiplayer-architecture.md)
- [Technology review](docs/technology-review.md)

Private pre-migration archives of both repositories are stored locally in `.local-backups/2026-10-22-pre-frontend-migration/`, with checksums and restoration instructions. They include Git history and local configuration, so the entire backup directory is ignored by Git and blocked by the Vite development server. They are not included in a clone or deployment.

## Anime autocomplete

`/catalog` (linked from the home screen) uses a dedicated browser Web Worker and a compact static export under `public/catalog/`. It does not change the current manual game or submit guesses yet. The catalog downloads only when opening the catalog page; the index is reused on subsequent navigation in the same page session.

The backend owns export/curation tooling; see `match-generator/catalog/search-delivery.md`. To regenerate the files, run its read-only `catalog export` command against the intended Neon database with `--out ../animasters/public/catalog`. No database credentials belong in this frontend or its Pages build. Commit the generated assets together with their manifest when publishing an update, retaining older published versions.

`public/_headers` gives hash-named assets immutable caching and revalidates the latest manifest. The worker verifies schema version, content hash and counts before searching. Loading failures provide a Retry action. A future room can construct `CatalogClient` with its pinned version; once loaded, retries retain that version. The catalog and its index are not persisted in localStorage or IndexedDB.

The current schema-v4 catalog includes TV releases and ONA (web) releases with multiple known episodes together, excluding movie/OVA/special/unknown-only answers. Web releases with one or unknown episode count are excluded; TV counts do not affect eligibility. Eligibility is determined across all releases in a canonical group; TV and web labels do not automatically merge identities. The export contains 14,872 answers and 87,022 additional aliases.

Identified unsupported-language aliases are removed before export. English, Spanish and Japanese/romaji are retained, as are uncertain spellings; this is a conservative cleanup rather than a fully language-verified catalog. Recovery and measured savings are documented in `match-generator/catalog/alias-language-cleanup.md`.

The export removes capitalization-only duplicates, including variants of the display title. It preserves the first spelling seen by the existing worker index, so search results and ranking remain unchanged.

Search ranks exact titles/aliases first, then the catalog's popularity/editorial weight for partial matches. Current weights are 56 provisional editorial priorities; externally sourced popularity has not been populated. Results deduplicate by canonical ID, show release type/year, and preserve separate adaptations. Typing arbitrary text does not select an ID. Catalog-wide duplicate curation is ongoing; only two reviewed duplicate pairs have been redirected so far.

Run `yarn test`, `yarn lint`, `yarn build`, and `yarn catalog:benchmark` to validate. The benchmark runs the real full-catalog index in Node and checks the Nanatsu ranking regression. It is not a real-phone performance test; mobile memory, startup peak, and input-to-paint latency still need device measurements. The search implementation supports prefix, substring, and reordered-token queries, but not edit-distance typo correction.


### Reading the autocomplete code

Follow the request from the UI to the worker:

1. `src/components/AnimeAutocomplete.tsx` subscribes to loading state and debounces input.
2. `src/catalog/client.ts` owns the worker, assigns request IDs, and resolves search promises.
3. `src/catalog/catalog.worker.ts` receives messages and keeps the index off React's thread.
4. `src/catalog/load.ts` downloads and verifies the versioned asset.
5. `src/catalog/search.ts` builds the index, finds candidates, and ranks results.
6. `src/catalog/types.ts` documents the compact catalog and message contracts.

Keep related operations grouped and explain lifecycle, identity and ranking decisions in comments. The standing readability conventions are in `AGENTS.md` in both repositories.
