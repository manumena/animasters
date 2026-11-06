# Prop contour editor

November 5, 2026. The owner asked for adjustable contours on individual avatar props, especially around each headphone ear cup.

Open `preview.html`. Choose a prop and a hairstyle, then select a contour and drag one of its points on the source artwork. The horizontal and vertical sliders move the same points with a keyboard. The editor dims the part of the prop that goes behind the avatar. The avatar updates as the points move, and switching props preserves each draft. **Restore saved contour** restores the selected curve from the preset.

`contour-presets.json` captures the saved session. It contains the owner’s edits to the headphones, Leaf headband, and Chopper’s hat. The session contains default curves for the straw hat, round glasses, and red scarf. The saved view opens with headphones, twin buns, and the right ear selected.

After further adjustments, open **Export preset** and use **Select JSON**, then copy the selection. The export contains every prop and its current curves. Save it as `contour-presets.json` and rebuild the preview to use those edits as the saved preset.

## Asset definition

Each prop has a fitted rectangle and one or more curves in normalized coordinates relative to its trimmed sprite. Each curve stores ordered points along a horizontal or vertical axis. The renderer interpolates between those points to make a smooth boundary. The asset specifies which side of that boundary is in front. The complementary mask goes behind the avatar and shares the same fit.

Headphones use separate left and right curves so a change to one cup leaves the other alone. A hat uses the top side of a horizontal curve. The scarf uses the bottom side. Glasses use the region between two vertical curves. Keeping control points ordered prevents the boundaries from folding over. The curve endpoints stay attached to the edges of their domains.

The editor changes which pixels cover the avatar. Each prop retains its shared fitted rectangle. Moving the physical cups would require separate cup artwork or transforms. The existing hat hair trim uses the center of the brim curve. This sketch supports ordered curves with fixed endpoints. More intricate props may call for closed paths or additional depth layers.

For a new prop, place a transparent WebP in this folder’s `assets/` directory and add an entry under `props` in `contour-presets.json`. Use the filename without `.webp` as `image`. Set `rectangle` to `[x, y, width, height]` in the 512px avatar coordinate space. Set `foreground` to `0` for the region above a horizontal curve, `1` for below it, or `"between"` for the region between two vertical curves. For vertical curves set `vertical` to `true`. Points are `[along, across]` in the range 0–1 relative to the trimmed image. Multiple horizontal curves can cover separate spans, as the headphone ears do. An optional `crop` selects a normalized atlas rectangle before trimming. The prop list and artwork load from these entries when the preview is rebuilt.

## Source and validation

`source.template.html`, `editor.js`, and `sprites.js` are the editable sources. `build-preview.mjs` embeds the existing WebP artwork from the [prop stress test](../2026-11-04-avatar-stress-and-expressions/README.md) and writes `source.html` and the inline preview. Build with `node build-preview.mjs`. Wrap `source.html` with the visualize renderer to update `preview.html`. The six props use the prior artwork and fixed frontal avatar pose.

Browser checks verified independent left and right ear edits, pointer dragging, slider changes, per-item draft retention, restoration of the original pixels, and visible composition changes for each other prop. Inspected desktop and 320px phone layouts. The preview reported no JavaScript errors or horizontal overflow.
