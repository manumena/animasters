# Lobby and match preferences — October 29, 2026

Four design alternatives, not production changes. Saved after pushing Quick entry in commit `4660be8`.

- `source.html`: editable source for all four variants.
- `preview.html`: browser-openable carousel with local settings, readiness and invitation interactions.

## Variants

| Variant | Preferences | Tradeoff |
| --- | --- | --- |
| Side by side | Always visible beside players; stacks underneath on phones | Recommended for today's small set of options. Everyone can see the setup immediately. Longer on mobile. |
| One room card | Embedded below players in one continuous panel; compact controls | Cohesive and simple, but settings push the Ready action lower. |
| Focused lobby | A summary and settings button open a dedicated screen | Clear, narrow layout and easy to expand later. Changing settings takes another step. |
| Lobby overview | Players and match summary sit side by side; settings button opens a dedicated screen | Keeps the lobby focused on friends and readiness while supporting more options later. Preferred dedicated-screen alternative. |

The two dedicated alternatives intentionally use the same settings screen to isolate the difference in lobby layout. Back and Cancel discard unsaved edits; Save returns to the lobby and updates its summary. Those navigation choices are proposals, since a separate editor does not exist in the current app.

## Preserved product contract

- Shareable four-character uppercase alphanumeric room code, with a visible invite action.
- Up to ten players; initials are simple identity placeholders, not the deferred anime avatar editor.
- Only the host edits preferences. The design-controls panel can switch to the read-only guest view.
- Existing options only: songs per match (1–999), openings, endings, soundtracks; no types checked means all types. No repeated anime remains fixed.
- Saving clears everyone's Ready status; unsaved host edits block Ready; a ready host must choose Not ready before editing.
- Enable audio & Ready remains the action. Everyone connected becoming ready starts the match; there is no host-only Start button.
- A real implementation must retain loading, reconnection, catalog/audio failures, server acknowledgement, settings revision checks and disconnected player handling. The sketches depict a healthy connected state and simulate local saves only.

The four players, code A7B2 and 40-song selection are illustrative data, not a live room or a fetched server configuration. Invitation expansion exposes an example link; it does not create a room or copy anything to the clipboard. Ready never starts media or a match. No API calls are made.

## Visual continuity

Use the implemented `CafePage` palette, brand, dark panels, mint primary actions, rounded corners and subtle borders. The image is the original 1920×1080 café GIF, pinned to commit `4856ebff01ecec6fefe23093c02f0f043c65c0f8` on jsDelivr. Previews need internet access for that image and presentation resources.

Backdrop height is independent of lobby, settings and player-list height: max(592px, width × 9/16), with a 610px minimum at widths up to 700px and 592px at widths up to 360px. Position is 50% 58% on desktop and 62% 50% on phones, with the same dimming overlay and bottom fade as the homepage. A future implementation should reuse `CafePage`, not copy these preview styles into the app. Reduced motion hides the animated image, as on the homepage.

## Feedback

Owner requested embedded preferences and dedicated-button/screen alternatives, the existing colors and café backdrop, and an archive of every sketch. On October 30, the owner selected Focused lobby because settings may grow over time and Side by side feels unbalanced. Requested players last and alternatives for Ready near/inside the room-code card; see the next dated exploration. The lobby has not been implemented yet.

## Validation

Browser-checked all four variants at 1024, 390 and 320px widths, with no horizontal overflow or script errors. Exercised saving, summary updates, clearing Ready states, Ready/Not ready, dedicated-screen cancellation, invalid song counts and the ready-host editing lock. The scene reserves a common responsive height so the comparison controls stay in place. Guest mode is available through the optional design-control helper; the standalone preview defaults to the host.
