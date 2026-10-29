# Clean homepage with café artwork

Created October 29, 2026.

[Open preview](preview.html) · [Editable source](source.html)

Builds on the selected **Clean music quiz** direction. Both variants retain centered copy, clear Create/Join actions, a sample round and a compact How to play section.

- **Café backdrop:** the existing café scene fills the upper page, with a dark overlay and a fade into the content background. This retains the atmosphere of the current app.
- **Café panorama:** the hero stays on a solid surface; the scene appears as a wide image beneath it. This gives the illustration more clarity while separating it from the text.

## Artwork and motion

Both variants reuse the original, unmodified [`src/assets/lofi-cafe.gif`](../../../src/assets/lofi-cafe.gif). The preview loads the repository's existing GIF through a pinned jsDelivr URL compatible with the conversation preview. No new artwork is generated and no external image is imported into the app.

The image can be hidden using the scene toggle and is hidden initially for reduced-motion preferences. This sketch does not attempt to pause a GIF. A production version should consider a static poster plus a controllable animation; that asset work is not included here.

The archived sample round is illustrative and has no audio. Its Create and Join buttons only show a local preview of the next step.

## Selected implementation

On October 29, the owner chose **Café backdrop**, without the “Hide café” button. The frontend homepage now uses that layout with separate links into the existing Create and Join forms. Its example round remains local and silent. The sketches above retain the original alternatives for reference.

The selected appearance is the sketch's dark green palette: dark lower background and preview card, light text and mint accents. Keep this appearance independent of the browser's light/dark preference.

The café artwork is an independent background layer: wide screens show its full height without pushing the content down, while narrow screens crop the sides. The illustrative sound bars animate with staggered timing; they remain static for reduced-motion preferences and do not play or analyse audio.
