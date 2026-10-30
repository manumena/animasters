import type { GameAction, RoomSettings, RoomSnapshot } from './client';

export type SongTypeSetting =
  | 'includeOpenings'
  | 'includeEndings'
  | 'includeSoundtracks';

export function songTypes(settings: RoomSettings): string {
  const labels = [
    settings.includeOpenings && 'Openings',
    settings.includeEndings && 'Endings',
    settings.includeSoundtracks && 'Soundtracks',
  ].filter(Boolean);
  return labels.length ? labels.join(' · ') : 'All song types';
}

function sameSettings(first: RoomSettings, second: RoomSettings): boolean {
  return (
    first.amount === second.amount &&
    first.repeatAnimes === second.repeatAnimes &&
    first.includeOpenings === second.includeOpenings &&
    first.includeEndings === second.includeEndings &&
    first.includeSoundtracks === second.includeSoundtracks
  );
}

export interface PreferencesSnapshot {
  draft?: RoomSettings;
  amount: string;
  valid: boolean;
  editable: boolean;
  blocked: boolean;
  status: string;
  error: string;
}

/** One controller per room connection, not per preferences screen. It keeps
 * edits alive when returning to the lobby and serializes saves against the
 * server's revision. Only a matching snapshot confirms that a save succeeded. */
export class RoomPreferencesController {
  private room: RoomSnapshot;
  private draft?: RoomSettings;
  private amount: string;
  private connected = false;
  private needsSnapshot = true;
  private pending?: Extract<GameAction, { type: 'settings' }>;
  private debounce?: ReturnType<typeof setTimeout>;
  private confirmation?: ReturnType<typeof setTimeout>;
  private error = '';
  private snapshot: PreferencesSnapshot;
  private listeners = new Set<() => void>();

  constructor(
    room: RoomSnapshot,
    private playerId: string,
    private send: (action: GameAction) => boolean,
  ) {
    this.room = room;
    this.draft = room.settings;
    this.amount = room.settings ? String(room.settings.amount) : '';
    this.snapshot = this.describe();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private validCount() {
    const count = Number(this.amount);
    return (
      this.amount.trim() !== '' &&
      Number.isInteger(count) &&
      count >= 1 &&
      count <= 999
    );
  }

  private changed() {
    if (!this.draft || !this.room.settings) return false;
    return (
      !this.validCount() ||
      !sameSettings(
        { ...this.draft, amount: Number(this.amount) },
        this.room.settings,
      )
    );
  }

  private describe(): PreferencesSnapshot {
    const host = this.room.hostId === this.playerId;
    const isReady = Boolean(
      this.room.players.find((player) => player.id === this.playerId)?.ready,
    );
    const betweenMatches =
      this.room.phase === 'lobby' || this.room.phase === 'completed';
    const waiting = !this.connected || this.needsSnapshot;
    const valid = this.validCount();
    const changed = this.changed();
    const saving = Boolean(this.pending || this.debounce || changed);
    const status = !this.draft
      ? 'Loading preferences…'
      : this.error
        ? 'Changes not saved'
        : waiting
          ? 'Waiting for connection…'
          : !valid
            ? 'Enter a whole number from 1 to 999.'
            : saving
              ? 'Saving…'
              : 'Saved';

    return {
      draft: this.draft,
      amount: this.amount,
      valid,
      editable:
        host && !waiting && !isReady && betweenMatches && Boolean(this.draft),
      blocked: host && (saving || !valid || Boolean(this.error) || waiting),
      status,
      error: this.error,
    };
  }

  private publish() {
    this.snapshot = this.describe();
    this.listeners.forEach((listener) => listener());
  }

  setConnection = (connected: boolean) => {
    this.connected = connected;
    if (!connected) {
      this.needsSnapshot = true;
      clearTimeout(this.confirmation);
    }
    this.publish();
  };

  receive = (room: RoomSnapshot) => {
    const previousRevision = this.room.settingsRevision ?? 0;
    const revision = room.settingsRevision ?? 0;
    const reconnecting = this.needsSnapshot;
    const hadEdits = Boolean(this.pending || this.debounce || this.changed());
    const acknowledged = Boolean(
      this.pending &&
        room.settings &&
        sameSettings(this.pending.settings, room.settings),
    );
    this.room = room;
    this.needsSnapshot = false;

    if (acknowledged) {
      this.pending = undefined;
      clearTimeout(this.confirmation);
      this.error = '';
    } else if (revision !== previousRevision || !this.draft) {
      // Another tab changed the settings. Adopt the authoritative version
      // instead of silently overwriting it with a stale local draft.
      this.pending = undefined;
      clearTimeout(this.confirmation);
      clearTimeout(this.debounce);
      this.debounce = undefined;
      this.draft = room.settings;
      this.amount = room.settings ? String(room.settings.amount) : '';
      this.error = hadEdits
        ? 'Settings changed elsewhere. Review the latest preferences.'
        : '';
    } else if (reconnecting && this.pending) {
      // A fresh snapshot settles an uncertain disconnect before resending.
      this.pending = undefined;
    }

    if (!this.pending && !this.changed() && room.settings)
      this.draft = room.settings;
    this.publish();
    this.flush();
  };

  changeAmount = (amount: string, immediate = false) => {
    if (!this.snapshot.editable) return;
    this.amount = amount;
    this.error = '';
    clearTimeout(this.debounce);
    this.debounce = undefined;
    // Presets are complete choices; they can save without a typing delay.
    if (immediate) {
      this.flush();
      this.publish();
      return;
    }
    this.debounce = setTimeout(() => {
      this.debounce = undefined;
      this.flush();
      this.publish();
    }, 450);
    this.publish();
  };

  changeType = (field: SongTypeSetting, checked: boolean) => {
    if (!this.snapshot.editable || !this.draft) return;
    this.draft = { ...this.draft, [field]: checked };
    this.error = '';
    // A toggle sends immediately unless a count is still being typed or a
    // previous save awaits acknowledgement. Subsequent edits remain queued.
    this.flush();
    this.publish();
  };

  private flush() {
    if (
      !this.describe().editable ||
      this.pending ||
      this.debounce ||
      this.error ||
      !this.validCount() ||
      !this.changed() ||
      !this.draft
    )
      return;
    this.pending = {
      type: 'settings',
      settings: { ...this.draft, amount: Number(this.amount) },
      settingsRevision: this.room.settingsRevision ?? 0,
    };
    this.transmit();
  }

  private transmit() {
    if (!this.pending) return;
    if (!this.send(this.pending)) {
      this.reject('Could not send preferences. Reconnect and retry.');
      return;
    }
    clearTimeout(this.confirmation);
    this.confirmation = setTimeout(() => {
      this.error = 'Could not confirm your changes. Retry when connected.';
      this.publish();
    }, 8000);
    this.publish();
  }

  reject = (message: string) => {
    if (!this.pending) return;
    this.pending = undefined;
    clearTimeout(this.confirmation);
    this.error = message;
    this.publish();
  };

  retry = () => {
    if (!this.connected || this.needsSnapshot) return;
    this.error = '';
    // Repeating an unconfirmed payload is safe: the server treats an already
    // applied setting as a no-op, without resetting readiness again.
    if (this.pending) this.transmit();
    else this.flush();
    this.publish();
  };

  dispose = () => {
    clearTimeout(this.debounce);
    clearTimeout(this.confirmation);
    this.debounce = undefined;
  };
}
