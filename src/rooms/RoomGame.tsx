import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Box, Button, Slider, Stack, Typography } from '@mui/material';
import { CatalogClient } from '../catalog/client';
import AnimeAutocomplete from '../components/AnimeAutocomplete';
import type { AnimeOption } from '../catalog/types';
import { watchRoom, type GameAction, type RoomSession, type RoomSnapshot } from './client';
import RoomPreferences from './RoomPreferences';
import { RoomAudio } from './audio';

export default function RoomGame({ session, onBack }: { session: RoomSession; onBack: () => void }) {
  const [room, setRoom] = useState(session.room);
  const [status, setStatus] = useState('Connecting…');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [clockReady, setClockReady] = useState(false);
  const [now, setNow] = useState(0);
  const [audio] = useState(() => new RoomAudio());
  const audioState = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  const clock = useRef<number | undefined>(undefined);
  const send = useRef<(action: GameAction) => boolean>(() => false);
  const pending = useRef<GameAction | undefined>(undefined);
  const [pendingGuess, setPendingGuess] = useState(false);
  const serverNow = useMemo(() => () => performance.now() + (clock.current ?? 0), []);

  // Each room pins its catalog revision. Navigation to the standalone catalog
  // cannot switch this game's accepted answers midway through a match.
  const catalog = useMemo(() => new CatalogClient(
    () => new Worker(new URL('../catalog/catalog.worker.ts', import.meta.url), { type: 'module' }),
    room.catalogVersion,
  ), [room.catalogVersion]);
  const catalogState = useSyncExternalStore(catalog.subscribe, catalog.getSnapshot);

  useEffect(() => {
    if (room.catalogVersion) catalog.start();
    return () => catalog.dispose();
  }, [catalog, room.catalogVersion]);
  useEffect(() => () => audio.dispose(), [audio]);
  useEffect(() => {
    const timer = setInterval(() => setNow(serverNow()), 100);
    return () => clearInterval(timer);
  }, [serverNow]);

  useEffect(() => watchRoom(session, snapshot => {
    setRoom(snapshot);
    const action = pending.current;
    if (action?.type === 'guess' && (snapshot.submission?.actionId === action.actionId || snapshot.round?.id !== action.roundId)) {
      pending.current = undefined;
      setPendingGuess(false);
    }
  }, value => {
    setStatus(value);
    if (value === 'Connected' && pending.current) send.current(pending.current);
  }, {
    onSender: sender => { send.current = sender; },
    onClock: offset => {
      clock.current = offset;
      setClockReady(true);
      setNow(performance.now() + offset);
    },
    onError: message => {
      setError(message);
      pending.current = undefined;
      setPendingGuess(false);
    },
  }), [session]);

  useEffect(() => {
    if (room.phase === 'completed') audio.pause();
    if (room.phase === 'paused') audio.cancelScheduled();
    if (room.round && clockReady) void audio.prepare(room.round, serverNow);
  }, [audio, room.round, room.phase, clockReady, serverNow]);

  const me = room.players.find(player => player.id === session.playerId);
  const connected = status === 'Connected';
  const ready = connected && clockReady && catalogState.phase === 'ready';
  const round = room.round;
  const guessing = Boolean(round && (room.phase === 'guessing' || (room.phase === 'countdown' && now >= (round.startsAt ?? Infinity))));
  const deadline = round?.deadline ?? (round?.startsAt ? round.startsAt + 90_000 : Infinity);
  const canGuess = ready && guessing && now < deadline && !room.submission && !pendingGuess;
  const shareLink = `${window.location.origin}/rooms/${room.code}`;

  async function becomeReady() {
    setError('');
    try {
      await audio.enable();
      if (!send.current({ type: 'ready', catalogVersion: room.catalogVersion, roundId: round?.id, settingsRevision: room.settingsRevision ?? 0 })) {
        setError('Reconnect before becoming ready.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Audio could not be enabled.');
    }
  }

  function guess(animeId: number | null) {
    if (!round || !canGuess) return;
    const action: GameAction = { type: 'guess', roundId: round.id, animeId, actionId: crypto.randomUUID() };
    pending.current = action;
    setPendingGuess(true);
    setError('');
    if (!send.current(action)) setError('Reconnecting. Your answer will be retried if the round is still open.');
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus('Copied!');
    } catch {
      setCopyStatus('Select and copy the code or link below.');
    }
  }

  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">{room.phase === 'lobby' ? 'Your room' : room.phase === 'completed' ? 'Final standings' : 'AniMasters'}</Typography>
      <Typography sx={{ fontSize: room.phase === 'lobby' ? '3rem' : '1.3rem', letterSpacing: '.25em', fontWeight: 700 }}>{room.code}</Typography>
      {room.phase === 'lobby' && <>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => copy(room.code)}>Copy code</Button>
          <Button variant="outlined" onClick={() => copy(shareLink)}>Copy invite link</Button>
        </Stack>
        <Typography sx={{ overflowWrap: 'anywhere' }}>{shareLink}</Typography>
        <RoomPreferences
          key={room.settingsRevision ?? 0}
          settings={room.settings}
          isHost={session.playerId === room.hostId}
          connected={connected}
          canReady={ready}
          isReady={Boolean(me?.ready)}
          onReady={becomeReady}
          onUnready={() => send.current({ type: 'unready' })}
          onSave={settings => {
            setError('');
            if (!send.current({ type: 'settings', settings, settingsRevision: room.settingsRevision ?? 0 })) {
              setError('Reconnect before saving match settings.');
            }
          }}
        />
      </>}
      <Typography role="status">{status}{copyStatus ? ` · ${copyStatus}` : ''}</Typography>
      {(error || room.error) && <Alert severity="error">{error || room.error}</Alert>}
      {catalogState.phase !== 'ready' && <Box>
        <Typography>{catalogState.error ?? 'Preparing anime search…'}</Typography>
        {catalogState.phase === 'error' && <Button onClick={catalog.retry}>Retry search</Button>}
      </Box>}
      {room.phase === 'preparing' && <Typography role="status">Choosing songs…</Typography>}
      {room.phase === 'paused' && <Typography>Waiting to resume the next round…</Typography>}

      {round && <>
        <Typography component="h2" variant="h6">Song {round.number} / {round.total}</Typography>
        <Typography role="timer">
          {guessing ? `${Math.max(0, Math.ceil((deadline - now) / 1000))} seconds left` :
            round.startsAt ? `Starts in ${Math.max(0, Math.ceil((round.startsAt - now) / 1000))} seconds` : 'Paused'}
        </Typography>
        {audioState.loading && <Typography>Loading song…</Typography>}
        {audioState.error && <Alert severity="warning">{audioState.error}</Alert>}
        {!audioState.enabled && <Button variant="outlined" onClick={() => audio.enable().catch(cause => setError(String(cause)))}>Enable audio / Resume</Button>}
        {guessing && <AudioControls audio={audio} disabled={!audioState.enabled || audioState.loading} />}
        {room.phase === 'countdown' && room.result && <Button variant="outlined" disabled={!ready || me?.ready} onClick={becomeReady}>
          {me?.ready ? 'Ready for next song' : 'Ready for next song now'}
        </Button>}
        <GuessInput key={round.id} catalog={catalog} disabled={!canGuess} onGuess={guess} />
        {pendingGuess && <Typography role="status">Submitting answer…</Typography>}
        {room.submission && <Typography role="status">{room.submission.animeId === null ? 'Passed.' : 'Answer submitted.'} Waiting for the reveal.</Typography>}
      </>}
      {room.result && !guessing && <RoundResult room={room} />}
      <Typography component="h2" variant="h6">{room.phase === 'completed' ? 'Scores' : `Players (${room.players.length}/10)`}</Typography>
      <Box component="ul" sx={{ pl: 3, my: 0 }}>
        {[...room.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map(player => <li key={player.id}>
          {player.nickname}{player.id === session.playerId ? ' (you)' : ''}{player.id === room.hostId ? ' · Host' : ''}
          {' · '}{player.connected ? 'Connected' : 'Disconnected'}
          {' · '}{player.score ?? 0} points{player.ready ? ' · Ready' : ''}{guessing && player.submitted ? ' · Finished' : ''}
        </li>)}
      </Box>
      <Button onClick={onBack}>Back to room entry</Button>
    </Stack>
  );
}

function GuessInput({ catalog, disabled, onGuess }: { catalog: CatalogClient; disabled: boolean; onGuess: (id: number | null) => void }) {
  const [selected, setSelected] = useState<AnimeOption | null>(null);
  return <Stack spacing={2}>
    <AnimeAutocomplete client={catalog} value={selected} onChange={setSelected} disabled={disabled} />
    <Stack direction="row" spacing={2}>
      <Button variant="outlined" disabled={disabled || !selected} onClick={() => onGuess(selected!.id)}>Submit guess</Button>
      <Button variant="outlined" disabled={disabled} onClick={() => onGuess(null)}>Pass</Button>
    </Stack>
  </Stack>;
}

function AudioControls({ audio, disabled }: { audio: RoomAudio; disabled: boolean }) {
  const state = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setPosition(audio.position()), 250);
    return () => clearInterval(timer);
  }, [audio]);
  return <Box>
    <Stack direction="row" spacing={1}>
      <Button disabled={disabled} onClick={() => audio.play()}>Play</Button>
      <Button disabled={disabled} onClick={() => audio.pause()}>Pause</Button>
      <Button disabled={disabled} onClick={() => audio.replay()}>Replay</Button>
    </Stack>
    <Slider aria-label="Song position" disabled={disabled} min={0} max={state.duration || 1} value={position} onChange={(_, value) => audio.seek(value as number)} />
    <Typography variant="caption">Volume</Typography>
    <Slider aria-label="Volume" min={0} max={1} step={0.01} defaultValue={1} onChange={(_, value) => audio.volume(value as number)} />
  </Box>;
}

function RoundResult({ room }: { room: RoomSnapshot }) {
  const result = room.result!;
  return <Box sx={{ border: '1px solid #ffffff44', p: 2, borderRadius: 1 }}>
    <Typography component="h2" variant="h6">Song {result.number}: {result.anime}</Typography>
    <Typography>{result.name}</Typography>
    {result.players.map(player => <Typography key={player.id}>
      {room.players.find(member => member.id === player.id)?.nickname}: {player.guess ?? 'Pass / no answer'}
      {' · '}{player.points > 0 ? '+' : ''}{player.points} points
    </Typography>)}
  </Box>;
}
