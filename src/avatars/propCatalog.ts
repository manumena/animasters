import type { AvatarConfig } from './protocol';

export type Rectangle = readonly [number, number, number, number];
export type Point = readonly [number, number];
export type PropId = Exclude<AvatarConfig['prop'], 'none'>;

type PropImage =
  | 'props' | 'headphones' | 'glasses' | 'scarf'
  | 'ash-cap' | 'urahara-hat' | 'dragon-ball-scouter'
  | 'kamina-glasses-armless' | 'kakashi-mask' | 'nezuko-bamboo';

// Quadratic contours store one bend handle per segment between adjacent points.
export type ContourCurve = { points: readonly Point[] } & (
  | { interpolation?: 's-curve' }
  | { interpolation: 'quadratic'; controls: readonly Point[] }
);

// The calibrated curves use sprite coordinates from 0 to 1.
export interface PropProfile {
  label: string;
  image: PropImage;
  rectangle: Rectangle;
  crop?: Rectangle;
  foreground: 0 | 1 | 'between';
  vertical?: boolean;
  tuckHair?: boolean;
  // Points are [along, across]. Vertical contours swap the axes.
  curves: readonly ContourCurve[];
}

export const propProfiles: Record<PropId, PropProfile> = {
  headphones: {
    label: 'Headphones',
    image: 'headphones',
    rectangle: [108, 70, 296, 244],
    foreground: 1,
    curves: [
      { points: [[0, 0.62], [0.2, 0.54], [0.24, 0.98], [0.5, 0.52]] },
      { points: [[0.5, 0.52], [0.75, 0.94], [0.82, 0.55], [1, 0.61]] },
    ],
  },
  straw: {
    label: 'Luffy’s straw hat',
    image: 'props',
    crop: [0, 0, 0.25, 0.42],
    rectangle: [103, 24, 306, 202],
    foreground: 0,
    tuckHair: true,
    curves: [
      { points: [[0, 0.94], [0.24, 0.79], [0.5, 0.74], [0.76, 0.79], [1, 0.94]] },
    ],
  },
  glasses: {
    label: 'Round glasses',
    image: 'glasses',
    rectangle: [124, 213, 264, 78],
    foreground: 'between',
    vertical: true,
    curves: [
      { points: [[0, 0.17], [0.5, 0.17], [1, 0.17]] },
      { points: [[0, 0.83], [0.5, 0.83], [1, 0.83]] },
    ],
  },
  scarf: {
    label: 'Red scarf',
    image: 'scarf',
    rectangle: [171, 300, 170, 154],
    foreground: 1,
    curves: [
      { points: [[0, 0.2], [0.25, 0.32], [0.5, 0.37], [0.75, 0.32], [1, 0.2]] },
    ],
  },
  leaf: {
    label: 'Leaf headband',
    image: 'props',
    crop: [0.25, 0, 0.25, 0.42],
    rectangle: [130, 133, 252, 145],
    foreground: 0,
    curves: [
      { points: [[0, 0.37], [0.17, 0.62], [0.51, 0.63], [0.85, 0.6], [1, 0.4]] },
    ],
  },
  chopper: {
    label: 'Chopper’s hat',
    image: 'props',
    crop: [0.5, 0, 0.25, 0.42],
    rectangle: [98, 13, 316, 216],
    foreground: 0,
    tuckHair: true,
    curves: [
      { points: [[0, 0.93], [0.26, 0.87], [0.5, 0.84], [0.75, 0.86], [1, 1]] },
    ],
  },
  // Calibrated fits and contours from the saved November 24 editor preset.
  'ash-cap': {
    label: 'Ash’s cap · Pokémon',
    image: 'ash-cap',
    rectangle: [136.12, 52.13500000000002, 239.76, 188.72999999999996],
    foreground: 0,
    tuckHair: true,
    curves: [
      {
        points: [[0, 0.94], [0.24, 0.81], [0.5, 0.78], [0.76, 0.82], [1, 0.94]],
        interpolation: 'quadratic',
        controls: [[0.12, 0.83], [0.36, 0.77], [0.63, 0.78], [0.88, 0.83]],
      },
    ],
  },
  'urahara-hat': {
    label: 'Urahara’s hat · Bleach',
    image: 'urahara-hat',
    rectangle: [98.08000000000006, 42.050000000000054, 315.8399999999999, 220.8999999999999],
    foreground: 0,
    tuckHair: true,
    curves: [
      {
        points: [[0, 0.82], [0.24, 0.72], [0.5, 0.64], [0.76, 0.72], [1, 0.84]],
        interpolation: 'quadratic',
        controls: [[0.12, 0.74], [0.37, 0.67], [0.63, 0.67], [0.87, 0.75]],
      },
    ],
  },
  'dragon-ball-scouter': {
    label: 'Saiyan scouter · Dragon Ball',
    image: 'dragon-ball-scouter',
    rectangle: [256.03999999999996, 214.5, 126.71999999999998, 63.99999999999994],
    foreground: 0,
    vertical: true,
    curves: [
      {
        points: [[0, 1], [0.24, 1], [0.49, 1], [0.73, 1], [1, 1]],
      },
    ],
  },
  'kamina-glasses': {
    label: 'Kamina’s glasses · Gurren Lagann',
    image: 'kamina-glasses-armless',
    rectangle: [115.4199999999999, 193.49499999999983, 281.16, 98.00999999999995],
    foreground: 'between',
    vertical: true,
    curves: [
      {
        points: [[0, 0], [0.5, 0.12], [1, 0.15]],
      },
      {
        points: [[0, 1], [0.5, 0.88], [1, 0.85]],
      },
    ],
  },
  'kakashi-mask': {
    label: 'Kakashi’s mask · Naruto',
    image: 'kakashi-mask',
    rectangle: [170.4999999999996, 253, 171, 113.25000000000003],
    foreground: 1,
    curves: [
      {
        points: [[0, 0.24], [0.05, 0.26], [0.5, 0.02], [0.95, 0.27], [1, 0.24]],
      },
    ],
  },
  'nezuko-bamboo': {
    label: 'Nezuko’s bamboo · Demon Slayer',
    image: 'nezuko-bamboo',
    rectangle: [165.27999999999963, 264.1199999999999, 181.44, 51.839999999999996],
    foreground: 1,
    curves: [
      {
        points: [[0, 0.22], [0.05, 0.28], [0.32, 0.06], [0.69, 0], [0.95, 0.29], [1, 0.2]],
      },
    ],
  },
};
