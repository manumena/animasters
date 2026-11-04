export const BAR_COUNT = 34;
export const FFT_SIZE = 4096;
export const FRAME_RATE = 20;

export function frequencyBands(sampleRate) {
  const lowerFrequency = 45;
  const upperFrequency = Math.min(16000, sampleRate / 2);
  const binFrequency = sampleRate / FFT_SIZE;

  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const lower = lowerFrequency * (upperFrequency / lowerFrequency) ** (index / BAR_COUNT);
    const upper = lowerFrequency * (upperFrequency / lowerFrequency) ** ((index + 1) / BAR_COUNT);
    const start = Math.max(1, Math.floor(lower / binFrequency));
    const end = Math.min(FFT_SIZE / 2, Math.max(start + 1, Math.ceil(upper / binFrequency)));
    return { start, end };
  });
}

export function bandDecibels(frequencies, bands) {
  return bands.map(({ start, end }) => {
    let maximum = -Infinity;
    for (let index = start; index < end; index++) {
      maximum = Math.max(maximum, frequencies[index]);
    }
    return maximum;
  });
}

export function normalizedLevel(decibels, sensitivity = 0, floor = -85, ceiling = -20) {
  return Math.max(0, Math.min(1, (decibels + sensitivity - floor) / (ceiling - floor)));
}

export function rmsDecibels(samples) {
  let energy = 0;
  for (const sample of samples) energy += sample * sample;
  return 20 * Math.log10(Math.sqrt(energy / samples.length));
}

/** Blackman window and 1/N FFT scaling match the Web Audio analyser contract.
 * Both live and stored spectra use the same bands; only their sample times differ.
 * This processor belongs to the preview, not the production playback controller. */
export function createSpectrumProcessor(sampleRate) {
  const real = new Float64Array(FFT_SIZE);
  const imaginary = new Float64Array(FFT_SIZE);
  const window = new Float64Array(FFT_SIZE);
  const reversed = new Uint16Array(FFT_SIZE);
  const cosine = new Float64Array(FFT_SIZE / 2);
  const sine = new Float64Array(FFT_SIZE / 2);
  const frequencies = new Float32Array(FFT_SIZE / 2);
  const bands = frequencyBands(sampleRate);
  const bitCount = Math.log2(FFT_SIZE);

  for (let index = 0; index < FFT_SIZE; index++) {
    const phase = 2 * Math.PI * index / FFT_SIZE;
    window[index] = 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(2 * phase);

    let original = index;
    let reverse = 0;
    for (let bit = 0; bit < bitCount; bit++) {
      reverse = (reverse << 1) | (original & 1);
      original >>= 1;
    }
    reversed[index] = reverse;
  }

  for (let index = 0; index < cosine.length; index++) {
    const angle = -2 * Math.PI * index / FFT_SIZE;
    cosine[index] = Math.cos(angle);
    sine[index] = Math.sin(angle);
  }

  return (samples, endSample) => {
    // Match a live analyser's trailing window, padding the beginning with silence.
    for (let index = 0; index < FFT_SIZE; index++) {
      const sampleIndex = endSample - FFT_SIZE + index;
      const value = sampleIndex >= 0 && sampleIndex < samples.length ? samples[sampleIndex] : 0;
      real[reversed[index]] = value * window[index];
      imaginary[reversed[index]] = 0;
    }

    for (let size = 2; size <= FFT_SIZE; size *= 2) {
      const half = size / 2;
      const stride = FFT_SIZE / size;

      for (let block = 0; block < FFT_SIZE; block += size) {
        for (let offset = 0; offset < half; offset++) {
          const left = block + offset;
          const right = left + half;
          const twiddle = offset * stride;
          const rotatedReal = real[right] * cosine[twiddle] - imaginary[right] * sine[twiddle];
          const rotatedImaginary = real[right] * sine[twiddle] + imaginary[right] * cosine[twiddle];
          real[right] = real[left] - rotatedReal;
          imaginary[right] = imaginary[left] - rotatedImaginary;
          real[left] += rotatedReal;
          imaginary[left] += rotatedImaginary;
        }
      }
    }

    for (let index = 0; index < frequencies.length; index++) {
      const amplitude = Math.hypot(real[index], imaginary[index]) / FFT_SIZE;
      frequencies[index] = 20 * Math.log10(amplitude);
    }
    return bandDecibels(frequencies, bands);
  };
}

/** Store raw dB rather than display heights so sensitivity stays adjustable. */
export function precomputeSpectrum(samples, sampleRate, onProgress = () => {}) {
  const process = createSpectrumProcessor(sampleRate);
  const frameCount = Math.ceil(samples.length / sampleRate * FRAME_RATE) + 1;
  const frames = new Float32Array(frameCount * BAR_COUNT);

  for (let frame = 0; frame < frameCount; frame++) {
    const position = Math.round(frame / FRAME_RATE * sampleRate);
    frames.set(process(samples, position), frame * BAR_COUNT);
    if (frame % 100 === 0) onProgress(frame / frameCount);
  }
  return frames;
}

export function storedLevels(frames, seconds, sensitivity = 0) {
  const framePosition = Math.max(0, seconds * FRAME_RATE);
  const lastFrame = frames.length / BAR_COUNT - 1;
  const lowerFrame = Math.min(lastFrame, Math.floor(framePosition));
  const upperFrame = Math.min(lastFrame, lowerFrame + 1);
  const blend = Math.min(1, framePosition - lowerFrame);

  return Array.from({ length: BAR_COUNT }, (_, index) => {
    // Normalize before interpolation so silence (-Infinity dB) stays well-defined.
    const lower = normalizedLevel(frames[lowerFrame * BAR_COUNT + index], sensitivity);
    const upper = normalizedLevel(frames[upperFrame * BAR_COUNT + index], sensitivity);
    return lower + (upper - lower) * blend;
  });
}
