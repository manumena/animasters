# Room creation directions — October 29, 2026

Archived design exploration. The owner subsequently selected Quick entry for implementation. These previews remain independent of the app and make no backend requests.

- `source.html`: editable fragment, with shared markup and commented layout rules.
- `preview.html`: browser-openable carousel. Select a direction, switch Create/Join, enter a nickname and try the main button. Submission only shows the proposed next step.

## Alternatives

1. **Quick entry**: a centered form beneath a short heading. Recommended for the MVP: clear focus, familiar homepage alignment, and a compact path to the lobby.
2. **Café welcome**: introductory copy and a three-step explanation beside the form; stacked on phones. More welcoming for first-time visitors, but adds reading and vertical space.
3. **Café counter**: a broad form below the hero, with nickname and action on one row on desktop. Shows more artwork and feels continuous with the homepage; joining requires more horizontal space and collapses to a column on phones.

All preserve nickname-first entry, uppercase four-character alphanumeric room codes, up to ten players, no account requirement, and host preferences in the lobby. They do not introduce avatars, public rooms, authentication, or a host-only Start button. Invite links should prefill the code and select Join in the eventual implementation.

## Visual and background contract

Use the homepage's dark green-blue surfaces, mint action color, thin borders, rounded corners and wordmark. Keep the café on an independent decorative layer, anchored at page top; expanding the form must never change image scale or move the content.

The source uses the original 1920×1080 café GIF, pinned to public commit `4856ebff01ecec6fefe23093c02f0f043c65c0f8` through jsDelivr. It needs an internet connection. The full image fits at wide widths; narrow views crop its sides. The default dimming overlay and bottom fade match the homepage.

Sketch geometry uses the measured desktop homepage hero height (591.4375px), a 16:9 width-derived minimum, and an approximate 610px phone frame. The phone reference is approximate because the current homepage hero height depends on text wrapping. Before implementation, extract a shared backdrop sizing contract and compare home/rooms at the same viewport; do not tie a separate `cover` background to each page's form height. Neither the source nor this discussion claims the phone crop is pixel-identical yet.

## Reference patterns

Inspected the public entry-page content on October 29, 2026:

- [skribbl.io](https://skribbl.io/): nickname entry and a private-room action; room controls and invitation sharing support a fast entry followed by lobby configuration.
- [Gartic Phone](https://garticphone.com/): anonymous/authenticated choices and character/nickname before starting. Borrow the short identity step; character customization remains deferred for AniMasters.
- [JKLM.FUN](https://jklm.fun/): separate room creation and joining by code. Borrow the distinction, without adding its public/private selection or room-name field.
- [Anime Music Quiz](https://animemusicquiz.com/): public entry emphasizes login/registration. Detailed settings were discussed previously by the owner; this exploration does not claim a fresh inspection of its authenticated lobby.

These are interaction references, not copied visual styles. The artwork and palette come from AniMasters.

## Feedback and checks

Owner requirements: match homepage colors/patterns, preserve background size, discuss before implementing. Owner selected Quick entry and requested implementation while preserving the current Create/Join behavior.

Checked desktop and phone layouts at 1024, 390 and 320px browser widths. Create/Join switching, code normalization, validation and local next-step feedback are covered by a browser smoke check. Preview is intentionally separate from the running app.

## Implementation follow-up

Quick entry is now implemented in `src/pages/Rooms.tsx` and `Rooms.css`. The home and entry pages share `CafePage.tsx` / `CafePage.css`, including the brand, palette, artwork, overlay, fade and image position. A common minimum artwork frame (592px desktop, 610px phone, 592px at widths up to 360px) replaces the old content-dependent hero frame; wide screens still use width × 9/16. These rounded dimensions preserve the chosen composition and make the image geometry identical across both pages, independent of fields, errors or text wrapping. The archived sketches are retained unchanged. Lobby and match rendering remain outside the new entry theme.
