import { propProfiles } from './propCatalog';
import type { Rectangle } from './propCatalog';
import { avatarOptions } from './protocol';
import type { AvatarConfig, AvatarSetting } from './protocol';

type Color = { label: string; rgb: readonly [number, number, number] };
type HairStyle = { label: string; image: 'hair' | 'bob' | 'buns'; rectangle: Rectangle };

export const hairStyles: Record<Exclude<AvatarConfig['hair'], 'none'>, HairStyle> = {
  compact: { label: 'Spiky', image: 'hair', rectangle: [126, 67, 260, 195] },
  bob: { label: 'Bob', image: 'bob', rectangle: [130, 68, 252, 277] },
  buns: { label: 'Twin buns', image: 'buns', rectangle: [91, 23, 330, 269] },
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
