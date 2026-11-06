// Keep these versioned IDs in sync with the Animasters avatar protocol.
export const avatarOptions = {
  hair: ['compact', 'bob', 'buns', 'none'],
  hairColor: ['charcoal', 'chestnut', 'copper', 'blonde', 'silver', 'teal', 'blue', 'pink'],
  skin: ['light', 'warm', 'brown', 'deep', 'mint', 'sky', 'lilac', 'rose'],
  eyes: ['oval', 'round', 'almond'],
  expression: ['smile', 'neutral', 'laugh', 'angry', 'sleepy', 'surprised'],
  prop: ['none', 'straw', 'leaf', 'chopper', 'headphones', 'glasses', 'scarf'],
} as const;

export type AvatarSetting = keyof typeof avatarOptions;
export type AvatarConfig = { version: 1 } & {
  [Setting in AvatarSetting]: (typeof avatarOptions)[Setting][number];
};

export const avatarSettings = Object.keys(avatarOptions) as AvatarSetting[];

export function isAvatarOption<Setting extends AvatarSetting>(setting: Setting, value: unknown): value is AvatarConfig[Setting] {
  return (avatarOptions[setting] as readonly unknown[]).includes(value);
}

export function readAvatar(value: unknown): AvatarConfig | undefined {
  if (!value || typeof value !== 'object') return;
  const input = value as Record<string, unknown>;
  if (input.version !== 1 || !avatarSettings.every(setting => isAvatarOption(setting, input[setting]))) return;

  // Persist and publish only the validated catalog IDs.
  const choices = Object.fromEntries(avatarSettings.map(setting => [setting, input[setting]]));
  return { version: 1, ...choices } as AvatarConfig;
}
