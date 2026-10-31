# Match screen directions — October 30, 2026

Editable `source.html` and browser-openable `preview.html`. These remain the original design exploration. Live scoreboard was subsequently selected and implemented in the frontend; the backend is unchanged.

## Brief

Continue the deployed café homepage and focused lobby: dark green-blue surfaces, mint actions, the same typography and independent café background frame. Compare match layouts before implementation. Keep guessing central, preserve personal playback controls, and show answer information only after the reveal.

## Alternatives

- **Focused player:** a centered 620px column with a prominent player, answer card and players below. Closest continuation of the focused lobby. More vertical space is devoted to playback, so the answer controls are lower on phones.
- **Live scoreboard:** the player and answer cards occupy the main column while standings stay visible in a narrow right column. The ten-player limit makes this more predictable than a growing preferences editor. Below 800px the scoreboard moves beneath the game controls.
- **Answer first:** a larger answer card leads, with the timer beside the question and a compact audio player below. Scores remain last. This brings typing and submission into the first phone screen while preserving pause, replay, seek and volume controls. Recommended for the main guessing interaction.

All three use the same independent background geometry: `max(592px, 56.25cqw)` on desktop, 610px minimum below 700px and 592px below 360px; desktop position 50% 58%, mobile position 62% 50%, the existing dim overlay and 70px bottom fade. Adding players or switching match states does not resize the image. Reduced-motion mode hides the GIF, matching the app.

## Try the states

The preview starts partway through a song with 18 seconds remaining after the first answer. Type **Naru**, choose **Naruto Shippuden**, and press Enter or Submit guess. The answer locks and playback stops; after 1.8 seconds the demo simulates the other players finishing and shows the reveal. Pass follows the same flow with zero points. Choosing Naruto instead demonstrates a wrong answer and −1 point.

The optional design controls provide **Screen** (Listening, Answer submitted, Round reveal, Final standings), **Players** (4–10), whether the first answer has been submitted, and host/guest controls at match end. Controls are scoped to the selected layout. These controls compare states; they are not proposed in-game controls.

Pause/play, replay, seek, title selection, submission, pass, next-song readiness and rematch readiness are local demonstrations. Final standings include host-only next-match preferences. The prototype uses a compact select for its four song-count choices; implementation should reuse the approved preset controls rather than add a second editor design.

## Gameplay and implementation boundaries

- The timer before the first guess uses the existing 90-second cap; after the first guess it represents the final 20-second window. A pass alone does not start that window. The preview holds displayed times still for comparison.
- Player statuses show that an answer was submitted, not whether it was correct. The reveal shows guesses and point changes. The sample second correct answer earns N−1 points as the player-count control changes.
- Audio controls are personal. The spectrum is a static illustrative profile, not live analysis. No song plays and no audio permission is requested.
- The demo's delayed reveal simulates the existing server rule; no manual Reveal action is proposed.
- The artwork slot is explicitly a placeholder. Wiring artwork into the reveal would require making the image URL available to the frontend after reveal; the current room result supplies anime/song names and player results. The example metadata is presentation content, not fetched catalog data.
- Enter-to-submit is included as the previously requested interaction idea. It is not added to production by this sketch.
- Final scores are sample values. No statistics persistence, new scoring system, public rooms, avatars, authentication, extra game modes or video playback is proposed here.

## Saved and isolated

The browser preview preserves its sandboxed iframe and CSP. The café GIF loads from the same commit-pinned jsDelivr URL used by the earlier sketches. Other than presentation resources, the preview makes no network calls and never creates rooms, connects WebSockets or changes real preferences. Internet access is needed for the background and preview resources.

## Feedback

The owner selected **Live scoreboard**, asking to keep the existing colors, background and match behavior. Earlier alternatives and lobby sketches are retained unchanged.

## Production implementation

- `src/rooms/RoomMatch.tsx` arranges the player, answer controls, reveal, final standings and live scoreboard. Above 800px, scores sit in a 270px right column; at narrower widths they follow the game controls.
- `src/rooms/RoomPlayback.tsx` presents the existing device-local audio controls. `RoomGame.tsx` retains WebSocket commands, server-clock synchronization, audio scheduling, pending-answer handling and readiness logic.
- Shared `CafePage` retains the homepage's exact background size and position. Autocomplete uses a dark popup in the match without changing the standalone catalog's appearance or search behavior.
- Reveals use the server's anime title and song name, with a neutral music icon. No artwork or extra metadata is invented or sent before the reveal.
- The sketch's Enter-to-submit interaction and automatic pause on submission are not implemented: the existing Submit guess / Pass actions and playback behavior are preserved.
- Final standings handle tied scores and keep rematch readiness, host-only autosaving preferences and the guest settings summary. Audio recovery remains available during preloading and reveals.

## Validation

The original sketches were checked in all three layouts in listening, reveal and final-score states at 1024px, 390px and 320px content widths. No horizontal overflow; a ten-player roster leaves the background frame unchanged. Sketch interaction checks cover selection, Enter-to-submit, waiting, reveal, pass without starting the final timer, next-song readiness, rematch readiness and host-only preferences.

Production validation: lint, TypeScript, production build and all 71 frontend tests pass. Chrome checks cover listening, reveal, final standings and the autocomplete popup with ten players at 1440px, 1024px, 390px and 320px, with no horizontal overflow and the same computed background geometry as the homepage. A real two-browser local HTTPS match passed room creation, joining, preference changes, matching scheduled start times, autocomplete guessing, passing, reconnecting and all five rounds through final standings without browser errors. Component tests cover rematch commands, settings acknowledgement, answer privacy, local playback controls and tied scores.
