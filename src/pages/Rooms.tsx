import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { enterRoom, normalizeRoomCode, savedSession } from '../rooms/client';
import RoomGame from '../rooms/RoomGame';
import type { RoomSession } from '../rooms/client';

/** Room entry and lobby are separate from the existing local-player game. */
export default function Rooms() {
  const { code: routeCode } = useParams();
  const [searchParams] = useSearchParams();
  const code = normalizeRoomCode(routeCode ?? '');
  const navigate = useNavigate();
  const [session, setSession] = useState<RoomSession | null>(() => savedSession(code));
  const [nickname, setNickname] = useState('');
  const [inputCode, setInputCode] = useState(code);
  // The homepage can open either form; a shared room code always selects Join.
  const [mode, setMode] = useState<'create' | 'join'>(
    routeCode || searchParams.get('mode') === 'join' ? 'join' : 'create',
  );
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
        {session ? <RoomGame session={session} onBack={() => { setSession(null); navigate('/rooms'); }} /> : (
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
