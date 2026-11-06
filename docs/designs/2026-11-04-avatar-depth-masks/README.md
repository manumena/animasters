# Props with front and rear depth masks

November 4, 2026. Follow-up to the [first avatar layering experiment](../2026-11-04-avatar-layering/README.md).

## Feedback driving this revision

The owner pointed out that Luffy's tilted hat still looks like a complete object pasted over the head. Its visible interior covers the hair and forehead instead of receiving the head inside it. Different sections of many props will need to appear at different depths because of perspective. The tilted appearance itself is desirable.

## Try the revised composition

Open `preview.html`. The same offline interactive fragment is displayed in the conversation.

- Composition switches between **Split around the head** and **Original · whole prop in front**, using the same source artwork and fitted rectangles.
- **Show front and rear pieces** exposes the six render slots in drawing order.
- Headwear and the blindfold independently contribute front and rear pieces. For the hats, the visible underside sits behind the head and hair while the crown and upper brim lip remain in front. Headband and blindfold tails go behind the head.
- **Adjust overlap → Opening contour** adjusts the selected prop's curved depth boundary.
- **Head opacity** fades the head and hair, revealing the rear section that they normally hide.
- Existing fit, hair-volume, tint, skin-tone, shuffle, and 40px/64px previews remain available.

The initial avatar retains the owner's last visible preference: straw hat, no face accessory, compact brown hair, light skin.

## Rendering contract

The default order is rear headwear → rear face accessory → head/body → hair → front headwear → front face accessory.

Each prop's front and rear sections use the same bitmap, anchor, scale, and translation. A normalized curved mask selects the front region, and its exact complement selects the rear. Both regions move together. The existing hair-tucking mask separately hides crown hair that would protrude through a fitted hat.

This experiment uses approximate, manually defined curved masks for the existing images. Artist-prepared assets should trace the actual contours and can use arbitrary paths containing disconnected regions. The implementation can be extended to additional named depth slots when a prop needs more than two sections or must pass between the face and front hair. A single straight top/bottom cut is insufficient as a general asset contract.

The same artwork can be reused in both composition modes, so the comparison isolates occlusion. These masks do not correct incompatible camera angles, missing surfaces, or mismatched lighting. A production collection still needs a shared pose, camera, anchor system, and per-prop mask review. Contact shadows may require additional prepared overlays. No production app behavior changes in this sketch.

## Files

- `source.template.html`: editable markup, canvas renderer, depth paths, and interactions.
- `build-preview.mjs`: embeds the three compressed image sources and writes `source.html` plus the inline conversation fragment.
- `source.html`: generated inline fragment.
- `preview.html`: browser-openable preview.
- `assets/*.webp`: source copies reused from the first experiment. Original generated PNGs and image prompts remain in that earlier sketch's `assets/` directory and `image-prompts.md`.

Build with `node build-preview.mjs`, then use the visualize skill's `scripts/render.py source.html preview.html --force` to refresh the browser-openable preview.

The earlier experiment is preserved so both approaches can be revisited.

## Validation

Verified rendered pixels in a real browser: the hat opening now reveals the head, the front crown retains the original hat pixels over the head, and fading out the head reveals the rear underside. Small pixel tolerances account for partially transparent generated source pixels. Checked that contour changes affect composition and that headwear choices, blindfold, hair fitting/tint, position, fit restoration, scale, skin tone, layer inspection, and shuffle still work. Checked layouts at 360px and 320px with no horizontal overflow and no JavaScript errors. Visually inspected the original/split hat comparison and the other prop combinations. These checks cover this fixed-pose experiment, not arbitrary future artwork.
