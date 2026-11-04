# AniMasters product roadmap

Updated: November 3, 2026

## What’s left to do

Only unfinished work is listed here; details and open decisions follow. Requested work and exploratory candidates retain their existing priority. The two November 2 additions have no iteration assigned yet.

### Remaining presentation work (iteration 1)

- Animate the match playback bars, with clear playback state and reduced-motion support.

### Requested for iteration 2

- Investigate and fix the reported Ranma 1/2 behavior once reproduction steps are identified.
- Improve loudness consistency for quiet songs.
- Let the final song’s reveal countdown finish before showing final standings.
- Build mix-and-match anime avatars for lobby, results and standings.
- Define and add analytics for product usage, player statistics or both.

### Newly requested (iteration to be decided)

- Support Spanish alongside English, with a visible language selector and a location-based initial language.
- Create a completed-match log so players can review the match after it finishes.

### Requested for iteration 3

- Add configurable guessing for song title, band/artist and anime season alongside anime answers.
- Extend artwork coverage from playable songs to the full answer catalog.

### Candidates and open questions

- Evaluate typo-tolerant autocomplete, such as “Nerrto” suggesting “Naruto”.
- Decide optional accounts and how guest progress carries into them.
- Add watched-list and mixed song selection after defining identity and sampling rules.
- Choose a popularity source before adding Top 100/500/1,000/2,000/all filters.
- Define five song-difficulty levels and the recognition data needed to support them.
- Evaluate hints, quick draw, lives, battle royale, boss fight and multiple-choice rules.
- Design a dedicated solo flow and consider public-room discovery (tentatively iteration 2).
- Explore community quizzes and a Nexus-inspired solo/cooperative roguelike (possibly iteration 3).
- Expose additional homepage play modes as those experiences become available.

## Delivery boundaries

This is a planning backlog, not a promise that every idea ships in the next release. The [multiplayer architecture](multiplayer-architecture.md) records game rules and technical decisions; current source takes precedence where older descriptions differ.

| Stage | Direction | Status |
| --- | --- | --- |
| Iteration 1 | Remaining match presentation work. | Reveal metadata and playback animation. |
| Iteration 2 | Gameplay fixes, anime avatars and analytics; possible identity/personalization. | Explicit requests remain as listed above. Typo tolerance is an open question; public rooms are tentative; other candidates need prioritization. |
| Iteration 3 | Configurable anime/title/artist/season guessing and wider artwork coverage. | Requested; a Nexus-inspired experience remains exploratory. |
| Unassigned | Spanish interface and completed-match logs. | Requested November 2; iteration and detailed scope still to be chosen. |

Recording inspiration does not change scoring, timers, answer rules or settings.

## Remaining presentation details (iteration 1)

### Reveal metadata

- Display season identity where reliable.
- Song type and sequence number are implemented locally: type for all valid records; numbering only for positive, unique slots on single-release answers (76 of 125 songs in the November 2 audit). Ambiguous numbers are omitted. Deployment is pending; placement alternatives are in [the design archive](designs/2026-11-02-reveal-song-metadata/README.md).
- [x] Artist metadata and reveal display: the owner manually resolved all 12 previously uncertain artist credits on November 3. Credits appear below the song title and stay hidden until reveal. Application deployment has not been confirmed; guessing artists remains a separate feature.

### Playback bars

- [x] Implemented locally: real live frequency analysis of the playing song, with centered rounded bars, 60 ms falling time and 0 dB visual sensitivity, selected November 3 from the [interactive comparison](designs/2026-11-03-song-bar-comparison/README.md). Application deployment has not been confirmed.
- [x] Bars settle when playback stops and remain static for reduced-motion users. Hidden/offscreen views suspend visual updates. Analysis follows actual source scheduling through preloads and round transitions and stays independent of listening volume.

## Iteration 2: remaining gameplay fixes and autocomplete decisions

Requested November 1.

- **Ranma 1/2:** investigate the reported incorrect behavior; the exact failure and reproduction steps still need to be identified.
- **Quiet songs:** investigate low playback volume and improve loudness consistency.
- **Final-round reveal timing:** show the final song’s results and let its countdown finish before displaying final standings. The backend currently enters `completed` immediately after the final round; the frontend shows standings in that phase.
- **Typo tolerance (open question):** evaluate likely-match suggestions for mistyped characters, such as “Nerrto” → “Naruto”, and decide how forgiving matching should be. Current search supports prefixes, substrings and reordered tokens, without edit-distance correction.

## Newly requested: Spanish interface

Requested November 2; no iteration assigned.

- Support English and Spanish throughout the player interface, including entry, lobby, preferences, gameplay, results, instructions and errors.
- Display a language selector so players can choose explicitly and change language later.
- Select the initial language based on location; define the location signal and fallback when it is unavailable or ambiguous.
- Preserve an explicit language choice so automatic selection does not override it. Browser-language fallback is a proposal to confirm during implementation.
- Keep canonical answer IDs and existing multilingual aliases independent of interface language.

## Newly requested: completed-match log

Requested November 2; no iteration assigned. Create a log when a match finishes and make it available for review afterward.

Proposed contents and decisions to settle:

- Record the songs/anime played in order, player guesses, round points and final scores/standings.
- Give each completed match its own identity so rematches do not overwrite earlier logs.
- Decide where players open the log, who may access it, whether it survives room expiry and how long it is retained.
- Decide guest access and whether export or account-linked history is needed; accounts are not an established prerequisite.
- Coordinate storage with analytics while keeping the player-facing match log an explicit deliverable.

Today the room retains final scores and only the latest reveal, expires thirty minutes after completion, and clears previous scores/results on a successful rematch. That temporary state does not fulfill this request; full round history is not currently retained.

## Iteration 2: anime avatar builder

**Explicitly requested for iteration 2.** Borrow skribbl's quick nickname/avatar setup, adapted to combinations of recognizable anime props.

Desired customization includes colors, hair, eyes, mouth and accessories. Owner-provided examples:

- Goku-style or Naruto-style hair.
- A ninja bandana/headband.
- “Okarin glasses” as an eyewear reference; confirm the intended visual before drawing assets.
- Sharingan-inspired eyes.
- Mix parts from different shows into one player-created avatar.

Proposed implementation direction:

- A layered asset system with compatible slots, palette choices and immediate preview.
- Store selected part IDs and colors as a compact avatar configuration, rather than a rendered image for every combination.
- Show the same avatar in the lobby, round results and final standings.
- Keep editing quick with previous/next or randomize controls; a nickname and guest play remain accessible.
- Decide guest persistence versus account-linked avatars, which slots can coexist, and how parts remain recognizable at small mobile sizes.

## Iteration 2: analytics

**Explicitly requested for iteration 2.** Add some form of analytics; the audience, metrics and presentation are still to be defined.

- Decide whether analytics should cover product usage, gameplay/player statistics, or both.
- Final scores and songs played per player are possible starting points; coordinate with the completed-match log.
- Define the data to collect, persistence and any identity requirements once the scope is chosen.

## Identity and catalog personalization candidates

### Optional authentication

The owner likes Melomatch's **Google**, **Discord**, and **continue without an account** choices. Accounts are a candidate for iteration 2; authentication is not being added as part of the homepage sketch.

- Preserve guest access.
- Account benefits could include saved avatars, watched lists and the previously deferred statistics: final scores and songs played per player.
- Decide how guest progress attaches to an account and which features actually require login.

### Song selection: watched or mix

Inspired by AMQ's room settings:
- **Watched:** use participants' watched-anime lists.
- **Mix:** combine watched-list selections with the broader eligible pool.

Dependencies and open rules:

- Persistent user identity and a way to enter/import watched shows before the match.
- Reconcile external show IDs with our canonical answers and season mappings.
- Decide whose lists count: host, union of participants, intersection or balanced per-player sampling.
- Define the mix ratio, behavior for guests without lists and what happens when too few eligible songs remain.
- Preserve random play without requiring accounts or list setup.

### Anime popularity filter

Requested choices inspired by AMQ: **Top 100, 500, 1,000, 2,000, or all**.

Current state: autocomplete already supports popularity/editorial ordering. The architecture records 56 initial provisional editorial prominence weights, with neutral weights for other titles. These are not a complete measured popularity ranking and do not establish a defensible Top 100/500 list.

Before implementing this filter, choose the popularity source, normalization, refresh schedule, treatment of missing ranks and canonical-season aggregation. Define whether “Top X” means the top of the overall anime catalog or the top among currently playable shows. Do not treat popularity as song difficulty or infer popularity from song availability.

### Song difficulty

The owner observed five AMQ levels from beginner to expert. **AMQ's actual difficulty calculation has not been verified.**

Candidate approaches for AniMasters:

- Curated song-level difficulty to bootstrap the feature.
- Observed correct-answer rate once there are enough real rounds.
- A hybrid that accounts for sample size and separates watched-list games, hints and multiple-choice games from ordinary typed answers.

Difficulty should measure recognition of a particular song, not simply how famous the anime is. Define five level thresholds, cold-start behavior and the data needed before committing to a formula.

## Additional room rules and game modes

These are ideas to evaluate; no delivery iteration or scoring change is approved yet.

| Option | Desired behavior or inspiration | Open decisions |
| --- | --- | --- |
| Hint | Players may request hints for fewer points. | Hint content, cost, per-player visibility, limits and whether unused hints matter. |
| Quick draw | Award more points for faster correct answers, based on timing. | Formula, time origin, latency treatment and how it differs from today's order-based points. |
| Lives | A missed anime costs a life. | Starting lives; treatment of passes/timeouts/disconnections; elimination and match-end rules. |
| Battle royale | Owner noticed this in AMQ but has not established its rules. | Research first; do not assume a particular elimination format. |
| Boss fight | Owner noticed this in AMQ but has not established its rules. | Research first; determine whether a cooperative interpretation fits AniMasters. |
| Multiple choice | Offer a set of anime answers instead of typed autocomplete. | Number and quality of distractors, canonical deduplication, timing and score balance. |

## Entry modes and community ideas

| Entry option | Direction | Status / dependencies |
| --- | --- | --- |
| Solo | Offer a clearly labeled experience for one player from the homepage. | A one-person room works today; a dedicated solo flow and its rules still need design. |
| Public rooms | Show active public rooms. | Tentative for iteration 2. Needs visibility controls, capacity/status handling and an explicit policy for joining games already underway. |
| Community | Let users create custom quizzes and play quizzes shared by other users. | Candidate; requires quiz ownership, editing, sharing, visibility and content/reporting decisions. No iteration assigned. |
| Nexus-inspired roguelike | Explore solo or cooperative progression through a run. | Possible iteration 3, not a commitment. Research AMQ's Nexus separately; its mechanics are not specified here. |

## Iteration 3: configurable anime, song title, artist and season answers

**Explicitly requested for iteration 3**, inspired by Melomatch.

- Add configurable room options to let players guess by song name or band/artist, alongside anime guessing.
- Add an option to guess which anime season the song belongs to; define accepted season names/aliases and how season answers relate to canonical anime/release mappings.
- Define separate answer fields or categories, aliases for artists/titles, partial credit, submission limits and whether one answer locks the others.
- Audit and enrich song-title and artist metadata before relying on it for scoring.
- Extend stored anime artwork beyond the songs table to the full answer catalog.
- Decide whether the existing anime-only mode remains the default and how multi-part guessing interacts with hints, lives and timing-based scores.

## Suggested next decisions

1. Prioritize the remaining presentation work and iteration 2 fixes.
2. Choose an iteration for Spanish support and completed-match logs, and define log retention and access.
3. Define analytics scope and which account/personalization candidates join avatars in iteration 2.
4. Research difficulty, battle royale, boss fight and Nexus before specifying comparable mechanics.
5. Choose a popularity source independently of recognition difficulty.

## Inspiration and evidence

- [skribbl](https://skribbl.io/): quick player entry, avatar customization and accessible instructions.
- [Anime Music Quiz](https://animemusicquiz.com/): owner-observed keyboard answering, reveal information, detailed room options and play modes.
- [Melomatch](https://melomatch.app/): short hero copy, gameplay preview, optional identity, playback/time visuals and multiple answer categories.
- [Existing multiplayer architecture](multiplayer-architecture.md): implemented rules, artwork import and provisional popularity metadata.

Competitor details above include the owner's observations on October 28. Unexplained mechanics are explicitly research items, not verified claims about those products.
