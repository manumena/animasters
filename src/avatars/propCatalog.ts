import type { AvatarConfig } from './protocol';

export type Rectangle = readonly [number, number, number, number];
export type Point = readonly [number, number];
export type PropId = Exclude<AvatarConfig['prop'], 'none'>;

// The calibrated curves use sprite coordinates from 0 to 1.
export interface PropProfile {
  label: string;
  image: 'props' | 'headphones' | 'glasses' | 'scarf';
  rectangle: Rectangle;
  crop?: Rectangle;
  foreground: 0 | 1 | 'between';
  vertical?: boolean;
  tuckHair?: boolean;
  // Points are [along, across]. Vertical contours swap the axes.
  curves: readonly { points: readonly Point[] }[];
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
};
