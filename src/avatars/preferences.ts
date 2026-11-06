import { avatarSettings, isAvatarOption, readAvatar } from './protocol';
import type { AvatarConfig } from './protocol';

const storageKey = 'animasters.avatar.v1';

export const defaultAvatar: AvatarConfig = {
  version: 1,
  hair: 'compact',
  hairColor: 'charcoal',
  skin: 'warm',
  eyes: 'oval',
  expression: 'smile',
  prop: 'none',
};

export function loadSavedAvatar(): AvatarConfig {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return defaultAvatar;

    const input: unknown = JSON.parse(stored);
    if (!input || typeof input !== 'object' || !('version' in input) || input.version !== 1) return defaultAvatar;

    // Restore usable choices even if a saved option is missing or obsolete.
    const fields = input as Record<string, unknown>;
    const choices = Object.fromEntries(avatarSettings.map(setting => {
      const choice = fields[setting];
      return [setting, isAvatarOption(setting, choice) ? choice : defaultAvatar[setting]];
    }));
    return readAvatar({ version: 1, ...choices }) ?? defaultAvatar;
  } catch {
    return defaultAvatar;
  }
}

export function saveAvatar(avatar: AvatarConfig) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(avatar));
  } catch {
    // The current look still works when this browser disables local storage.
  }
}
