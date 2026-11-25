# Anime prop expansion

November 24, 2026. The owner requested more recognizable anime props to review before selecting a set for manual contour calibration.

This first batch contains Ash’s cap from Pokémon, Urahara’s bucket hat from Bleach, a Saiyan scouter from Dragon Ball, Kamina’s glasses from Gurren Lagann, Kakashi’s mask from Naruto, and Nezuko’s bamboo from Demon Slayer.

The six individual PNG files are in `assets/`. Both `source.html` and `preview.html` open the labeled review gallery in a browser. The existing soft 3D avatar base provided the material and proportion reference. Each object was generated separately with the built-in image generation tool and a transparent background. Exact prompts and source paths are recorded in `generation.json`. The scouter was regenerated to remove the diffuse glow in earlier drafts.

The owner approved all six props and calibrated their positioning and foreground/rear contours in the companion contour editor. The scouter’s glass interior is set to 45% opacity (115/255 alpha), with the rim and housing retained. The original image is preserved alongside the revised PNG.


The scouter translucency check is saved as `scouter-eye-preview.png`. It uses a temporary placement over the original avatar base to show the eye through the lens. This placement is provisional. The image-generator edit left the lens opaque, so a deterministic alpha mask supplies the measured opacity. Details are recorded in `generation.json`.

Kamina’s glasses now have an armless revision in `assets/kamina-glasses-armless.png`, generated from the original with the same 1774 × 887 canvas. The review gallery uses that revision. The original is retained. The saved contour editor uses `kamina-glasses-armless.webp` with the owner’s exported six-prop calibration.

November 25: all six props are implemented in the app’s avatar picker using those saved fits. Production copies are in `public/avatars/v1/`, including the translucent scouter and armless glasses. The original generation inputs and review gallery remain here.
