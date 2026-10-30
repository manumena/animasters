import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, TextField } from '@mui/material';
import { enterRoom, normalizeRoomCode, savedSession } from '../rooms/client';
import RoomGame from '../rooms/RoomGame';
import type { RoomSession } from '../rooms/client';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import CafePage, { CafeHeader } from '../components/CafePage';
import './Rooms.css';

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
    } finally {
      setPending(false);
    }
  }

  // Keep the existing lobby and match presentation outside the entry theme.
  if (session) {
    return (
      <Box component="main" sx={{ width: 'min(560px, 100%)', mx: 'auto', px: 2, py: { xs: 3, sm: 8 } }}>
        <Button component={RouterLink} to="/" variant="outlined" sx={{ mb: 3 }}>Back to game</Button>
        <Box sx={{ p: 3, bgcolor: '#101820ed', borderRadius: 2, border: '1px solid #ffffff33' }}>
          <RoomGame session={session} onBack={() => {
            setSession(null);
            navigate('/rooms');
          }} />
        </Box>
      </Box>
    );
  }

  const joining = mode === 'join';
  const cannotSubmit = pending || !nickname.trim() || (joining && inputCode.length !== 4);

  return (
    <CafePage className="room-entry-page">
      <CafeHeader />
      <nav className="room-entry-back" aria-label="Back to homepage">
        <Button component={RouterLink} to="/" startIcon={<FiArrowLeft aria-hidden="true" />}>
          Back home
        </Button>
      </nav>

      <section className="room-entry" aria-labelledby="room-entry-heading">
        <div className="room-entry-intro">
          <p className="room-entry-eyebrow">Bring your friends</p>
          <h1 id="room-entry-heading">Your next anime night.</h1>
          <p>Pick a nickname. We’ll save you a seat.</p>
        </div>

        <form className="room-entry-form" onSubmit={submit} aria-busy={pending}>
          <div className="room-entry-modes" role="group" aria-label="Room entry">
            <Button type="button" aria-pressed={!joining} disabled={pending} onClick={() => setMode('create')}>
              Create room
            </Button>
            <Button type="button" aria-pressed={joining} disabled={pending} onClick={() => setMode('join')}>
              Join room
            </Button>
          </div>

          <div className="room-entry-field">
            <label htmlFor="room-nickname">Nickname</label>
            <TextField
              id="room-nickname"
              placeholder="What should we call you?"
              value={nickname}
              required
              fullWidth
              disabled={pending}
              onChange={event => setNickname(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 24, autoComplete: 'nickname' } }}
              helperText="Your name for this game. No account needed."
            />
          </div>

          {joining && (
            <div className="room-entry-field room-entry-code">
              <label htmlFor="room-code">Room code</label>
              <TextField
                id="room-code"
                placeholder="A7B2"
                value={inputCode}
                required
                fullWidth
                disabled={pending}
                onChange={event => setInputCode(normalizeRoomCode(event.target.value))}
                slotProps={{ htmlInput: { autoCapitalize: 'characters', autoComplete: 'off', spellCheck: false, pattern: '[A-Z0-9]{4}' } }}
                helperText="4 letters or numbers from your friend."
              />
            </div>
          )}

          {error && <Alert severity="error">{error}</Alert>}
          <Button
            className="room-entry-submit"
            variant="contained"
            disableElevation
            type="submit"
            disabled={cannotSubmit}
            endIcon={!pending && <FiArrowRight aria-hidden="true" />}
          >
            {pending ? 'Entering room…' : joining ? 'Join this room' : 'Create my room'}
          </Button>
          <p className="room-entry-next">
            {joining
              ? 'Join your friends in the lobby. The match starts when everyone is ready.'
              : 'You’ll get a code to share and can choose the match settings in the lobby.'}
          </p>
        </form>
        <p className="room-entry-footnote">Just your friends · No account needed</p>
      </section>
    </CafePage>
  );
}
