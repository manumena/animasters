import { propProfiles } from './propCatalog';
import type { Point, Rectangle } from './propCatalog';
import { avatarOptions } from './protocol';
import type { AvatarConfig, AvatarSetting } from './protocol';

type Color = { label: string; rgb: readonly [number, number, number] };
export type HairId = Exclude<AvatarConfig['hair'], 'none'>;
type HairImage =
  | 'hair' | 'bob' | 'buns'
  | 'curtains' | 'swept-undercut' | 'rounded-curls' | 'high-ponytail' | 'twin-tails' | 'long-layers';

export interface HairStyle {
  label: string;
  image: HairImage;
  rectangle: Rectangle;
  depth?: {
    // The normalized, closed outline follows visible foreground locks.
    frontOutline: {
      start: Point;
      segments: readonly { to: Point; control?: Point }[];
    };
  };
}

export const hairStyles: Record<HairId, HairStyle> = {
  compact: { label: 'Spiky', image: 'hair', rectangle: [126, 67, 260, 195] },
  bob: { label: 'Bob', image: 'bob', rectangle: [130, 68, 252, 277] },
  buns: { label: 'Twin buns', image: 'buns', rectangle: [91, 23, 330, 269] },
  // Owner-calibrated November 25 fits, preserved from the exported editor config.
  curtains: {
    label: 'Curtains', image: 'curtains',
    rectangle: [120.99999999999989, 69.00000000000004, 270, 169.3006993006993],
  },
  'swept-undercut': {
    label: 'Swept undercut', image: 'swept-undercut',
    rectangle: [133, 60, 270, 204.09448818897638],
  },
  'rounded-curls': {
    label: 'Rounded curls', image: 'rounded-curls',
    rectangle: [97, 58.75389755011136, 318, 264.173719376392],
  },
  'high-ponytail': {
    label: 'High ponytail', image: 'high-ponytail',
    rectangle: [137, 10, 300, 264.8780487804878],
  },
  'twin-tails': {
    label: 'Twin tails', image: 'twin-tails',
    rectangle: [86, 85, 340, 286.875],
  },
  'long-layers': {
    label: 'Long layers', image: 'long-layers',
    rectangle: [97.82500000000019, 87, 316.35, 314.77219451371576],
    depth: {
      frontOutline: {
        start: [0, 0],
        segments: [
          { to: [1, 0] },
          { to: [1, 0.49] },
          { control: [0.98, 0.65], to: [0.87, 0.78] },
          { control: [0.81, 0.84], to: [0.74, 0.83] },
          { control: [0.71, 0.85], to: [0.69, 0.84] },
          { control: [0.66, 0.84], to: [0.68, 0.81] },
          { control: [0.74, 0.74], to: [0.73, 0.62] },
          { control: [0.76, 0.55], to: [0.73, 0.47] },
          { to: [0.27, 0.47] },
          { control: [0.24, 0.55], to: [0.27, 0.62] },
          { control: [0.26, 0.74], to: [0.32, 0.81] },
          { control: [0.34, 0.84], to: [0.31, 0.84] },
          { control: [0.29, 0.85], to: [0.26, 0.83] },
          { control: [0.19, 0.84], to: [0.13, 0.78] },
          { control: [0.02, 0.65], to: [0, 0.49] },
        ],
      },
    },
  },
};

export const palettes: { [Setting in 'hairColor' | 'skin']: Record<AvatarConfig[Setting], Color> } = {
  hairColor: {
    charcoal: { label: 'Charcoal', rgb: [58, 57, 64] },
    chestnut: { label: 'Chestnut', rgb: [103, 64, 48] },
    copper: { label: 'Copper', rgb: [172, 78, 43] },
    blonde: { label: 'Honey blonde', rgb: [193, 143, 75] },
    silver: { label: 'Silver', rgb: [166, 174, 188] },
    teal: { label: 'Teal', rgb: [27, 143, 149] },
    blue: { label: 'Cobalt', rgb: [61, 101, 209] },
    pink: { label: 'Bubblegum', rgb: [221, 105, 161] },
  },
  skin: {
    light: { label: 'Fair', rgb: [247, 203, 173] },
    warm: { label: 'Warm peach', rgb: [238, 175, 128] },
    brown: { label: 'Golden brown', rgb: [175, 112, 78] },
    deep: { label: 'Deep brown', rgb: [113, 69, 55] },
    mint: { label: 'Mint green', rgb: [102, 194, 149] },
    sky: { label: 'Sky blue', rgb: [105, 179, 230] },
    lilac: { label: 'Lilac', rgb: [176, 144, 222] },
    rose: { label: 'Rose pink', rgb: [229, 133, 161] },
  },
};

const eyeLabels: Record<AvatarConfig['eyes'], string> = {
  oval: 'Oval',
  round: 'Round with iris',
  almond: 'Almond',
};

const expressionLabels: Record<AvatarConfig['expression'], string> = {
  smile: 'Smile',
  neutral: 'Neutral',
  laugh: 'Laugh',
  angry: 'Angry',
  sleepy: 'Sleepy',
  surprised: 'Surprised',
};

export function avatarOptionLabel(avatar: AvatarConfig, setting: AvatarSetting): string {
  switch (setting) {
    case 'hair': return avatar.hair === 'none' ? 'Bald' : hairStyles[avatar.hair].label;
    case 'hairColor': return palettes.hairColor[avatar.hairColor].label;
    case 'skin': return palettes.skin[avatar.skin].label;
    case 'eyes': return eyeLabels[avatar.eyes];
    case 'expression': return expressionLabels[avatar.expression];
    case 'prop': return avatar.prop === 'none' ? 'None' : propProfiles[avatar.prop].label;
  }
}

export function cycleAvatar(avatar: AvatarConfig, setting: AvatarSetting, direction: -1 | 1): AvatarConfig {
  const options: readonly string[] = avatarOptions[setting];
  const current = options.indexOf(avatar[setting]);
  const next = (current + direction + options.length) % options.length;
  return { ...avatar, [setting]: options[next] };
}
