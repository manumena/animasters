# Looser spectrum

Created October 29, 2026.

[Open preview](preview.html) · [Editable source](source.html)

The owner found the fast centered spectrum too tightly linked and asked for bars that are somewhat independent, without completely random motion.

## Refinement

- Retain the centered bars, no peak markers, quick rise and slower fall.
- Add repeatable individual accents on the shared beat grid. Bars vary in accent level, onset and decay, and sometimes skip a beat.
- Each accent contributes mostly to its own bar, with a smaller contribution to its immediate neighbors.
- Keep the earlier broad frequency groups underneath. There are no fresh random jumps per animation frame.
- Start at 55% **Bar independence**, adjustable from linked clusters to stronger individual accents. Even 100% retains the shared rhythm, broad regions and neighbor influence.
- Keep the 192 BPM tempo last tried in the preceding preview; the tempo control remains available.

Independent accents are deterministic, so comparing the slider at a paused moment changes the mixture rather than generating unrelated data. Tempo and independence can be remembered by the conversation preview; playback always starts paused. This is a silent simulation and does not change the app's animation.

## Technical notes

The broad event-driven spectrum is mixed with seeded per-bar accent envelopes. Local accents receive 70% of their own energy and 15% from each immediate neighbor. Increasing independence attenuates, but never removes, the broad spectrum. Rise/fall filtering remains based on real elapsed time (22/300 ms defaults).

Earlier sketches remain in the archive for comparison. This preview is awaiting selection before production integration.
