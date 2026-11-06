# 3D avatar layering experiment

November 4, 2026. The owner likes the soft 3D toy direction but wants to test whether independently generated avatar parts overlap convincingly before selecting it for the app.

## Try it

Open `preview.html` in a browser. The same interactive fragment is displayed in the conversation. All artwork is embedded; this experiment does not contact the game backend or change room creation.

- Switch Luffy's straw hat, Naruto's headband, Chopper's hat, or no headwear.
- Independently add Gojo's blindfold.
- Change hair volume, hair tint, and skin tone.
- Compare a fitted hat with naive stacking using “Tuck hair under hats”.
- Inspect the four independently drawn layers.
- Adjust each item's position and scale. Fits are remembered per item when switching selections. The layer-order control makes occlusion failures visible.
- Compare the large preview with 40px and 64px avatar samples.

This is a compositing experiment, not an integrated room-entry component. Compact and Tall use different placements of the same hairpiece. Skin and hair colors are runtime shading adjustments. The hat mask is intentionally simple: it retains only the fringe below the hat, rather than solving arbitrary 3D geometry or generating a new image for every combination.

## Findings and limits

Independent transparent layers work for a fixed, frontal pose. Each item needs a fitted rectangle, and headwear benefits from a hair mask. Ties or brims that must pass behind the head would need dedicated front/back layers in a production collection. Lighting and contact shadows remain baked into the artwork; this proof does not synthesize shadows between layers. The generated sources contain minor edge artifacts, and the renderer discards disconnected alpha noise when extracting each silhouette.

The blindfold is fitted with a shorter vertical span so it covers the eyes while leaving the mouth visible. There is no expectation that every source image can be stacked without normalization. Use the actual controls to evaluate whether those constraints are acceptable.

Feedback so far: owner strongly liked the original pixel style, then preferred the soft 3D alternative visually. No production avatar direction or implementation has been approved yet.

## Editable sources

- `source.template.html`: readable markup, styles, canvas composition, and interactions.
- `build-preview.mjs`: embeds the three compressed image sources and writes `source.html` plus the conversation fragment.
- `source.html`: complete inline fragment with embedded artwork.
- `preview.html`: browser-openable wrapper made by the visualize renderer.
- `assets/*-source.png`: original generated sources, retained without modification.
- `assets/*.webp`: smaller encoded sources for embedding, with original alpha.
- `image-prompts.md`: prompts for the generated base and hairpiece, and the source of the existing prop atlas.

To rebuild, run `node build-preview.mjs` from this folder, then wrap `source.html` using the visualize skill's `scripts/render.py` to produce `preview.html`.

Validation: exercised all four headwear choices with the blindfold, confirmed that the hair-fit toggle, hair tint, and position sliders change the composed pixels, checked layer inspection and fit restoration, exercised scale/order/skin/shuffle, and checked a 360px layout for horizontal overflow. The browser reported no JavaScript errors. Inspected the default avatar and alternate combinations visually. This does not establish production compatibility for additional assets.
