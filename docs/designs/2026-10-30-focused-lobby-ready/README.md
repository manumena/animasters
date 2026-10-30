# Focused lobby: Ready placement — October 30, 2026

Editable `source.html` and browser-openable `preview.html`. These are new sketches, not production changes. Earlier lobby alternatives remain in their original folder.

## Accepted direction

The owner prefers **Focused lobby** because match preferences may become extensive. Side by side feels unbalanced. Keep a dedicated settings screen, move the players list last so its changing size cannot move the important controls, and place Ready near or inside the room-code card.

## Alternatives

- **Inside the card — recommended:** code and invitation sharing at the top; a divider separates the readiness count and full-width mint Ready button. Gives the lobby one clear primary action and works consistently on phones.
- **Beside the code:** code/sharing on the left and readiness on the right within one card. More compact on desktop. On phones, Ready follows the code and Invite friends follows Ready, giving the game action greater priority.
- **Separate action strip:** retain a card dedicated to code/invitation sharing and place a separate Ready strip immediately below it. Clear distinction between sharing and personal readiness, at the cost of another panel.

All variants order the main content as room code + Ready, match summary + preferences button, then players. Local feedback is above the summary rather than below the growing list. The dedicated editor hides Ready while editing, retains the room code, and keeps the existing Save/Cancel behavior from the previous sketches. Saving clears everyone's Ready status; ready hosts must return and choose Not ready before editing. No real room, network call, audio playback or production setting is changed.

## Interactive comparison

Try Ready/Not ready, open Match preferences, change the song count or song types, then save or cancel. The optional design controls include host/guest view and a four-to-ten player-count slider. Player growth only extends the last panel; the code card, Ready area, summary and background do not move.

The café artwork, fixed dark palette, dimming, fade and responsive positioning match the shared `CafePage` geometry. The GIF is reused through the same pinned jsDelivr URL as earlier sketches. Internet access is required for presentation resources. Reduced-motion preferences hide the animated image.

## Feedback

Owner selected Inside the card and then requested these refinements: remove the room-code card from preferences, remove Save/Cancel, save settings automatically, label the host action “Ready to start” and guest action “Ready”. Both become “Not ready” after acknowledgement. The original sketches above remain archived as reviewed; implementation incorporates these later refinements.

## Checks

Verified all three layouts at 1024, 390 and 320px browser widths: no horizontal overflow, Ready above settings, settings above players, and no movement of the upper controls when six extra player rows are added. Verified Ready counts, dedicated-editor navigation, hidden Ready during editing, settings saves and readiness reset. No browser script errors.

## Implementation

- `src/rooms/RoomLobby.tsx` and `RoomLobby.css` implement the selected layout with the shared `CafePage` background. Only connected players count toward readiness; disconnected places remain in the final player list.
- `RoomPreferences.tsx` is the dedicated editor. Its controller stays in `RoomGame`, preserving changes and in-flight saves when returning to the lobby. Guests see the next-match summary; the preferences button is host-only.
- `preferences.ts` sends toggles immediately when no prior change is pending and waits 450ms after count typing. Invalid numbers remain local. Saves are serialized using the server settings revision; only a matching snapshot confirms the save and releases the Ready button. An unconfirmed change gets an explicit retry state, and reconnects reconcile a fresh snapshot before resending. Other-tab changes are adopted rather than silently overwritten.
- Existing audio activation still runs directly from Ready clicks. Existing match generation, scoring and playback behavior remain unchanged. Rematch preferences use the same autosave controller while retaining the existing final-standings layout and “Ready for next match” action.
- Validated the build, lint and 67 tests, including debounce, invalid input, queued changes, acknowledgement timing, reconnect outcomes, conflicts, retries, editor navigation and host/guest actions. Browser checks with a simulated room connection covered 1440, 390 and 320px layouts and confirmed the background matches the homepage. This check did not create deployed rooms or play songs.

## Follow-up refinements

The owner requested 5 / 10 / 20 / 50 song presets, larger padded checkboxes, removal of the Saved/Saving label and autosave legend, and Back to room entry above the invitation card. These are implemented without changing the café background. Presets save immediately; existing rooms with non-preset counts retain their value until edited. New rooms default to 10 songs. Errors and acknowledgement-based Ready blocking remain. The earlier sketch files are preserved as originally reviewed.

The subsequent feedback removes the transient catalog/preference connection labels from the lobby to prevent layout shifts. Catalog failures still show Retry, and Ready remains disabled until loading completes. The Match preferences button is now host-only; guests retain the next-match summary.

Follow-up validation: 67 frontend tests, production build and lint passed; 74 backend tests passed with the new-room default. A real two-browser session over trusted LAN HTTPS covered create/join, preset and song-type updates, matching start timestamps, autocomplete guess, pass, reconnect and five rounds through final standings. Checked 1440/390/320px layouts without horizontal overflow. Physical-device audio synchronization remains a manual test.
