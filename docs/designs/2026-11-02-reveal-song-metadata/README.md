# Reveal song metadata placement

November 2, 2026. Editable [source](source.html) and browser-openable [preview](preview.html).

- **Below the title:** separate quiet metadata line. Selected by the owner and implemented; keeps long song names readable and leaves room for future artists.
- **Beside the title:** compact `Blue Bird · Opening 3`; wraps naturally but competes with a future artist credit.
- **Header badge:** type/sequence opposite the round heading. Easy to scan, but separates the metadata from its song and places two different numbers in the same row.

Owner selected **Below the title** on November 2 and requested a view in the actual reveal screen. The original alternatives remain available. These examples use the existing neutral music fallback rather than external poster artwork. There are no image dependencies or game API requests; the standalone wrapper loads its icon and positioning libraries from a CDN. The preview's Ready button only changes local presentation.

## Actual reveal screen

With the frontend Vite server running, open `/docs/designs/2026-11-02-reveal-song-metadata/actual-reveal.html`. [Editable fixture](actual-reveal.tsx) renders the production `RoomMatch`, `RoundReveal`, scoreboard, result banner and countdown with a fixed sample snapshot. It uses Blue Bird's current catalog artwork. The timer is fixed for inspection, and Ready changes only local preview state. This is a development preview, not a production route or a live match.

Verified in the browser with the poster loaded and `Opening 3` directly below `Blue Bird`. [Actual screen capture](actual-reveal.jpg).

Artist follow-up: the same production reveal now displays `Ikimonogakari` below `Blue Bird` and above `Opening 3`. Unknown credits omit the row. [Verified screen with artist](actual-reveal-with-artist.jpg); the earlier screen capture and placement alternatives remain available.

All three original alternatives and their local interactions were checked with JSDOM. Their standalone local file previews could not be opened through the browser tool. The selected layout was subsequently verified through Vite using the actual production components, as described above.

Optional design controls let reviewers omit the number or switch song type. Only server-approved sequence numbers appear in the production reveal. See the backend's `catalog/reveal-metadata-audit.md` for the audit and conservative policy.
