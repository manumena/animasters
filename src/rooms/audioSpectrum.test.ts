import { expect, it, vi } from 'vitest';
import { AudioSpectrum, SPECTRUM_BAR_COUNT } from './audioSpectrum';

it('distinguishes low and high frequencies and keeps silence at rest', () => {
  const frequencies = new Float32Array(2048).fill(-Infinity);
  const input = {
    fftSize: 0,
    frequencyBinCount: frequencies.length,
    smoothingTimeConstant: 0,
    getFloatFrequencyData: (target: Float32Array) => target.set(frequencies),
  };
  const context = {
    sampleRate: 44100,
    createAnalyser: vi.fn(() => input),
  } as unknown as AudioContext;
  const spectrum = new AudioSpectrum(context);
  const levels = new Float32Array(SPECTRUM_BAR_COUNT);

  spectrum.read(levels);
  expect([...levels]).toEqual(Array(SPECTRUM_BAR_COUNT).fill(0));

  // Inject energy at actual FFT bin frequencies rather than at display bars.
  frequencies[Math.round(100 / (44100 / 4096))] = -40;
  spectrum.read(levels);
  expect(Math.max(...levels.slice(0, 10))).toBeGreaterThan(0);
  expect(Math.max(...levels.slice(20))).toBe(0);

  frequencies.fill(-Infinity);
  frequencies[Math.round(8000 / (44100 / 4096))] = -20;
  spectrum.read(levels);
  expect(Math.max(...levels.slice(0, 10))).toBe(0);
  expect(Math.max(...levels.slice(20))).toBe(1);
});
