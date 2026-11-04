export const SPECTRUM_BAR_COUNT = 34;
const FFT_SIZE = 4096;
const MIN_DECIBELS = -85;
const MAX_DECIBELS = -20;

interface FrequencyBand {
  start: number;
  end: number;
}

function frequencyBands(sampleRate: number): FrequencyBand[] {
  const lowerFrequency = 45;
  const upperFrequency = Math.min(16000, sampleRate / 2);
  const binFrequency = sampleRate / FFT_SIZE;

  return Array.from({ length: SPECTRUM_BAR_COUNT }, (_, index) => {
    const lower = lowerFrequency * (upperFrequency / lowerFrequency) ** (index / SPECTRUM_BAR_COUNT);
    const upper = lowerFrequency * (upperFrequency / lowerFrequency) ** ((index + 1) / SPECTRUM_BAR_COUNT);
    const start = Math.max(1, Math.floor(lower / binFrequency));
    const end = Math.min(FFT_SIZE / 2, Math.max(start + 1, Math.ceil(upper / binFrequency)));
    return { start, end };
  });
}

/** Matches the approved live-spectrum comparison: logarithmic bands and 0 dB
 * visual sensitivity. Listening volume is applied on a separate audio branch. */
export class AudioSpectrum {
  readonly input: AnalyserNode;
  private readonly frequencies: Float32Array<ArrayBuffer>;
  private readonly bands: FrequencyBand[];

  constructor(context: AudioContext) {
    this.input = context.createAnalyser();
    this.input.fftSize = FFT_SIZE;
    // The view applies the chosen rise/fall response once, using elapsed time.
    this.input.smoothingTimeConstant = 0;
    this.frequencies = new Float32Array(this.input.frequencyBinCount);
    this.bands = frequencyBands(context.sampleRate);
  }

  read(levels: Float32Array): void {
    this.input.getFloatFrequencyData(this.frequencies);

    this.bands.forEach(({ start, end }, bandIndex) => {
      let maximum = -Infinity;
      for (let index = start; index < end; index++) {
        maximum = Math.max(maximum, this.frequencies[index]);
      }

      const level = (maximum - MIN_DECIBELS) / (MAX_DECIBELS - MIN_DECIBELS);
      levels[bandIndex] = Math.max(0, Math.min(1, level));
    });
  }
}
