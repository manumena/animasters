# Combined avatar creator

November 5, 2026. The owner requested a single creator that combines props, hairstyles, hair colors, natural and fantasy skin tones, eyes, and expressions.

Open `preview.html` and choose a starter look or edit each feature directly. The creator uses the soft 3D artwork and the saved prop contours. The main portrait and 48px room icon use the same composition. The three starter looks show lilac skin with teal hair and headphones, sky blue skin with a straw hat and scarf, and mint skin with copper twin buns and a Leaf headband.

The player choices use stable IDs and save as a versioned browser configuration. The preview can also use the host’s state when browser storage is unavailable. Invalid or removed choices fall back individually. Hats, eyewear, headphones, and scarves occupy independent slots. Wide hats tuck the hair around their brim. This can hide the twin buns, and dark lenses can obscure the selected eyes.

`source.template.html`, `creator.js`, and `sprites.js` are the editable sources. The builder embeds the [earlier artwork](../2026-11-04-avatar-stress-and-expressions/README.md) and reads the [saved contour catalog](../2026-11-05-avatar-contour-editor/contour-presets.json). Run `node build-preview.mjs` to rebuild the fragment and use the visualize renderer to refresh `preview.html`.

Browser checks exercised each selectable category, the starter looks, all four prop slots together, and the 320px layout. Checked that a saved look survives a reload and that an unknown prop falls back while preserving valid selections. Inspected all three starter looks at portrait and room icon sizes.
