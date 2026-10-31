# Continuous countdown ring — October 31, 2026

Editable source: `source.html`. Browser-openable preview: `preview.html`.

Owner loved **Countdown ring** and requested continuous movement instead of one-second steps. This follow-up retains its layout, mint-to-amber final-three-second cue, whole-second digits and Ready controls. The arc now drains on each animation frame from precise elapsed time, rather than using the rounded number. At zero it disappears completely, including the rounded endpoint.

Press **Play 10-second preview** to see the sweep. It runs once and stops; no automatic animation or looping. **Show final 3 seconds** remains a static inspection control. Reduced-motion preferences disable the decorative café animation; the ring remains a direct representation of elapsed time without easing, pulsing or extra effects.

Owner approved this direction and requested implementation. Implemented in the production between-round reveal: continuous arc, whole-second digits, final-three-second amber cue, Ready button and keyboard shortcuts. The arc interpolates the synchronized clock and follows server deadline changes; it does not trigger playback. Ready moves below the ring on narrow phones. This sketch remains an archived reference. The prior three alternatives are retained in `../2026-10-31-between-round-countdown/`. Sample content, image dependency and readiness simulation are the same as those alternatives.
