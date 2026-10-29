# Sound-bar motion alternatives

Created October 29, 2026.

[Open preview](preview.html) · [Editable source](source.html)

## Feedback being addressed

- Independent CSS loops looked unrelated to one another.
- Faster rebounds looked too busy.
- The owner wants quick expansion, slower contraction, and a relationship between neighboring bars.
- A shared looping pulse with a fixed shape also did not feel right. Compare alternatives before changing the app again.

## Research and design implications

A frequency spectrum is a changing set of levels across frequency bands. `getByteFrequencyData()` returns those levels from the same audio signal; it is not a collection of independently timed animations. [MDN: frequency data](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData).

Time smoothing blends current and previous analysis frames to reduce abrupt changes. This is different from making every frequency rise and fall by the same multiplier. [MDN: smoothingTimeConstant](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant).

audioMotion separates spectrum smoothing from peak-marker behavior, including holding and dropping peaks. The classic option borrows this distinction, not its implementation or exact decay formula. [audioMotion documentation](https://github.com/hvianna/audioMotion-analyzer/blob/master/README.md#peakholdtime-number).

**Our design interpretation:** change the shape over time, let broad regions respond to common events, and smooth rising and falling levels separately. Neighboring frequencies are not universally identical in real music; this spatial grouping is an intentional simplification for a decorative homepage animation.

## Alternatives

All three use the same invented 10-second sequence of low-, mid- and high-frequency events. Each event affects several neighboring bars, with overlapping regions. These are silent simulations, not FFT measurements, recordings, or claims about the sample song.

| Variant | Appearance and motion | Rise / fall filter constants |
| --- | --- | --- |
| Rounded spectrum | Centered bars; changing clusters with a quick rise and gradual release. Closest to the existing card. | 45 / 480 ms |
| Classic analyzer | Bars rise from a shared baseline; small peak markers hold briefly and fall separately. More like a traditional spectrum display. | 22 / 300 ms |
| Soft groove | Centered bars with broader clusters, smaller movement and a longer release. Calmer, suited to the café setting. | 90 / 850 ms |

The times are exponential filter constants, not fixed durations to complete a movement. The annotation controls can adjust rise time, fall time and movement strength independently for each variant.

## Reviewing the sketches

Use the variant picker and press **Play motion** on each option. All previews start paused. Switching variants does not start playback; a previously playing variant retains its state. There is no audio or network request in the sketch code. Changing the system preference to reduced motion pauses playback; a deliberate Play click can preview it again.

Select the closest motion first, then adjust its speed or intensity. The production app and the current uncommitted homepage experiment have not been changed by this exploration.

## Implementation notes

- A shared event timeline drives overlapping frequency regions. There are no independent per-bar oscillators or delayed copies of a fixed silhouette.
- Rise and fall use delta-time exponential smoothing so frame rate does not set the motion speed.
- Bar transforms preserve the layout. Peak markers are a separate visual in the classic variant.
- The snippet only runs an animation loop after an explicit Play click, pauses work when the document is hidden, and skips updating hidden variants.
- If an actual in-match spectrum is wanted later, use the playing audio as the analyser input. That is a separate task; the homepage remains silent and does not need a song download.
