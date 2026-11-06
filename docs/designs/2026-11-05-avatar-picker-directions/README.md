# Avatar picker directions

November 5, 2026. The owner asked to compare ways of presenting avatar choices under the nickname before implementation.

Open `preview.html` and use the design picker below the room form. The three variants begin with the same soft 3D avatar and offer the same set of parts. Each keeps its own selection when you switch designs.

- **Arcade arrows** cycles the selected part with arrows beside the portrait. The part menu changes what the arrows control.
- **Thumbnail picker** groups choices under Hair, Face, and Props. Previews show the current avatar with one part changed. Color choices show swatches.
- **Starter looks** offers three complete avatars. **Fine-tune look** opens the controls for individual parts.

The room form simulates the entry action and displays the entered nickname locally. The sketches reuse the combined creator’s artwork, proportions, and saved prop contours. `source.template.html`, `renderer.js`, and `interaction.js` are the editable sources. Run `node build-preview.mjs` to build the fragment, then wrap `source.html` with the visualize renderer to refresh `preview.html`.

Browser checks covered the carousel controls, equal starting avatars, wrapping arrows, thumbnails and swatches, preset edits, independent selection retention, the simulated entry action, and all three layouts at 320px. The browser reported no script errors or horizontal overflow.
