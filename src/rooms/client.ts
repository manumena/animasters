export interface RoomSettings {
  amount: number;
  repeatAnimes: boolean;
  includeOpenings: boolean;
  includeEndings: boolean;
  includeSoundtracks: boolean;
}

export interface RoundSnapshot {
  id: string;
  number: number;
  total: number;
  audioUrl: string;
  startsAt?: number;
  deadline?: number;
}
export interface RoomSnapshot {
  code: string;
  hostId: string;
  phase: 'lobby' | 'preparing' | 'countdown' | 'guessing' | 'paused' | 'completed';
  catalogVersion?: string;
  settings?: RoomSettings;
  settingsRevision?: number;
  players: { id: string; nickname: string; connected: boolean; ready?: boolean; score?: number; submitted?: boolean }[];
  round?: RoundSnapshot;
  submission?: { actionId: string; animeId: number | null };
  result?: {
    roundId: string; number: number; anime: string; name: string;
    players: { id: string; guess: string | null; points: number; correct: boolean }[];
  };
  error?: string;
}
export type GameAction =
  | { type: 'ready'; catalogVersion?: string; roundId?: string; settingsRevision?: number }
  | { type: 'ready-next-match'; completedRoundId: string; catalogVersion?: string; settingsRevision: number }
  | { type: 'unready' }
  | { type: 'settings'; settings: RoomSettings; settingsRevision: number }
  | { type: 'guess'; roundId: string; actionId: string; animeId: number | null };
export interface GameCallbacks {
  onSender?: (send: (action: GameAction) => boolean) => void;
  onClock?: (serverMinusPerformance: number) => void;
  onError?: (error: string) => void;
}
export interface RoomSession {
  room: RoomSnapshot;
  playerId: string;
  token: string;
}

const api = (import.meta.env.VITE_API_URL ?? 'https://match-generator.manuelmena19938676.workers.dev').replace(/\/$/, '');
const key = (code: string) => `animasters.room.${code}`;

export function normalizeRoomCode(value: string): string {
  // Filter before uppercasing so non-ASCII letters cannot expand into valid codes.
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
}

export function savedSession(code: string): RoomSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(code)) ?? 'null') as RoomSession | null;
    return value?.room.code === code && typeof value.token === 'string' && typeof value.playerId === 'string' ? value : null;
  } catch { return null; }
}

export function forgetSession(code: string): void {
  localStorage.removeItem(key(code));
}

export async function enterRoom(nickname: string, code?: string): Promise<RoomSession> {
  // Fail before creating a player if the browser cannot preserve its credential.
  const probe = 'animasters.storage-check';
  try { localStorage.setItem(probe, '1'); localStorage.removeItem(probe); }
  catch { throw new Error('Allow browser storage to create or join a room.'); }
  const response = await fetch(`${api}/rooms${code ? `/${code}/join` : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: nickname.trim() }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Unable to enter the room.');
  localStorage.setItem(key(result.room.code), JSON.stringify(result));
  return result as RoomSession;
}

/** Reconnect with a private header credential, never the shareable room code alone. */
export function watchRoom(
  session: RoomSession,
  onRoom: (room: RoomSnapshot) => void,
  onStatus: (status: string) => void,
  callbacks: GameCallbacks = {},
): () => void {
  let stopped = false;
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout>;
  let heartbeat: ReturnType<typeof setInterval>;
  let attempts = 0;
  let lastPong = Date.now();
  let bestRoundTrip = Infinity;
  const probes: ReturnType<typeof setTimeout>[] = [];
  const probeClock = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ v: 1, type: 'clock', sentAt: performance.now() }));
    }
  };
  callbacks.onSender?.(action => {
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ v: 1, ...action }));
    return true;
  });

  async function connect() {
    if (stopped) return;
    onStatus('Connecting…');
    // A failed WebSocket handshake hides its HTTP status from browsers. Check the
    // saved membership first so expiry and invalid credentials can be explained.
    try {
      const response = await fetch(`${api}/rooms/${session.room.code}/session`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (stopped) return;
      if (response.status === 401 || response.status === 404) {
        forgetSession(session.room.code);
        onStatus('This room expired or your saved player is no longer valid. Return to room entry.');
        return;
      }
      if (!response.ok) throw new Error('Room unavailable');
    } catch {
      scheduleRetry();
      return;
    }
    // LAN development uses a relative /api proxy on the current HTTPS origin.
    const url = new URL(`${api}/rooms/${session.room.code}/connect`, window.location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(url, ['animasters', `token.${session.token}`]);
    socket.onopen = () => {
      if (stopped) { socket?.close(); return; }
      attempts = 0;
      lastPong = Date.now();
      onStatus('Connected');
      bestRoundTrip = Infinity;
      for (let sample = 0; sample < 5; sample++) probes.push(setTimeout(probeClock, sample * 150));
      // Server-side automatic pong replies remain compatible with hibernation.
      heartbeat = setInterval(() => {
        if (Date.now() - lastPong > 60_000) socket?.close();
        else if (socket?.readyState === WebSocket.OPEN) socket.send('ping');
      }, 20_000);
    };
    socket.onmessage = event => {
      if (stopped) return;
      if (event.data === 'pong') { lastPong = Date.now(); return; }
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'snapshot') onRoom(message.room);
        if (message.type === 'error') callbacks.onError?.(message.error);
        if (message.type === 'clock') {
          const received = performance.now();
          const roundTrip = received - message.sentAt;
          if (roundTrip >= 0 && roundTrip < bestRoundTrip) {
            bestRoundTrip = roundTrip;
            callbacks.onClock?.(message.serverTime - (message.sentAt + received) / 2);
          }
        }
      } catch { socket?.close(1002, 'Invalid message'); }
    };
    socket.onclose = event => {
      clearInterval(heartbeat);
      if (stopped) return;
      if (event.code === 4001) {
        onStatus('This player connected in another tab.');
        return;
      }
      scheduleRetry();
    };
  }

  function scheduleRetry() {
    if (stopped) return;
    // Bound automatic retries without automatically creating another membership.
    if (++attempts > 6) {
      onStatus('Unable to reconnect. Return to room entry to try again.');
      return;
    }
    onStatus('Connection lost. Reconnecting…');
    retry = setTimeout(connect, Math.min(1000 * 2 ** (attempts - 1), 15_000));
  }

  const refreshClock = () => {
    bestRoundTrip = Infinity;
    probeClock();
  };
  window.addEventListener('pageshow', refreshClock);
  document.addEventListener('visibilitychange', refreshClock);
  connect();
  return () => {
    stopped = true;
    window.removeEventListener('pageshow', refreshClock);
    document.removeEventListener('visibilitychange', refreshClock);
    probes.forEach(clearTimeout);
    clearTimeout(retry);
    clearInterval(heartbeat);
    socket?.close();
  };
}
