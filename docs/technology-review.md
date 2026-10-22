# Technology review: Animasters and match-generator

Date: October 21, 2026
Status: Original recommendations from October 21; see the October 22 implementation update below.
Related: [Multiplayer architecture and gameplay decisions](multiplayer-architecture.md).

## October 22 implementation update

The owner selected Vite + React Router while preserving the current UI and behavior. The frontend now uses Vite, TypeScript 6.0, standalone ESLint, and Vitest with React Testing Library. React 18, React Router 6, and the existing UI libraries are retained for this first migration. Yarn remains the package manager, with one lockfile. Cloudflare Pages output changes to `dist/`; no deployment has been performed. Both repositories were backed up before source changes. The backend and the other recommendations below remain unchanged.

## Recommendation

Keep React, TypeScript, Cloudflare Pages, Cloudflare Workers, the existing Postgres database, and Supabase Storage. Modernize build tooling and consolidate the UI before implementing multiplayer. Add Hono for the HTTP API, native Durable Objects for rooms, and runtime validation for requests and WebSocket messages.

The multiplayer requirements do not require a change of frontend language, database provider, or hosting platform. The changes below address concrete maintenance and implementation needs. Exact versions should be selected and pinned as a compatible set during migration rather than independently installing every package's latest version.

## Current repository findings

Versions below are declared package ranges, not proof of the versions installed or running in production.

| Area | Observed configuration | Proposed direction |
| --- | --- | --- |
| Frontend build | Create React App through `react-scripts` 5.0.1 | Replace with Vite. |
| React | React/React DOM `^18.2.0`; entry point still uses `ReactDOM.render` | Move to the current stable React 19 line with matching types, following the upgrade guide; use `createRoot`. |
| TypeScript | Frontend `^4.9.5`; backend `^5.0.4` | Select a supported stable version compatible with the new tooling; keep strict checking. |
| Routing | React Router `^6.10.0` and a Zustand view enum | Keep React Router, update deliberately, and make room links navigable routes. Keep transient game phase in server snapshots. |
| Client state | Zustand `^5.0.6` | Keep Zustand for room snapshots and UI state. |
| UI | MUI `^6.1.5`, React Bootstrap, Bootstrap, Emotion, styled-components | Consolidate on an updated MUI and its default Emotion styling stack. |
| Worker routing | `@tsndr/cloudflare-worker-router` `^2.3.2` | Replace the small routing layer with Hono. |
| Worker tooling | Wrangler `^3.80.4`, compatibility date `2023-04-08`, `wrangler publish` | Update Wrangler, use `wrangler deploy`, and advance the compatibility date after checking changes. |
| Worker types | `@cloudflare/workers-types` `^4.20230404.0` | Generate bindings/runtime types with current Wrangler tooling. |
| Database access | `@neondatabase/serverless` `^0.10.1` | Keep the existing connection approach initially; review driver migration separately before upgrading it. No database move is implied. |
| Tests | CRA/Jest frontend setup; backend Vitest `^0.30.1` | Frontend Vitest + React Testing Library; backend a Vitest version supported by Cloudflare's Workers integration; Playwright for multi-client flows. |
| Package management | Frontend declares Yarn 4.5.1 but contains both Yarn and npm lockfiles | Choose one package manager for both repos and use one authoritative lockfile per repo. |

## Frontend: modernize the existing React app

### Vite

This is the highest-priority tooling replacement. React has deprecated Create React App and documents migration to modern frameworks or build tools including Vite. A Vite-powered client app fits this game: interactive room state comes from the backend, and the frontend can remain static assets on Pages. [React announcement](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)

Migration includes the HTML entry point, scripts, environment variables, asset handling, test configuration, and Pages output directory (`build` today; typically `dist` with Vite). Pin a supported Node.js release consistently for local development and deployment, checking the selected Vite version's requirements. [Vite guide](https://vite.dev/guide/)

### React and UI

React's current documentation identifies the 19.x line. The entry point must move away from `ReactDOM.render`, and React DOM, types, and component dependencies must be upgraded together. The official guide recommends an intermediate React 18.3 upgrade to surface deprecation warnings. [React versions](https://react.dev/versions), [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

MUI is the recommended UI system because it is already configured in the app and includes an autocomplete component suitable for keyboard and touch interaction. Consolidating the existing Bootstrap buttons/forms and styled-components usage reduces theme inconsistency and overlapping styling dependencies. Check actual imports before removing packages, including the separate `mui` package. [MUI autocomplete](https://mui.com/material-ui/react-autocomplete/)

Tailwind with a headless component system is a reasonable alternative if a visual redesign is desired, but it would be a separate design-system migration. There is no need to replace the UI system merely to add multiplayer.

### Framework scope

A Next.js migration is not required by the agreed game architecture. Its server rendering and full-stack conventions would need a concrete product reason, since the room backend is already Workers and Durable Objects. React Router framework mode is also an option if route-based loading and rendering become valuable. The initial recommendation is the smaller Vite + React Router change.

## Backend: Workers + Hono + Durable Objects

Use Hono for HTTP routing, middleware, room creation/join requests, catalog search, and routing WebSocket upgrades. It has documented Workers support and typed bindings. The room's Durable Object remains responsible for authoritative rules, persistence, deadlines, and its hibernating WebSocket connections. An HTTP router does not replace the room coordinator. [Hono on Workers](https://hono.dev/docs/getting-started/cloudflare-workers)

Add runtime schemas, such as Zod, for HTTP requests and WebSocket messages. TypeScript types disappear at runtime and cannot validate an incoming player's message. Hono documents validation integrations; WebSocket handlers must explicitly apply their own schemas too. [Hono validation](https://hono.dev/docs/guides/validation)

Use native WebSockets initially. Socket.IO or another realtime service is not necessary for the proposed room protocol. Implement reconnect, snapshot recovery, action IDs, and protocol versioning explicitly.

Update the Wrangler deployment command and runtime configuration as a separate step from adding game features. Advancing the compatibility date changes runtime behavior and should be verified, not treated as an arbitrary version-label edit. [Wrangler migration guide](https://developers.cloudflare.com/workers/wrangler/migration/update-v3-to-v4/)

Keep domain rules in plain TypeScript functions where practical: submission validation, correct-answer ranking, deadline calculation, and phase transitions. The Durable Object adapts those rules to connections, durable storage, and alarms. This makes the rules easier to test without introducing another application framework.

## Search and catalog growth

The reported 143 songs do not require a separate search platform. The more relevant numbers are distinct anime identities, aliases, and payload size. A much larger audio catalog can still have a compact title index.

Given the intended growth, propose a Worker search endpoint backed by the existing Postgres catalog. The browser debounces input, ignores stale results, and caches repeated queries. Keep search separate from room WebSocket traffic so typing does not repeatedly wake the room coordinator. Account for search network latency because earlier submissions score more points.

Autocomplete must use the full configured answer catalog, not only selected match answers. At minimum, every selectable song must map to an available answer identity. Including anime without playable songs is a separate catalog-content choice, not a requirement for the search technology.

## Existing code issues to include in migration planning

These are source observations, not fixes performed during this review:

- `animasters/src/index.tsx` uses the legacy React rendering API.
- `animasters/src/api/fetch.ts` omits false filter values, which can allow backend defaults to re-enable excluded song types. It also lacks explicit response/error handling.
- `match-generator/src/logic/generate-match.ts` logs the entire environment object, which can expose credentials in logs. Replace this with selected non-secret diagnostic fields.
- Backend configuration sets `DEFAULT_INCLUDE_SOUNDTRACK`, while the code reads `DEFAULT_INCLUDE_SOUNDTRACKS`.
- The current API returns song answers and paths for the full match. The new multiplayer protocol must keep that information server-side until reveal.
- The frontend's Supabase URLs include descriptive media paths. Opaque filenames and metadata review are needed to avoid revealing answers through media references.
- The current wildcard CORS configuration is not player authorization. New HTTP and WebSocket entry points need explicit session and room-access validation.

## Repo and contract organization

Keep the two repos initially. Agree on a versioned protocol for room snapshots, commands, and events, with matching runtime schemas. A small versioned shared package is an option when the protocol is introduced; a monorepo is not required to modernize either app. Do not rely on developer-machine sibling paths as a deployment dependency.

For package management, retain Yarn in the frontend unless there is a reason to change it, and align the backend if accepted. Resolve which lockfile is authoritative from the deployment workflow before removing either existing lockfile.

## Migration order and validation

1. Choose the target toolchain and package manager; record a baseline production build and current playback behavior.
2. Migrate the frontend build to Vite while preserving existing behavior and Pages hosting.
3. Upgrade React and compatible UI dependencies, update the entry point, and consolidate UI components.
4. Update backend tooling and routing, fix the observed configuration/error-handling issues, and verify existing song selection.
5. Add the agreed room protocol and gameplay in incremental steps from the architecture document.

Use focused unit tests for ranking, the 90-second/20-second deadline rule, duplicate submissions, and phase transitions. Exercise persistence and alarms through Cloudflare's Workers Vitest integration, selecting compatible package versions together. [Cloudflare testing](https://developers.cloudflare.com/workers/testing/vitest-integration/)

Use separate Playwright browser contexts to simulate several players in one room and verify joins, readiness, simultaneous submissions, reconnects, and reveal. Also verify audio behavior on real mobile devices, since a desktop automated run cannot establish that autoplay and device audio work everywhere. [Playwright browser contexts](https://playwright.dev/docs/browser-contexts)

The October 21 review itself made no application changes. The October 22 frontend implementation is recorded above; no database changes or deployments have been performed.
