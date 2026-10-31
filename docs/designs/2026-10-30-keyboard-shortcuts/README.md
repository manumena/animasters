# Keyboard shortcuts — October 30, 2026

Editable source: `source.html`. Browser-openable preview: `preview.html`. The sketch is retained as a design reference; the selected Button keycaps direction is now implemented in production code. Open the preview and switch variants; use **Preview phase** to see both Ready and Submit guess. Click inside the preview before trying the keyboard.

## Alternatives

- **Button keycaps:** put Enter / Space inside Ready, and Enter inside Submit guess. Strongest association with the action and the recommended direction. Takes more horizontal space; the action wraps beneath the countdown when needed.
- **Below-button hints:** keep the existing button label, with “Press Enter or Space” below Ready and “Press Enter” below Submit guess. More explanatory and keeps the buttons compact, at the cost of a second line.
- **Shortcut bar:** move the keyboard guidance to a divider below the action area. Keeps the buttons unchanged, but the shortcut is farther from its action and adds a row to the card.

The preview retains the match's typography, rounded panels, mint actions and scoreboard. It crops out audio controls and the café artwork to focus on the changed controls. Sample song, player scores and frozen timers are illustrative. No backend, audio or external resource requests are made by the fragment.

## Proposed behavior

- During the next-song reveal/countdown, Enter or Space marks the player ready once. It does not toggle the player back to unready. Remove shortcut hints after readiness; show the waiting status.
- During guessing, Enter selects a suggestion first; a separate Enter submits the selected answer. This already exists in the production autocomplete. The preview uses one fixed suggestion to demonstrate that sequence, not a real catalog search.
- Space continues to insert spaces in the anime input. It is not a global Submit shortcut. A focused native button retains ordinary Enter/Space activation.
- Do not intercept keys used by other controls or editable fields. Ignore held keys, composition and modifier combinations. Future production handling should also respect consumed/default-prevented events and phase transitions.
- Hints appear when the associated shortcut can act. Production should omit keyboard-only hints on touch-only devices while keeping the action available and accessible. Touch/keyboard device detection is not implemented in this sketch.
- The preview offers Guessing and Reveal only. Lobby readiness and next-match readiness are outside this exploration.

## Feedback

Requested: next-song Ready using Enter or Space, and discoverable keyboard hints for both Ready and Submit guess. Owner loved **Button keycaps** and requested a spacebar symbol to match Enter’s arrow. Updated the Space keycap to “Space ␣”; keyboard behavior is unchanged. Owner then approved implementation. Implemented Enter/Space readiness during next-song countdowns and Enter hints for the existing select-then-submit guess behavior. Native controls, editable fields, held keys and composition retain their expected behavior; disabled actions omit the keycaps.

## Verification

Checked all three variants with jsdom: Enter and Space readiness, repeat suppression, isolation of hidden variants, disabled submit before selection, two separate Enter presses for selection/submission, and no Space submission from the input. Standalone preview generated with the Visualize renderer. Layout uses wrapping controls and a single-column breakpoint at 700px. Browser screenshot verification was unavailable because the browser tool blocks local file URLs; layout has not been visually verified in that tool.

## Lobby follow-up — October 31, 2026

At the owner’s request, extended the same Button keycaps and Enter/Space readiness to the lobby for hosts and guests. Lobby and match share the keycaps and guarded shortcut handling. The lobby shortcut only marks ready; it does not toggle back to unready, run in preferences, or bypass disabled/pending readiness. The earlier sketch remains unchanged.
