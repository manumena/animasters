# Spectrum response: falling time and flicker

Created October 29, 2026.

[Open preview](preview.html) · [Editable source](source.html)

## Owner's request

Expose falling time, make faster falls possible, and add the small height fluctuations seen in music visualizers. Preserve the last explored settings: 180 BPM and 65% independence, centered bars, no falling peak markers.

## Research boundary

The earlier sketches used documentation and invented signals. They did not measure the visual motion of an equalizer playing recorded music. This refinement additionally inspects a real analyzer's implementation, but is still a simulation.

The inspected audioMotion source obtains fresh FFT data, groups it into bars, and normalizes bar amplitude. Its smoothing setting is forwarded to Web Audio's `smoothingTimeConstant`. Peak-marker hold/drop behavior is handled separately from bar levels. No library code is copied into this sketch. [audioMotion source](https://github.com/hvianna/audioMotion-analyzer/blob/master/src/audioMotion-analyzer.js).

Web Audio smoothing blends current and previous analysis frames. More smoothing suppresses rapid changes; there is no single fall speed or flicker amount that defines a real visualizer. Actual behavior depends on the signal and analyzer settings. [MDN: smoothingTimeConstant](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant).

The added flicker is an explicit visual approximation, not measured fluctuations from a song. A faithful reference would require feeding recorded music to an analyser or replaying frequency frames derived from that music.

## Controls and defaults

| Control | Default | Range | Meaning |
| --- | --- | --- | --- |
| Song tempo | 180 BPM | 96–192 BPM | Pace of the invented musical events. |
| Bar independence | 65% | 0–100% | Individual accents mixed with the shared spectrum and neighbors. |
| Falling time | 180 ms | 60–700 ms | Time to close 90% of the distance to a fixed lower target, before the optional height texture. Lower values fall faster. |
| Height flicker | 12% | 0–35% | Small rapid height variations; 0 disables them. No brightness flashing. |

Earlier previews exposed the exponential fall **time constant**, which was 300 ms. That means about 691 ms to close 90% of a drop. The new visible falling-time control uses a 90% settling duration; internally its time constant is `fall / ln(10)`. This distinction is documented to keep the displayed time meaningful.

The base level still has a quick rise (22 ms time constant). Height texture is smoothly interpolated seeded variation with a 14-per-second sampling grid, mostly individual with a little neighbor influence. It is applied after base-level smoothing so it remains a separate control; its amplitude scales with bar height. Everything is bounded, uses the shared center and freezes on pause.

Playback starts paused. Reduced-motion changes pause it; document visibility suspends background work. All four visible controls can be remembered by the conversation preview. The annotation controls retain rise-time and overall-strength adjustments without duplicating the falling-time slider.

## Approved production settings

The owner selected **130 BPM**, **65% independence**, **280 ms falling time**, and **25% height flicker**. The homepage now uses this simulation with those fixed settings. The archived sketch retains its original defaults and controls for comparison.

Production motion uses centered bars without peak markers, remains silent, respects reduced motion, pauses offscreen or in hidden tabs, and cleans up its animation loop on navigation. Settings are centralized in `src/components/homeSpectrumMotion.ts`; no tuning controls are added to the public homepage.
