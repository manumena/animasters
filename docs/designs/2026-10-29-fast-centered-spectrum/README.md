# Fast centered spectrum

Created October 29, 2026.

[Open preview](preview.html) · [Editable source](source.html)

## Owner's direction

The owner prefers the **Classic analyzer** motion from the [first motion study](../2026-10-29-equalizer-motion/README.md), but wants the pace of a faster song. Keep vertically centered, rounded bars from the other designs and remove falling peak markers.

## This refinement

- Retains Classic's changing frequency groups, 22 ms rise and 300 ms fall filter constants, strength 1.08 and frequency-region width factor 0.82.
- Starts at a simulated **156 BPM**, compared with the earlier phrase's 96 BPM. The visible tempo slider spans 96–192 BPM.
- Tempo advances the invented musical phrase faster. The rise/fall filters still use real elapsed time, so increasing tempo does not shorten those response constants.
- Bars grow equally above and below their shared center. There are no peak-marker elements or peak tracking.
- Starts paused; Play motion runs the silent simulation. Reduced-motion preference changes pause it, and the document visibility lifecycle suspends background work.
- The annotation controls can still tune rise, fall and movement strength. The selected tempo can be remembered by the conversation preview; playback is never restored automatically.

This is a design preview, not a new production animation. It uses the earlier study's invented event sequence, not a song, recording or FFT measurement. The app's existing uncommitted experiment remains untouched until the motion is selected for implementation.
