# Prop stress test and facial-expression comparison

November 4, 2026. The owner requested the proposed hat/headphone/glasses/scarf test across several hairstyles, plus a separate comparison of eyes and expressions between soft 3D and pixel art.

## Interactive previews

Open `props-preview.html` for the prop test. Independently select headwear, round sunglasses, headphones, and a red scarf. Choose Spiky, Bob, or Twin buns. The three smaller previews keep the selected props while showing all three hairstyles together. The headwear menu retains the earlier Leaf headband and Chopper hat as additional choices.

Composition switches between the depth-aware renderer and a whole-image overlay. Layer inspection exposes the rear sections, head, hair, scarf wrap, ear cups, and hat/lens foreground. The fit controls remember offsets and scale per asset. Opening contours apply to the hats and scarf; ear cups and lenses use disconnected masks instead of the curved-opening control.

Open `faces-preview.html` for the side-by-side style comparison. The same eye family and expression are selected in both styles. Available eye families are Oval, Round with iris, and Almond. Expressions are Smile, Neutral, Laugh, Angry, Sleepy, and Surprised. **Compare all expressions** displays all six expressions in the selected eye family, paired as 3D then pixel art. Both styles also have a 48px icon preview.

These are design experiments. Production room entry and player data are unchanged.

## What the prop test shows

- Headphones place the connecting band behind the head/hair and the two cup regions in front.
- Glasses place the side arms behind the head/hair and their lenses/bridge in front.
- The scarf reverses the hat's mask direction: its upper loop goes behind the neck while its lower wrap and hanging end cover the clothing and lower hair.
- The tilted hat continues using a curved front/rear mask. Its default opening follows the owner's last tested 74% setting.
- Spiky, Bob, and Twin buns are genuinely different generated hairpieces, not scaled copies of one hairstyle.

The hat's hair-tucking mask removes the twin buns along with the crown hair. The current result therefore does not preserve that hairstyle under a hat. Production should supply a fitted hairstyle variant, prepare a hairstyle-specific mask, or mark that pairing incompatible. This is an intentional visible finding from the test, not evidence that the combination is solved. The bob's ear area and the headphone cups are additional places worth reviewing at full and icon size.

The masks remain manually prepared approximations. They do not infer surface geometry, correct mismatched camera angles, or generate contact shadows. A production collection still needs consistent art direction and per-asset fitting. Multiple selected props can also require compatibility rules where they intersect each other.

## Face-rendering contract

Blank avatar bases receive generated facial-feature groups. Each style's atlas has three eye-family columns and six expression rows. The complete eye/brow/mouth group is selected by those two independent controls and drawn at a fixed anchor. The facial cells keep their full cell coordinates when cleaned; trimming every expression independently would introduce unwanted movement. The blank bases and hair stay fixed when a face selection changes.

The pixel comparison composites to a 96px canvas and enlarges with nearest-neighbor rendering. Its sources use lossless WebP and nearest-neighbor preparation. The soft 3D renderer uses smooth raster scaling. These are generated style studies with corresponding choices, not exact anatomical matches or a finished production sprite atlas. Closed-eye laughing expressions naturally reduce the visual differences between eye families.

## Source and artwork

- `props.template.html` and `faces.template.html`: readable editable fragments and renderers.
- `avatar-prop-stress-test.html` and `avatar-expression-comparison.html`: built inline fragments with embedded artwork.
- `props-preview.html` and `faces-preview.html`: browser-openable wrappers.
- `prepare-assets.mjs`: copies initial image outputs into the sketch, prepares smaller encoded versions, embeds artwork, and writes both inline previews. Later rebuilds use the retained local originals.
- `assets/*-source.png`: the nine new original images, generated with the built-in image generation tool and transparent backgrounds.
- `assets/*.webp`: runtime versions. The prior base, spiky hair, and original props atlas are reused from the earlier sketch.
- `image-prompts.json`: exact prompts, reference paths, and tool choice for all nine new image assets. No image API/CLI fallback was used.

To rebuild, run `node prepare-assets.mjs`, then wrap each generated fragment using the visualize skill's `scripts/render.py` with the corresponding `*-preview.html` destination and `--force` when replacing the existing wrapper.

## Validation

Exercised each of the four core prop types individually on all three hairstyles: 12 combinations. Verified that switching from split masks to whole-image overlay changes each rendered result. Exercised stacking all four types, layer inspection, scarf contour changes/restoration, fit controls, and correct disabling of the curve control for disconnected cup masks.

Exercised all three eye styles and six expressions in both art styles: 18 distinct rendered outputs per style. Verified the contact sheet opens and both paired views update together. Inspected desktop, contact-sheet, and mobile screenshots. Both previews fit a 320px viewport without horizontal overflow. The browser reported no JavaScript errors. Automated pixel differences verify interaction/rendering behavior; the limits of anatomical fitting are recorded above.
