/* global self */

import { precomputeSpectrum } from './audio-analysis.mjs';

self.onmessage = event => {
  try {
    const { samples, sampleRate } = event.data;
    const frames = precomputeSpectrum(samples, sampleRate, progress => self.postMessage({ progress }));
    self.postMessage({ frames }, [frames.buffer]);
  } catch {
    self.postMessage({ error: 'The recorded spectrum could not be prepared. Press play to retry.' });
  }
};
