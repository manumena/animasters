# Design sketch archive

Keep each design exploration in a dated folder with a descriptive name. Save its editable `source.html`, a browser-openable `preview.html`, and a short `README.md` recording the variants, feedback and any image dependencies. Keep earlier explorations available rather than overwriting them. These are design references, not production routes.

## Homepage explorations

| Date | Sketch | Variants | Feedback |
| --- | --- | --- | --- |
| October 29, 2026 | [Initial homepage directions](2026-10-29-homepage-directions/README.md) · [Preview](2026-10-29-homepage-directions/preview.html) | Anime arcade; Cozy anime hangout; Clean music quiz | Owner prefers Clean music quiz. Anime arcade feels too similar to Melomatch. |
| October 29, 2026 | [Clean homepage with café artwork](2026-10-29-homepage-cafe/README.md) · [Preview](2026-10-29-homepage-cafe/preview.html) | Café backdrop; Café panorama | Owner selected Café backdrop for implementation, without the “Hide café” button. |
| October 29, 2026 | [Sound-bar motion alternatives](2026-10-29-equalizer-motion/README.md) · [Preview](2026-10-29-equalizer-motion/preview.html) | Rounded spectrum; Classic analyzer; Soft groove | Owner prefers Classic's motion, with a faster song tempo, vertically centered bars and no peak markers. |
| October 29, 2026 | [Fast centered spectrum](2026-10-29-fast-centered-spectrum/README.md) · [Preview](2026-10-29-fast-centered-spectrum/preview.html) | Refined Classic motion; adjustable tempo | Owner tried 192 BPM, but wants bars somewhat more independent without completely random motion. |
| October 29, 2026 | [Looser spectrum](2026-10-29-looser-spectrum/README.md) · [Preview](2026-10-29-looser-spectrum/preview.html) | Shared rhythm with individual accents; adjustable independence | Owner tried 180 BPM and 65% independence, then requested adjustable falling time and small height fluctuations. |
| October 29, 2026 | [Spectrum response](2026-10-29-spectrum-response/README.md) · [Preview](2026-10-29-spectrum-response/preview.html) | Adjustable fall and height flicker | Approved and implemented: 130 BPM, 65% independence, 280 ms falling time and 25% height flicker. Still a silent simulation. |

Open a `preview.html` file in a browser and use its variant picker. Previews do not create rooms or contact the game backend. Some exported presentation assets load from a CDN, so an internet connection may be needed.

## Current direction

- Preserve the centered typography, simple Create/Join actions and gameplay preview from Clean music quiz.
- Add anime-style atmosphere using the café scene already present in the app.
- Implement the selected Café backdrop while keeping text and controls readable on phones; omit the “Hide café” button.
- Do not add deferred avatars, authentication or extra game modes to the current implementation solely because they appear in inspiration notes.
- Save future sketches here and add them to this index.
