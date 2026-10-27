import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { enterRoom, normalizeRoomCode, savedSession, watchRoom } from '../rooms/client';
import type { RoomSession } from '../rooms/client';

/** Room entry and lobby are separate from the existing local-player game. */
export default function Rooms() {
  const { code: routeCode } = useParams();
  const code = normalizeRoomCode(routeCode ?? '');
  const navigate = useNavigate();
  const [session, setSession] = useState<RoomSession | null>(() => savedSession(code));
  const [nickname, setNickname] = useState('');
  const [inputCode, setInputCode] = useState(code);
  const [mode, setMode] = useState<'create' | 'join'>(routeCode ? 'join' : 'create');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      // Reusing this browser's credential avoids occupying a second player slot.
      const existing = mode === 'join' ? savedSession(inputCode) : null;
      const result = existing ?? await enterRoom(nickname, mode === 'join' ? inputCode : undefined);
      setSession(result);
      navigate(`/rooms/${result.room.code}`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to enter the room.');
    } finally { setPending(false); }
  }

  return (
    <Box component="main" sx={{ width: 'min(560px, 100%)', mx: 'auto', px: 2, py: { xs: 3, sm: 8 } }}>
      <Button component={RouterLink} to="/" variant="outlined" sx={{ mb: 3 }}>Back to game</Button>
      <Box sx={{ p: 3, bgcolor: '#101820ed', borderRadius: 2, border: '1px solid #ffffff33' }}>
        {session ? <Lobby session={session} onBack={() => { setSession(null); navigate('/rooms'); }} /> : (
          <Stack component="form" spacing={3} onSubmit={submit}>
            <Typography component="h1" variant="h4">Play with friends</Typography>
            <Stack direction="row" spacing={2}>
              <Button variant={mode === 'create' ? 'contained' : 'outlined'} disabled={pending} onClick={() => setMode('create')}>Create room</Button>
              <Button variant={mode === 'join' ? 'contained' : 'outlined'} disabled={pending} onClick={() => setMode('join')}>Join room</Button>
            </Stack>
            <TextField
              label="Nickname" value={nickname} required disabled={pending}
              onChange={event => setNickname(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 24, autoComplete: 'nickname' }, inputLabel: { sx: { color: '#d5dbe1' } } }}
              helperText="Your name in this room (up to 24 characters)."
              sx={{ '& .MuiFormHelperText-root': { color: '#c1c9d2' } }}
            />
            {mode === 'join' && <TextField
              label="Room code" value={inputCode} required disabled={pending}
              onChange={event => setInputCode(normalizeRoomCode(event.target.value))}
              slotProps={{ htmlInput: { autoCapitalize: 'characters', autoComplete: 'off', spellCheck: false, pattern: '[A-Z0-9]{4}' }, inputLabel: { sx: { color: '#d5dbe1' } } }}
              helperText="4 letters or numbers, for example A7B2."
              sx={{ '& .MuiFormHelperText-root': { color: '#c1c9d2' } }}
            />}
            {error && <Alert severity="error">{error}</Alert>}
            <Button variant="outlined" type="submit" disabled={pending || !nickname.trim() || (mode === 'join' && inputCode.length !== 4)}>
              {pending ? 'Entering room…' : mode === 'create' ? 'Create my room' : 'Join this room'}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function Lobby({ session, onBack }: { session: RoomSession; onBack: () => void }) {
  const [room, setRoom] = useState(session.room);
  const [status, setStatus] = useState('Connecting…');
  const [copyStatus, setCopyStatus] = useState('');
  const shareLink = `${window.location.origin}/rooms/${room.code}`;

  useEffect(() => watchRoom(session, setRoom, setStatus), [session]);

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setCopyStatus('Copied!'); }
    catch { setCopyStatus('Could not copy automatically. Select and copy the code or link below.'); }
  }

  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">Your room</Typography>
      <Typography sx={{ fontSize: '3rem', letterSpacing: '.25em', fontWeight: 700 }}>{room.code}</Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => copy(room.code)}>Copy code</Button>
        <Button variant="outlined" onClick={() => copy(shareLink)}>Copy invite link</Button>
      </Stack>
      <Typography sx={{ overflowWrap: 'anywhere', color: '#c1c9d2' }}>{shareLink}</Typography>
      <Typography role="status">{status}</Typography>
      {copyStatus && <Typography role="status">{copyStatus}</Typography>}
      <Typography component="h2" variant="h6">Players ({room.players.length}/10)</Typography>
      <Box component="ul" sx={{ pl: 3, my: 0 }}>
        {room.players.map(player => <li key={player.id}>
          {player.nickname}{player.id === session.playerId ? ' (you)' : ''}{player.id === room.hostId ? ' · Host' : ''}
          {' · '}{player.connected ? 'Connected' : 'Disconnected'}
        </li>)}
      </Box>
      <Typography sx={{ color: '#c1c9d2' }}>Share the code so your friends can join. Multiplayer gameplay is coming next.</Typography>
      <Button onClick={onBack}>Back to room entry</Button>
    </Stack>
  );
}
