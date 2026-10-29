# AniMasters product roadmap and ideas

Updated: October 29, 2026

This document records the owner's inspiration and future feature ideas. It is a planning backlog, not a promise that every feature ships in the next release. The [multiplayer architecture](multiplayer-architecture.md) remains the source of truth for implemented game rules.

## Delivery boundaries

| Stage | Direction | Commitment |
| --- | --- | --- |
| Iteration 1: current MVP and presentation | Private multiplayer rooms, dependable gameplay, a welcoming homepage and clearer match UI. | Multiplayer and the selected café backdrop homepage are implemented. The remaining match polish items below are proposed next work. |
| Iteration 2: identity and personalization | Mix-and-match anime avatars. Potential accounts, watched lists, public rooms and additional quiz options. | Avatars explicitly requested for iteration 2. Public rooms are tentative. Other placements are proposals pending prioritization. |
| Iteration 3: expanded gameplay | Guess anime, song title and artist; potentially a cooperative/solo roguelike experience. | Title/artist answering explicitly requested for iteration 3. A Nexus-inspired experience is exploratory. |

Features without a chosen iteration remain candidates. Recording inspiration does not change the current scoring, timers, answer rules or settings.

## Current baseline

- Guest players create or join a private room with a nickname and a four-character code; up to ten players can participate.
- Everyone connected readies up to start. Each device plays audio on the shared start schedule, with independent playback controls afterward.
- Players select an anime through autocomplete and submit one final guess or pass. Correct guesses earn N, N−1, … points in correct-answer order; wrong guesses lose one point; passes and unanswered rounds earn zero.
- The host chooses song count and openings/endings/soundtracks. The app reveals answers, keeps scores, advances rounds and supports another match in the same room.
- The homepage now exposes room entry. The catalog remains directly accessible at `/catalog` for debugging, without a homepage button.

## Iteration 1 candidates: presentation and match usability

### Homepage

Inspired by skribbl's accessible entry and instructions, AMQ's presentation of play options, and Melomatch's short introduction and animated game preview.

- A short hero description explaining that players recognize anime from music and compete with friends.
- Clear Create room and Join room actions, followed by a brief How to play section.
- Communicate existing benefits: no account required, browser play, individual devices and up to ten players.
- A small illustrative gameplay preview and restrained animation. No automatically playing audio; provide reduced-motion behavior.
- Put detailed scoring rules behind an expandable explanation.
- Explore three sketches: **Anime arcade**, **Cozy anime hangout**, and **Clean music quiz**. These are alternative visual directions, not three separate products or approved implementations.
- October 29 selection: the owner chose **Clean music quiz**, then **Café backdrop**, without the “Hide café” button. That homepage is implemented with the existing café artwork, separate Create/Join entry links and a silent illustrative round. Anime arcade felt too similar to Melomatch. Save every sketch in the [design archive](designs/README.md), retaining previous versions.
- Longer term, expose distinct play modes at entry, once those modes exist. Do not imply that future solo, public-room, community or roguelike experiences are available today.

### Enter to submit a guess

The owner likes AMQ's ability to use Enter instead of clicking Guess when autocomplete is filled.

- Enter submits the selected canonical anime through the same action as the Guess button.
- Apply the existing connection, round, deadline and single-answer checks.
- Define how selection and submission interact when the suggestions list is open. Proposed default: Enter selects a highlighted suggestion; a subsequent Enter submits the selected answer. Avoid accidental submission and respect IME composition for Japanese input.
- Keep the visible Guess button for touch users and discoverability.

### Reveal panel: artwork and song information

The owner likes AMQ's song information alongside its video. For AniMasters, use the show's image with song details beside it; stack these on narrow screens. **Video playback is out of scope for this work.**

- Show anime/season identity and song title, plus opening/ending/soundtrack type and sequence number where reliable.
- Add artist/band information when catalog coverage supports it; revealing metadata and asking players to guess it are separate features.
- Existing catalog imports already store release-level `picture` and `thumbnail` URLs. Choose artwork for the actual release where possible, with a representative image and a missing-image fallback.
- Do not deliver or preload current-answer artwork before reveal. These URLs do not belong in the compact autocomplete payload.
- Preserve the round's guesses, points and next-round readiness near the reveal.

### Playback and remaining time

Inspired by Melomatch:

- Add an animated audio-bar display while the song is playing. Decide between a decorative playback indicator and a real audio analyser; do not present decorative bars as measured audio.
- Make the remaining seconds prominent.
- Add a horizontal shrinking time bar with divisions that help estimate the remaining percentage.
- Use the authoritative server deadline and the existing browser clock estimate. The bar must reflect the first-guess deadline change and never become a separate timer that controls gameplay.
- Decide whether the percentage represents the original 90-second listening window or the active shortened window; make this transition understandable.
- Retain visible numbers, sufficient contrast and reduced-motion support rather than relying on color or animation alone.

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

## Identity and catalog personalization candidates

### Optional authentication

The owner likes Melomatch's **Google**, **Discord**, and **continue without an account** choices. Accounts are a candidate for iteration 2; authentication is not being added as part of the homepage sketch.

- Preserve guest access.
- Account benefits could include saved avatars, watched lists and the previously deferred statistics: final scores and songs played per player.
- Decide how guest progress attaches to an account and which features actually require login.

### Song selection: watched, mix or random

Inspired by AMQ's room settings:

- **Random:** the current eligible song pool, subject to room filters.
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
| Standard | Preserve today's one-guess/pass game and correct-answer-order scoring. | Keep a stable default as other modes are added. |
| Hint | Players may request hints for fewer points. | Hint content, cost, per-player visibility, limits and whether unused hints matter. |
| Quick draw | Award more points for faster correct answers, based on timing. | Formula, time origin, latency treatment and how it differs from today's order-based points. |
| Lives | A missed anime costs a life. | Starting lives; treatment of passes/timeouts/disconnections; elimination and match-end rules. |
| Battle royale | Owner noticed this in AMQ but has not established its rules. | Research first; do not assume a particular elimination format. |
| Boss fight | Owner noticed this in AMQ but has not established its rules. | Research first; determine whether a cooperative interpretation fits AniMasters. |
| Multiple choice | Offer a set of anime answers instead of typed autocomplete. | Number and quality of distractors, canonical deduplication, timing and score balance. |
| Typing | Continue the current autocomplete-based answering. | Preserve canonical IDs and multilingual aliases. |

## Entry modes and community ideas

| Entry option | Direction | Status / dependencies |
| --- | --- | --- |
| Solo | Offer a clearly labeled experience for one player from the homepage. | A one-person room works today; a dedicated solo flow and its rules still need design. |
| Multiplayer | Retain private creation/joining; optionally show active public rooms. | Public-room discovery is tentative for iteration 2. Needs visibility controls, capacity/status handling and an explicit policy for joining games already underway. |
| Community | Let users create custom quizzes and play quizzes shared by other users. | Candidate; requires quiz ownership, editing, sharing, visibility and content/reporting decisions. No iteration assigned. |
| Nexus-inspired roguelike | Explore solo or cooperative progression through a run. | Possible iteration 3, not a commitment. Research AMQ's Nexus separately; its mechanics are not specified here. |

## Iteration 3: anime, song title and artist answers

**Explicitly requested for iteration 3**, inspired by Melomatch.

- Allow guessing the anime, the song title and the band/artist.
- Define separate answer fields or categories, aliases for artists/titles, partial credit, submission limits and whether one answer locks the others.
- Audit and enrich song-title and artist metadata before relying on it for scoring.
- Decide whether the existing anime-only mode remains the default and how multi-part guessing interacts with hints, lives and timing-based scores.

## Suggested next decisions

1. Review the implemented café backdrop homepage on the deployment.
2. Prioritize Enter-to-submit, reveal artwork/details, audio bars and the larger timer independently of future game modes.
3. Confirm which account/personalization candidates join avatars in iteration 2.
4. Research AMQ's difficulty, battle royale, boss fight and Nexus before specifying comparable mechanics.
5. Define popularity ranking independently of recognition difficulty.

## Inspiration and evidence

- [skribbl](https://skribbl.io/): quick player entry, avatar customization and accessible instructions.
- [Anime Music Quiz](https://animemusicquiz.com/): owner-observed keyboard answering, reveal information, detailed room options and play modes.
- [Melomatch](https://melomatch.app/): short hero copy, gameplay preview, optional identity, playback/time visuals and multiple answer categories.
- [Existing multiplayer architecture](multiplayer-architecture.md): implemented rules, artwork import and provisional popularity metadata.

Competitor details above include the owner's observations on October 28. Unexplained mechanics are explicitly research items, not verified claims about those products.
