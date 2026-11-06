# Image generation record

Used the built-in image generation tool with `transparent_background: true` for both new assets. The previous soft 3D comparison sheet was the reference image for each. Originals are retained as `assets/base-source.png` and `assets/hair-source.png`.

## Base prompt

Use case: precise-object-edit. Image 1 is a reference for the exact 3D toy art style and generic avatar identity. Produce ONE isolated head-and-shoulders avatar base on a genuinely transparent background. It is the same tan-skinned friendly vinyl-toy boy from the reference, same rounded face, small black oval eyes, black eyebrows and smile, ears, gray t-shirt and small arms, but COMPLETELY BALD and WITHOUT ANY ACCESSORIES. No hair whatsoever, no black scalp, no hat, no headband, no blindfold. Head smoothly rounded, a large softly rounded toy cranium, slightly oversized relative to compact torso. Straight-on orthographic frontal camera, symmetric pose, neutral friendly smile, match reference matte material and soft studio lighting from upper left. The head and shoulder bust completely visible, centered with 12 percent transparent padding on all sides. No ground plane or cast shadow, no text, no colored fragments, no backdrop. This must be a clean compositing base to receive separate hair and hat overlays.

## Hair prompt

Use case: precise-object-edit. Image 1 is a reference for the exact 3D vinyl-toy art style and charcoal hairstyle. Produce ONE isolated 3D charcoal black short spiky hairpiece/wig, viewed exactly straight-on, to overlay on the generic avatar head. Match the hairstyle of the lower-row avatars, especially the Naruto avatar: thick softly sculpted pointed tufts forming a rounded crown, an uneven fringe with a few short bangs hanging down, short compact sideburns at both sides. Only the opaque hair material should exist: the forehead, face, ears, neck and head beneath the hair are absent and genuinely transparent. No skin, no mannequin, no eyes, no eyebrows, no bust, no hat, no band, no other item. The lower contour has several downward points as fringe, with an open transparent face area beneath. Soft matte material, subtle sculpted highlights, no outline. Center fully visible with 12 percent transparent padding on all sides. No drop shadow outside object, no noise or colored fragments, no background, no text. This is a production-style compositing layer to put on a bald toy avatar.

## Existing prop atlas

`assets/props-source.png` is the soft 3D toy comparison sheet generated earlier in this conversation, before the attempted cleanup variant. Only its four isolated top-row props are used. The bottom-row premade avatars are not used in the mixer. Source: `/Users/manumena/.codex/generated_images/01a1a773-db46-79e2-acff-45b0136e0a37/exec-e8f33129-87aa-4e12-950a-2e226a72e8a2.png`.

Atlas rendering style prompt: Redraw as charming softly rounded 3D vinyl-toy avatar busts and matching isolated toy accessories. Matte soft-touch material, sculpted chunky forms, oversized friendly head with short dark molded hair, tiny black oval eyes and small smile, subtle studio shading and soft highlights on the objects only. All facing straight forward with orthographic camera; no isometric angle. Restrained detail, clean silhouettes, gray molded shirt. Premium collectible-toy aesthetic. Not pixel art, not flat illustration, no scenery or ground plane.
