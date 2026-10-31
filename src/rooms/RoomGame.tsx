import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Box, Button, Typography } from '@mui/material';
import { CatalogClient } from '../catalog/client';
import { watchRoom, type GameAction, type RoomSession } from './client';
import { RoomAudio } from './audio';
import RoomLobby from './RoomLobby';
import { RoomPreferencesController } from './preferences';
import RoomMatch from './RoomMatch';

export default function RoomGame({
  session,
  onBack,
}: {
  session: RoomSession;
  onBack: () => void;
}) {
  const [room, setRoom] = useState(session.room);
  const [status, setStatus] = useState('Connecting…');
  const [error, setError] = useState('');
  const [readyBusy, setReadyBusy] = useState(false);
  const [clockReady, setClockReady] = useState(false);
  const [now, setNow] = useState(0);
  const [audio] = useState(() => new RoomAudio());
  const clock = useRef<number | undefined>(undefined);
  const send = useRef<(action: GameAction) => boolean>(() => false);
  const [preferences] = useState(
    () =>
      new RoomPreferencesController(
        session.room,
        session.playerId,
        (action) => {
          setError('');
          return send.current(action);
        },
      ),
  );
  const preferencesState = useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
  );
  const pending = useRef<GameAction | undefined>(undefined);
  const [pendingGuess, setPendingGuess] = useState(false);
  const serverNow = useMemo(
    () => () => performance.now() + (clock.current ?? 0),
    [],
  );

  // Each room pins its catalog revision. Navigation to the standalone catalog
  // cannot switch this game's accepted answers midway through a match.
  const catalog = useMemo(
    () =>
      new CatalogClient(
        () =>
          new Worker(new URL('../catalog/catalog.worker.ts', import.meta.url), {
            type: 'module',
          }),
        room.catalogVersion,
      ),
    [room.catalogVersion],
  );
  const catalogState = useSyncExternalStore(
    catalog.subscribe,
    catalog.getSnapshot,
  );

  useEffect(() => {
    if (room.catalogVersion) catalog.start();
    return () => catalog.dispose();
  }, [catalog, room.catalogVersion]);
  useEffect(() => () => audio.dispose(), [audio]);
  useEffect(() => {
    const timer = setInterval(() => setNow(serverNow()), 100);
    return () => clearInterval(timer);
  }, [serverNow]);

  useEffect(() => {
    const stop = watchRoom(
      session,
      (snapshot) => {
        preferences.receive(snapshot);
        setRoom(snapshot);
        const action = pending.current;
        if (
          action?.type === 'guess' &&
          (snapshot.submission?.actionId === action.actionId ||
            snapshot.round?.id !== action.roundId)
        ) {
          pending.current = undefined;
          setPendingGuess(false);
        }
      },
      (value) => {
        setStatus(value);
        preferences.setConnection(value === 'Connected');
        if (value === 'Connected' && pending.current)
          send.current(pending.current);
      },
      {
        onSender: (sender) => {
          send.current = sender;
        },
        onClock: (offset) => {
          clock.current = offset;
          setClockReady(true);
          setNow(performance.now() + offset);
        },
        onError: (message) => {
          setError(message);
          preferences.reject(message);
          pending.current = undefined;
          setPendingGuess(false);
        },
      },
    );
    return () => {
      stop();
      preferences.dispose();
    };
  }, [session, preferences]);

  useEffect(() => {
    if (room.phase === 'completed') audio.pause();
    if (room.phase === 'paused') audio.cancelScheduled();
    if (room.round && clockReady) void audio.prepare(room.round, serverNow);
  }, [audio, room.round, room.phase, clockReady, serverNow]);

  const me = room.players.find((player) => player.id === session.playerId);
  const connected = status === 'Connected';
  const ready = connected && clockReady && catalogState.phase === 'ready';
  const round = room.round;
  const guessing = Boolean(
    round &&
      (room.phase === 'guessing' ||
        (room.phase === 'countdown' && now >= (round.startsAt ?? Infinity))),
  );
  const deadline =
    round?.deadline ?? (round?.startsAt ? round.startsAt + 90_000 : Infinity);
  const canGuess =
    ready && guessing && now < deadline && !room.submission && !pendingGuess;
  const isReady = Boolean(me?.ready);

  async function becomeReady() {
    const betweenMatches = room.phase === 'lobby' || room.phase === 'completed';
    if (readyBusy || (betweenMatches && preferences.getSnapshot().blocked))
      return;
    setReadyBusy(true);
    setError('');
    try {
      await audio.enable();
      // Audio activation is asynchronous. Do not ready an old draft if the host
      // changed preferences while the browser was enabling playback.
      if (betweenMatches && preferences.getSnapshot().blocked) return;
      // Rematch readiness is tied to the final result, separate from round Ready.
      // A delayed click from an earlier match cannot start another one.
      const action: GameAction =
        room.phase === 'completed' && room.result
          ? {
              type: 'ready-next-match',
              completedRoundId: room.result.roundId,
              catalogVersion: room.catalogVersion,
              settingsRevision: room.settingsRevision ?? 0,
            }
          : {
              type: 'ready',
              catalogVersion: room.catalogVersion,
              roundId: round?.id,
              settingsRevision: room.settingsRevision ?? 0,
            };
      if (!send.current(action)) {
        setError('Reconnect before becoming ready.');
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Audio could not be enabled.',
      );
    } finally {
      setReadyBusy(false);
    }
  }

  function guess(animeId: number | null) {
    if (!round || !canGuess) return;
    const action: GameAction = {
      type: 'guess',
      roundId: round.id,
      animeId,
      actionId: crypto.randomUUID(),
    };
    pending.current = action;
    setPendingGuess(true);
    setError('');
    if (!send.current(action))
      setError(
        'Reconnecting. Your answer will be retried if the round is still open.',
      );
  }

  const preparation = catalogState.phase !== 'ready' && (
    <Box>
      <Typography>{catalogState.error ?? 'Preparing anime search…'}</Typography>
      {catalogState.phase === 'error' && (
        <Button onClick={catalog.retry}>Retry search</Button>
      )}
    </Box>
  );

  if (room.phase === 'lobby') {
    return (
      <RoomLobby
        room={room}
        playerId={session.playerId}
        status={status}
        error={error || room.error || ''}
        // Keep the lobby steady while its catalog loads; only failures need a panel.
        preparation={catalogState.phase === 'error' ? preparation : null}
        preferences={preferences}
        canReady={ready && Boolean(room.settings)}
        readyBusy={readyBusy}
        onReady={() => void becomeReady()}
        onUnready={() => send.current({ type: 'unready' })}
        onBack={onBack}
      />
    );
  }

  return (
    <RoomMatch
      room={room}
      playerId={session.playerId}
      status={status}
      error={error || room.error || ''}
      preparation={preparation}
      now={now}
      deadline={deadline}
      guessing={guessing}
      canGuess={canGuess}
      pendingGuess={pendingGuess}
      ready={ready}
      rematchDisabled={
        readyBusy || (isReady ? !connected : !ready || preferencesState.blocked)
      }
      audio={audio}
      catalog={catalog}
      preferences={preferences}
      onGuess={guess}
      onReady={() => void becomeReady()}
      onUnready={() => send.current({ type: 'unready' })}
      onEnableAudio={() =>
        void audio.enable().catch((cause) => setError(String(cause)))
      }
      onBack={onBack}
    />
  );
}
