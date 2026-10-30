import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button, TextField } from '@mui/material';
import { FiArrowLeft, FiCopy, FiLink, FiSettings } from 'react-icons/fi';
import CafePage, { CafeHeader } from '../components/CafePage';
import type { RoomSnapshot } from './client';
import RoomPreferences from './RoomPreferences';
import { RoomPreferencesController, songTypes } from './preferences';
import './RoomLobby.css';

interface Props {
  room: RoomSnapshot;
  playerId: string;
  status: string;
  error: string;
  preparation: ReactNode;
  preferences: RoomPreferencesController;
  canReady: boolean;
  readyBusy: boolean;
  onReady: () => void;
  onUnready: () => void;
  onBack: () => void;
}

export default function RoomLobby({
  room,
  playerId,
  status,
  error,
  preparation,
  preferences,
  canReady,
  readyBusy,
  onReady,
  onUnready,
  onBack,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const previousScreen = useRef(editing);
  const preferencesState = useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
  );
  const isHost = room.hostId === playerId;
  const me = room.players.find((player) => player.id === playerId);
  const isReady = Boolean(me?.ready);
  const connected = status === 'Connected';
  const onlinePlayers = room.players.filter((player) => player.connected);
  const readyCount = onlinePlayers.filter((player) => player.ready).length;
  const inviteLink = `${window.location.origin}/rooms/${room.code}`;

  useEffect(() => {
    if (previousScreen.current !== editing) heading.current?.focus();
    previousScreen.current = editing;
  }, [editing]);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus('Copied!');
    } catch {
      setInviting(true);
      setCopyStatus('Select and copy the code or link below.');
    }
  }

  return (
    <CafePage className="room-lobby-page">
      <CafeHeader />
      <div className="room-lobby">
        <div className="room-lobby-heading">
          <div>
            <p className="room-lobby-eyebrow">Your anime game night</p>
            <h1 ref={heading} tabIndex={-1}>
              {editing ? 'Match preferences' : 'Your room'}
            </h1>
          </div>
          <span
            className="room-connection"
            role="status"
            data-connected={connected}
          >
            {status}
          </span>
        </div>

        {error && <Alert severity="error">{error}</Alert>}
        {preparation}

        {editing ? (
          <>
            <Button
              className="room-back"
              startIcon={<FiArrowLeft />}
              onClick={() => setEditing(false)}
            >
              Back to lobby
            </Button>
            <section
              className="room-lobby-panel"
              aria-label="Match preferences"
            >
              <RoomPreferences
                controller={preferences}
                isHost={isHost}
                isReady={isReady}
              />
            </section>
          </>
        ) : (
          <>
            <Button
              className="room-back"
              startIcon={<FiArrowLeft />}
              onClick={onBack}
            >
              Back to room entry
            </Button>
            <section
              className="room-invite-card room-lobby-panel"
              aria-label="Room invitation and readiness"
            >
              <div className="room-invite-top">
                <div className="room-code">
                  <span>Room code</span>
                  <strong>{room.code}</strong>
                </div>
                <Button
                  variant="outlined"
                  startIcon={<FiLink />}
                  onClick={() => setInviting((value) => !value)}
                  aria-expanded={inviting}
                >
                  Invite friends
                </Button>
              </div>
              {inviting && (
                <div className="room-invite-details">
                  <div className="room-copy-actions">
                    <Button
                      variant="outlined"
                      startIcon={<FiCopy />}
                      onClick={() => void copy(room.code)}
                    >
                      Copy code
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => void copy(inviteLink)}
                    >
                      Copy invite link
                    </Button>
                  </div>
                  <TextField
                    label="Invite link"
                    value={inviteLink}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                    onFocus={(event) => event.target.select()}
                  />
                  {copyStatus && <p role="status">{copyStatus}</p>}
                </div>
              )}

              <div className="room-lobby-ready">
                <strong>
                  {readyCount} of {onlinePlayers.length} connected players ready
                </strong>
                <p>
                  The match starts automatically when everyone connected is
                  ready.
                </p>
                <Button
                  className="room-ready-button"
                  variant="contained"
                  disableElevation
                  disabled={
                    readyBusy ||
                    (isReady
                      ? !connected
                      : !canReady || preferencesState.blocked)
                  }
                  onClick={isReady ? onUnready : onReady}
                >
                  {isReady
                    ? 'Not ready'
                    : readyBusy
                      ? 'Getting ready…'
                      : isHost
                        ? 'Ready to start'
                        : 'Ready'}
                </Button>
                {isReady && <p role="status">Ready — waiting for players.</p>}
                {isHost && preferencesState.error && (
                  <p role="status">
                    Review match preferences before becoming ready.
                  </p>
                )}
              </div>
            </section>

            <section
              className="room-match-summary room-lobby-panel"
              aria-label="Next match"
            >
              <div>
                <h2>The next match</h2>
                {room.settings ? (
                  <>
                    <strong>{room.settings.amount} songs</strong>
                    <p>{songTypes(room.settings)}</p>
                    <small>No repeated anime</small>
                  </>
                ) : (
                  <p>Loading match settings…</p>
                )}
              </div>
              {isHost && (
                <Button
                  variant="outlined"
                  startIcon={<FiSettings />}
                  onClick={() => setEditing(true)}
                >
                  Match preferences
                </Button>
              )}
            </section>

            {/* Player growth only extends this final section, never the controls. */}
            <section
              className="room-lobby-players room-lobby-panel"
              aria-labelledby="room-players-heading"
            >
              <div className="room-players-heading">
                <h2 id="room-players-heading">
                  Players <small>{room.players.length} / 10</small>
                </h2>
                <span>{readyCount} ready</span>
              </div>
              <ul>
                {room.players.map((player) => (
                  <li key={player.id}>
                    <span className="room-player-initial" aria-hidden="true">
                      {Array.from(player.nickname)[0]}
                    </span>
                    <span className="room-player-name">
                      {player.nickname}
                      {player.id === playerId ? ' (you)' : ''}
                      {player.id === room.hostId ? ' · Host' : ''}
                    </span>
                    <span
                      className="room-player-status"
                      data-ready={player.connected && player.ready}
                    >
                      {!player.connected
                        ? 'Disconnected'
                        : player.ready
                          ? 'Ready'
                          : 'Not ready'}
                    </span>
                  </li>
                ))}
              </ul>
              <p>
                {room.players.length < 10
                  ? `Room for ${10 - room.players.length} more. Invite your friends before you ready up.`
                  : 'Your room is full.'}
              </p>
            </section>
          </>
        )}
      </div>
    </CafePage>
  );
}
