# Arcade arrow layouts

November 5, 2026. The owner preferred Arcade arrows and asked for direct arrows for each setting and one shared prop rotation.

Open `preview.html` and use the picker beneath the form. All three sketches start from the owner’s previous Arcade arrows look. Each keeps its own edits while switching designs.

- **Side stacks** places the six arrow pairs around the portrait. A line below shows the last changed part and its position in the rotation.
- **Rows below** shows each of the six choices and its arrows under the portrait, with color swatches beside the current shades.
- **Grouped rows** switches between Hair & skin and Face & prop, with three arrow pairs visible at a time.

Each variant uses one prop ID. The rotation includes all six catalog props and None. Changing the ID replaces the previous prop, while hair, skin, eyes, and expression keep their selections. Wide hats tuck the hair beneath the brim, so the starting hat covers the selected twin buns.

`source.template.html`, `renderer.js`, and `interaction.js` are the editable sources. The builder uses the existing soft 3D artwork and saved prop contours. Run `node build-preview.mjs` and wrap `source.html` with the visualize renderer to refresh `preview.html`.

Browser checks covered all seven prop values, wraparound, the direct arrows for all six settings, group switching, retention of edits between variants, and the simulated entry action. Inspected desktop and 320px phone layouts.
