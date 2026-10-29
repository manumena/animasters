/** The approved decorative spectrum. It never loads or analyses audio. */
export const HOME_SPECTRUM_SETTINGS = {
  tempo: 130,
  independence: 65,
  fallingTime: 280,
  flicker: 25,
  riseTime: 22,
  strength: 1.08,
  bandWidth: 0.82,
} as const;

const BAR_COUNT = 21;
const BASE_TEMPO = 96;
const PHRASE_SECONDS = 10;
const BEAT_SECONDS = 0.625;

// Broad musical events link neighboring bars. This is the same invented phrase
// used in the approved sketch, with individual accents layered underneath.
const musicalEvents = [
  ...[0, 1.25, 2.5, 3.125, 4.375, 5, 6.25, 7.5, 8.125, 9.375].map((time, index) => ({
    time,
    center: 0.14 + (index % 3) * 0.025,
    width: 0.15,
    level: index % 3 === 0 ? 0.88 : 0.61,
    decay: 0.22,
  })),
  ...[0.15, 1.6, 2.9, 4.4, 5.2, 6.7, 8.1, 9.3].map((time, index) => ({
    time,
    center: [0.43, 0.57, 0.48, 0.64][index % 4],
    width: 0.18,
    level: 0.55 + (index % 3) * 0.1,
    decay: 0.45,
  })),
  ...[0.625, 1.875, 3.125, 4.375, 5.625, 6.875, 8.125, 9.375].map((time, index) => ({
    time,
    center: 0.8 + (index % 2) * 0.04,
    width: 0.11,
    level: index % 2 ? 0.46 : 0.3,
    decay: 0.12,
  })),
];

function seededValue(bar: number, beat: number, salt: number): number {
  const wrappedBeat = ((beat % 16) + 16) % 16;
  const value = Math.sin((bar + 1) * 127.1 + wrappedBeat * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function localAccentAt(time: number, bar: number): number {
  const currentBeat = Math.floor(time / BEAT_SECONDS);
  let energy = 0;

  // Retain recent tails so a skipped beat does not snap the bar to zero.
  for (let offset = 0; offset < 4; offset++) {
    const beat = currentBeat - offset;
    if (seededValue(bar, beat, 1) < 0.25) continue;

    const delay = seededValue(bar, beat, 2) * 0.12;
    const age = time - beat * BEAT_SECONDS - delay;
    if (age < 0) continue;

    const level = 0.25 + seededValue(bar, beat, 3) * 0.75;
    const decay = 0.16 + seededValue(bar, beat, 4) * 0.2;
    energy += level * (1 - Math.exp(-age / 0.018)) * Math.exp(-age / decay);
  }
  return energy;
}

function spectrumAt(time: number): number[] {
  const accents = Array.from({ length: BAR_COUNT }, (_, index) => localAccentAt(time, index));
  const independence = HOME_SPECTRUM_SETTINGS.independence / 100;

  return accents.map((accent, index) => {
    const position = index / (BAR_COUNT - 1);
    let energy = 0.06;

    for (const event of musicalEvents) {
      const age = ((time - event.time) % PHRASE_SECONDS + PHRASE_SECONDS) % PHRASE_SECONDS;
      const onset = 1 - Math.exp(-age / 0.018);
      const envelope = onset * Math.exp(-age / event.decay);
      const distance = (position - event.center) / (event.width * HOME_SPECTRUM_SETTINGS.bandWidth);
      energy += envelope * event.level * Math.exp(-0.5 * distance * distance);
    }

    // Local accents mostly belong to their own bar, with a little neighbor influence.
    const left = accents[Math.max(0, index - 1)];
    const right = accents[Math.min(BAR_COUNT - 1, index + 1)];
    const localEnergy = accent * 0.7 + (left + right) * 0.15;
    const combined = energy * (1 - independence * 0.4) + localEnergy * independence * 0.95;
    return Math.min(0.96, 0.04 + combined * HOME_SPECTRUM_SETTINGS.strength);
  });
}

function heightTexture(index: number, motionTime: number): number {
  // Smoothly interpolate seeded variation on a real-time clock, independent of BPM.
  const position = motionTime * 14;
  const frame = Math.floor(position);
  const fraction = position - frame;
  const blend = fraction * fraction * (3 - 2 * fraction);

  function noiseFor(bar: number): number {
    const previous = seededValue(bar, frame, 25);
    const next = seededValue(bar, frame + 1, 25);
    return previous + (next - previous) * blend;
  }

  const own = noiseFor(index);
  const left = noiseFor(Math.max(0, index - 1));
  const right = noiseFor(Math.min(BAR_COUNT - 1, index + 1));
  return 2 * (own * 0.72 + (left + right) * 0.14) - 1;
}

/** Each mounted preview owns its clock; stopping frames freezes it without a jump. */
export function createHomeSpectrum() {
  let songTime = 0.2;
  let motionTime = 0;
  let levels = spectrumAt(songTime);

  function sample(): number[] {
    return levels.map((level, index) => {
      const modulation = 1 + HOME_SPECTRUM_SETTINGS.flicker / 100 * heightTexture(index, motionTime);
      return Math.max(0.04, Math.min(0.96, level * modulation));
    });
  }

  function advance(deltaSeconds: number): number[] {
    // Match the sketch's bounded step, avoiding a catch-up burst after a stalled frame.
    const elapsed = Math.max(0, Math.min(deltaSeconds, 0.05));
    motionTime += elapsed;
    songTime = (songTime + elapsed * HOME_SPECTRUM_SETTINGS.tempo / BASE_TEMPO) % PHRASE_SECONDS;
    const targets = spectrumAt(songTime);

    levels = levels.map((level, index) => {
      // Falling time is the duration to close 90% of a drop to a fixed target.
      const milliseconds = targets[index] > level
        ? HOME_SPECTRUM_SETTINGS.riseTime
        : HOME_SPECTRUM_SETTINGS.fallingTime / Math.LN10;
      const blend = 1 - Math.exp(-elapsed / (milliseconds / 1000));
      return level + (targets[index] - level) * blend;
    });

    return sample();
  }

  return { sample, advance };
}
