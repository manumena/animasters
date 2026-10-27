export interface RoomSnapshot {
  code: string;
  hostId: string;
  phase: 'lobby';
  players: { id: string; nickname: string; connected: boolean }[];
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
): () => void {
  let stopped = false;
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout>;
  let heartbeat: ReturnType<typeof setInterval>;
  let attempts = 0;
  let lastPong = Date.now();

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
    const url = new URL(`${api}/rooms/${session.room.code}/connect`);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(url, ['animasters', `token.${session.token}`]);
    socket.onopen = () => {
      if (stopped) { socket?.close(); return; }
      attempts = 0;
      lastPong = Date.now();
      onStatus('Connected');
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

  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    clearInterval(heartbeat);
    socket?.close();
  };
}
