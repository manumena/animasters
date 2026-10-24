# Autocomplete catalog source comparison

Researched: October 23, 2026.
Updated: October 24, 2026.
Status: Manami snapshot and our own season mappings accepted for MVP. Database import and multiplayer implementation have not started. Local payload and memory measurements are recorded below.

## Accepted source decision

On October 24, the owner selected Manami's `2026-27` anime-offline-database snapshot for the MVP, with our own stable answer IDs, curated aliases and explicit season-to-answer mappings. Implement its ODbL obligations and maintain later additions ourselves. Its repository was archived on July 4, 2026; do not treat it as an automatically updating catalog. The comparison below records alternatives, not an unresolved source choice.

## Alternatives

| Source | Titles and aliases | Season/franchise relationships | Fit for this project |
| --- | --- | --- | --- |
| [Manami anime-offline-database](https://github.com/manami-project/anime-offline-database) | Main title and synonym list aggregated from multiple providers; cross-provider source URLs. | `relatedAnime` links are untyped. They identify related entries, not which ones should count as the same answer. | Ready-to-download snapshot suits local search. Archived July 4, 2026; current published snapshot is `2026-27`. Use as a bootstrap, not a live feed. |
| [AniList](https://docs.anilist.co/reference/object/media) | Romaji, English and native titles, synonyms, IDs and MAL cross-reference. | Typed relation edges distinguish prequel, sequel and other connections. | Technically useful for relationship lookup, but its [terms prohibit mass collection](https://docs.anilist.co/guide/terms-of-use). Do not build a full downloadable mirror from its API without permission for that use. |
| [MyAnimeList data via Jikan](https://github.com/jikan-me/jikan-rest/blob/master/storage/api-docs/api-docs.json) | MAL IDs and typed titles, including alternate titles. | Full records and a relations endpoint include relation labels and linked entries. | Jikan is an unofficial API over MAL, not an independent catalog owner. API access and an open-source client/server license do not establish permission to redistribute the whole dataset. Consider targeted enrichment after checking applicable terms; not the default bulk source. |
| [Kitsu](https://raw.githubusercontent.com/hummingbird-me/api-docs/openapi3/api/schemas/resources/media.yml) | Localized titles, canonical title and abbreviated/alternative names. | Its [API documentation](https://github.com/hummingbird-me/api-docs) includes media relationships. | Viable API candidate, but bulk export/redistribution permission and actual alias coverage were not established in this review. No reason yet to prefer it over a ready snapshot for MVP. |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Introduction/simple) | Multilingual labels and aliases with stable Q identifiers. | Flexible statements can represent series and related works; an anime-specific mapping must be built. | Structured data is [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Attractive for reuse; expect more extraction and coverage-validation work than with an anime-specific catalog. This is an engineering assessment, not a measured completeness comparison. |

Manami publishes the database under [ODbL 1.0 and DbCL](https://github.com/manami-project/anime-offline-database/blob/master/LICENSE). Plan attribution/license notices and the applicable share-alike/access requirements for a publicly used derived catalog. Treat this as a data-license requirement; do not infer that a software repository's license grants rights to all upstream content. This review has not audited every underlying provider agreement.

The official MAL API is another access route. Its official documentation was not retrievable in this research session, so field claims above are verified against Jikan's own published specification, and current MAL bulk-use terms remain unverified. Jikan's [own description](https://jikan.moe/?trk=public_profile__posts-text) identifies it as unofficial.

## Mapping seasons to game answers

Provider records describe releases; our IDs describe accepted answers. Keep those concepts separate:

- A provider's entries for several regular seasons can map to one internal answer ID.
- Naruto and Naruto Shippuden must map to different answer IDs, even if a provider connects them as sequels.
- Do not merge every connected franchise or every sequel edge automatically. Side stories, films, remakes and major sequels need explicit decisions.
- A `season` field such as winter/spring is an airing calendar field, not a numbered-season grouping.
- Retain provider IDs/URLs for imports and reconciliation. Use our canonical IDs for aliases, song foreign keys and submitted guesses. Never use title text or dataset array position as permanent identity.

Start by reviewing the distinct anime represented by the existing 143 songs. Preserve the broader catalog as selectable guesses, then expand curated group mappings as playable titles are added. This focuses manual answer-validation work without restricting autocomplete to songs we own. All mappings and accepted aliases for playable songs must be reviewed before release. Imports should preserve local corrections and should not reassign established IDs silently.

## Measured candidate payload

Source: [Manami release 2026-27](https://github.com/manami-project/anime-offline-database/releases/tag/2026-27), asset `anime-offline-database-minified.json`, internally dated July 4, 2026. The measurements below used a temporary research file. On October 24 the pinned snapshot was subsequently imported into Neon; the current frontend does not consume it yet.

| Measurement | Result |
| --- | ---: |
| Source asset bytes | 62,331,136 |
| Source entries | 41,537 |
| Alias strings retained | 243,194 |
| Entries without aliases | 2,019 |
| Projected JSON bytes | 10,886,092 |
| gzip level 9 bytes | 3,041,286 |
| Brotli quality 6 bytes | 2,487,503 |

Method: Node.js 24.18.0; project every source record to `{id, title, aliases}`. Use sequential numeric IDs solely for sizing. For aliases, deduplicate exact strings within each entry and remove empty strings and exact matches of the main title. Serialize with `JSON.stringify` as UTF-8, then compress with Node's gzip level 9 and Brotli quality 6. No language/content filtering, franchise grouping, normalized search keys, runtime index, license manifest or extra disambiguation fields are included. The final export will differ.

Source SHA-256: `395be786fb2f98f1fca9e963911b9332110098a080e7e2569902bbc5641d1a41`.

These measured transfer sizes support trying local search. They do not establish phone indexing time, memory consumption, typo-search quality or query latency. Local retained-memory measurements follow below; browser measurements remain necessary. Compression output here does not prove that deployed responses already use those encodings; delivery must be configured and verified.

## Retained memory experiment — October 24

Measured in Node.js `v24.18.0`, V8 `13.6.233.17-node.50`, with `--expose-gc`. This is a comparison of candidate representations on one runtime, not a measurement of the application's browser process or a guarantee for Safari/Chrome on phones.

| Retained representation | Heap delta | Typed-array storage | Combined, decimal MB |
| --- | ---: | ---: | ---: |
| Parsed `{id,title,aliases}` projection alone | 38,571,488 bytes | 0 | 38.6 |
| Parsed catalog + sorted normalized terms, numeric owners and ID map | 60,296,560 bytes | 1,138,924 bytes | 61.4 |
| Parsed catalog + `Map<normalizedName, number[]>` and ID map | 130,242,176 bytes | 0 | 130.2 |
| Sorted variant with both image URL fields retained on every record | 80,288,064 bytes | 1,138,924 bytes | 81.4 |

Method: create compact JSON projections from the source snapshot, then read each projection in a fresh Node process. Run garbage collection three times before recording a baseline and after each retained-data stage. Retain the catalog globally and release the raw input string. Measure `process.memoryUsage().heapUsed` and the `arrayBuffers` delta separately. Normalize main titles and aliases with NFKC, lowercase, trim, and collapsed whitespace; this is a benchmark normalization, not the final language-search policy.

For the map variant, group each normalized term into an array of unique owning IDs and retain an ID-to-record map: 249,985 distinct normalized names. For the sorted variant, sort `{term,id}` pairs lexicographically, retain only the resulting term array, `Uint32Array` of owning IDs, and ID map, and release the temporary pairs. This retains 284,731 title/alias occurrences. The sorted structure can support prefix lookup; it is not a completed fuzzy autocomplete engine and does not establish search latency.

The original 62 MB source dataset is not retained in these measurements. Neither representation includes a second copy in the UI thread. These figures exclude temporary construction peaks, engine/worker baseline, frontend UI, decoded audio, images and any later fuzzy-search index. JavaScript engines, pointer layout and garbage collection vary. Use approximately 80 MB as an initial engineering budget for retained local search data with the compact approach, subject to actual browser measurement; it is not an upper bound. Keep the full catalog/index in the browser worker and post only a small result list to the UI.

## Picture and thumbnail URLs

The accepted snapshot has `picture` and `thumbnail` strings on all 41,537 entries. Together their UTF-8 contents total 5,093,538 bytes (about 5.1 MB); adding both named fields to every compact JSON record adds 6,256,574 bytes before compression. These are URL-string sizes, not downloaded image sizes or total Postgres disk usage.

Both URLs are now retained in Neon on source release records, alongside provider references and the snapshot version. Pick representative artwork separately for a canonical answer that groups several seasons; retain the exact release artwork for reveal where applicable. Keep URL fields out of the browser search export initially and load only the images needed by visible UI. Do not preload the current answer's image before reveal. External image URLs can fail or change; use a placeholder. Image binaries were not copied or stored; the URL metadata import was completed on October 24.

## Deployment and cache ownership

- `match-generator`: catalog maintenance/export tooling, version manifest, and optionally cacheable delivery of the generated file. Export once per version, not for every player.
- `animasters`: a browser Web Worker module shipped in the frontend build, which loads and searches the catalog on the player's device. No additional service deployment.
- Browser HTTP cache: reusable downloaded asset, subject to eviction.
- Browser worker memory: parsed catalog/search index for the active app instance. Rebuild after reload initially; persistent storage of the built index is optional later work.

The [Web Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) runs JavaScript off the UI thread. It is unrelated to Cloudflare Workers despite sharing the name. Moving the actual search execution into the backend would give up the no-network-per-keystroke benefit.

## Implementation follow-through — October 24

The production import contains 41,537 source releases and 41,451 answer identities after grouping 153 explicitly selected releases into 67 curated answers covering the current 125 songs. The other releases remain individually selectable, including anime without songs. There are 284,576 distinct answer/alias pairs; this includes release titles and curated aliases as well as the source synonyms counted above.

Picture/thumbnail URLs are stored per release with a representative artwork reference per answer. The additive `catalog.song_anime` foreign-key table preserves the existing song API. Tests on an isolated Neon branch confirmed repeat imports preserve IDs, counts, and every original song field; the live import and API check also passed. The catalog tables and indexes occupy about 91.8 MB in Postgres, a separate measurement from browser memory. A compact export and browser search have not yet been implemented, so the prototype memory figures above must be remeasured against that implementation.
