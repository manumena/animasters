import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BAR_COUNT,
  FFT_SIZE,
  FRAME_RATE,
  createSpectrumProcessor,
  frequencyBands,
  normalizedLevel,
  precomputeSpectrum,
  rmsDecibels,
  storedLevels,
} from './audio-analysis.mjs';

const sampleRate = 44100;

function tone(frequency, length, amplitude = 1) {
  return Float32Array.from({ length }, (_, index) => {
    return amplitude * Math.sin(2 * Math.PI * frequency * index / sampleRate);
  });
}

test('silence produces resting bars and finite interpolated heights', () => {
  const frames = precomputeSpectrum(new Float32Array(sampleRate), sampleRate);
  for (const seconds of [0, 0.025, 0.5, 1, 500]) {
    assert.deepEqual(storedLevels(frames, seconds), Array(BAR_COUNT).fill(0));
  }
  assert.equal(rmsDecibels(new Float32Array(FFT_SIZE)), -Infinity);
});

test('FFT locates a known tone and follows Web Audio window amplitude scaling', () => {
  const bin = 100;
  const frequency = bin * sampleRate / FFT_SIZE;
  const samples = tone(frequency, FFT_SIZE);
  const result = createSpectrumProcessor(sampleRate)(samples, samples.length);
  const expectedBand = frequencyBands(sampleRate).findIndex(({ start, end }) => start <= bin && end > bin);
  const loudestBand = result.indexOf(Math.max(...result));
  assert.equal(loudestBand, expectedBand);

  // A unit sine's positive-frequency magnitude is 0.5, multiplied by the
  // Blackman window's mean of 0.42: 20 log10(0.21) = about -13.56 dB.
  assert.ok(Math.abs(result[loudestBand] - 20 * Math.log10(0.21)) < 0.01);
});

test('RMS responds to actual amplitude rather than the display profile', () => {
  const samples = tone(sampleRate / 100, 1000, 0.5);
  assert.ok(Math.abs(rmsDecibels(samples) - 20 * Math.log10(0.5 / Math.sqrt(2))) < 0.001);
  assert.equal(normalizedLevel(-Infinity, 15), 0);
  assert.equal(normalizedLevel(-20), 1);
});

test('stored frames follow time and seeking across silence and a tone', () => {
  const samples = new Float32Array(sampleRate * 2);
  samples.set(tone(1000, sampleRate, 0.3), sampleRate);
  const frames = precomputeSpectrum(samples, sampleRate);

  assert.equal(frames.length, (FRAME_RATE * 2 + 1) * BAR_COUNT);
  assert.equal(Math.max(...storedLevels(frames, 0.5)), 0);
  assert.ok(Math.max(...storedLevels(frames, 1.5)) > 0.8);
  assert.equal(Math.max(...storedLevels(frames, 0.5)), 0);
});
