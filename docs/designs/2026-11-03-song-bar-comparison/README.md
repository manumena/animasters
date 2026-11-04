# Song bar comparison

November 3, 2026. Requested as an interactive comparison before changing the match player.

[Open standalone preview](preview.html) · [Editable entry](source.html) · [Component](comparison.mjs)

With the frontend server running, open `/docs/designs/2026-11-03-song-bar-comparison/preview.html`.
The standalone preview also opens directly in a browser. It needs internet access to load the two existing public catalog recordings; no audio is copied into the repository.

## Alternatives

- **Live spectrum:** the browser's `AnalyserNode`, split into 34 logarithmic frequency bands from 45 Hz to 16 kHz.
- **Live loudness:** measured RMS amplitude drives one fixed, centered profile. It has no independent frequency response or random movement.
- **Precomputed spectrum:** a worker analyses the decoded recording into raw frequency frames at 20 fps before playback. During playback this view interpolates those frames by the audio clock. In a production catalog pipeline, this data would be generated once and downloaded alongside the recording; this preview generates and caches it in memory for each song.

The recordings are **Kick Back / Chainsawman** and **Boku-tachi wa Tenshi datta / Dragon Ball Z**. Their existing public URLs were checked for successful responses and CORS support. The preview fetches and decodes one recording at a time, then shares one source across all three views. It does not create a room, connect a game socket, change a production route or affect shared round timing.

Live and stored spectra use the same Blackman window contract, FFT size, band grouping, sensitivity and display smoothing. Small differences are expected from the stored 20 fps sample rate and browser analysis timing. The stored option should look similar to the live option: its main tradeoff is where and when analysis runs, rather than a distinct visual style.

Controls: song, play/pause, restart, seeking, listening volume, falling time, visual sensitivity, all-three/focused comparison, and animation enabled. Audio starts only after a click. Analysis happens before the volume control, so lowering listening volume does not change bar heights. Reduced-motion preferences disable animation initially; the explicit checkbox can enable it for comparison. Paused audio settles to resting bars. Hidden documents skip visual updates. Disconnection stops playback, cancels download/analysis and closes the audio context.

## Editing and checks

Run with Node 24 from this directory:

```sh
node build-preview.mjs
node --test audio-analysis.test.mjs
```

`build-preview.mjs` creates a self-contained `preview.html` from the editable modules, embedding the analysis worker as a Blob rather than depending on local-file module imports.

Numerical tests cover silence, a known frequency and amplitude, RMS loudness, finite interpolation at silence boundaries, and seeking between silence and sound. All four tests pass; all five editable modules pass the repository's ESLint rules.

Browser verification: both public recordings load, decode, finish precomputation and play. Live and stored frequency heights closely agree at the same playback moment. Checked pause/restart, seeking to the end and back to the beginning, switching songs, focusing the stored view, restoring all three views, and disabling/re-enabling animation. All 102 bars return to their resting height with animation disabled. No browser warnings or errors were recorded. The layout was visually checked at 360 px and measured for overflow at both 360 px and 320 px, then restored to the normal viewport. [Playing comparison capture](comparison.png). The delivered tab is paused at the beginning of Kick Back.

Technical reference: [Web Audio FFT windowing and scaling](https://webaudio.github.io/web-audio-api/#fft-windowing-and-smoothing-over-time).

## Selected and implemented

The owner selected **Live spectrum** on November 3, retaining centered rounded bars and choosing **60 ms falling time** and **0 dB visual sensitivity**. The production match player now uses that live analysis, with the comparison's 22 ms rise, frequency bands and dB mapping. Listening volume remains independent. Reduced-motion users see resting bars; hidden/offscreen views suspend visual work. Audio scheduling remains owned by `RoomAudio`, including the previous audible song while the next one preloads.

The original comparison stays available above. With Vite running, [open the actual player preview](actual-player.html) to exercise the production `RoomPlayback` and `RoomAudio` with the two catalog recordings. Its extra preview controls load Kick Back immediately or schedule the other song three seconds later, without creating a room or socket. This entry requires Vite; the original `preview.html` remains standalone.

Implementation verification: all 129 frontend tests pass, TypeScript checking and the production Vite build pass, and ESLint passes for the changed source and preview files. Tests cover frequency separation, source start/stop boundaries, preloading, seeking, context suspension, volume independence, 60 ms decay, reduced motion, offscreen/hidden views and Strict Mode cleanup. In the browser, both recordings drove distinct live bar heights through pause/resume, seeking and a three-second scheduled transition; paused bars settled to their resting height. No browser errors were recorded. [Actual player capture](actual-player.png). Application deployment remains pending.
