import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button } from '@mui/material';
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiCheck,
  FiMinus,
  FiMusic,
  FiSettings,
  FiX,
} from 'react-icons/fi';
import CafePage, { CafeHeader } from '../components/CafePage';
import AnimeAutocomplete from '../components/AnimeAutocomplete';
import type { CatalogClient } from '../catalog/client';
import type { AnimeOption } from '../catalog/types';
import type { RoomAudio } from './audio';
import type { RoomSnapshot } from './client';
import type { RoomPreferencesController } from './preferences';
import { songTypes } from './preferences';
import RoomPlayback, { RoomAudioNotice } from './RoomPlayback';
import RoomPreferences from './RoomPreferences';
import './RoomMatch.css';
import MatchCountdown from './MatchCountdown';
import GuessResultBanner from './GuessResultBanner';

interface Props {
  room: RoomSnapshot;
  playerId: string;
  status: string;
  error: string;
  preparation: ReactNode;
  now: number;
  deadline: number;
  guessing: boolean;
  canGuess: boolean;
  pendingGuess: boolean;
  ready: boolean;
  rematchDisabled: boolean;
  audio: RoomAudio;
  catalog: CatalogClient;
  preferences: RoomPreferencesController;
  onGuess: (animeId: number | null) => void;
  onReady: () => void;
  onUnready: () => void;
  onEnableAudio: () => void;
  onBack: () => void;
}

function signedPoints(points: number) {
  return `${points > 0 ? '+' : ''}${points}`;
}

/** Presentation only: the server snapshot and RoomGame decide when guesses,
 * reveals and readiness are allowed. Never infer answers from the audio URL. */
export default function RoomMatch(props: Props) {
  const { room, playerId, guessing } = props;
  const round = room.round;
  const completed = room.phase === 'completed';
  // A snapshot may retain the previous reveal during the next song. Hide it as
  // soon as that song starts, including the client-side countdown boundary.
  const showResult = Boolean(room.result && !guessing);
  const initialCountdown =
    room.phase === 'countdown' && round?.number === 1 && !guessing;
  const personalResult = room.result?.players.find(
    (player) => player.id === playerId,
  );
  const isReady = Boolean(
    room.players.find((player) => player.id === playerId)?.ready,
  );
  const nextSeconds =
    round?.startsAt && props.now
      ? Math.max(0, Math.ceil((round.startsAt - props.now) / 1000))
      : '—';

  return (
    <CafePage className="room-match-page">
      <CafeHeader>
        <span className="room-match-code">
          Room <strong>{room.code}</strong>
        </span>
        <span
          role="status"
          className="room-match-connection"
          data-connected={props.status === 'Connected'}
        >
          {props.status}
        </span>
      </CafeHeader>

      <div className="room-match">
        <nav className="room-match-navigation" aria-label="Leave match screen">
          <Button onClick={props.onBack} startIcon={<FiArrowLeft />}>
            Back to room entry
          </Button>
        </nav>
        <div className="room-match-heading">
          <div>
            <p className="room-match-eyebrow">Your anime game night</p>
            <h1>
              {completed ? (
                'Final standings'
              ) : round ? (
                <>
                  Song {round.number} <span>/ {round.total}</span>
                </>
              ) : (
                'Your match'
              )}
            </h1>
          </div>
          {round && (
            <span className="room-match-muted">
              {completed ? round.total : round.number - 1} songs played
            </span>
          )}
        </div>
        {round && (
          <progress
            className="room-match-progress"
            aria-label="Match progress"
            max={round.total}
            value={completed ? round.total : round.number - 1}
          />
        )}

        {props.error && <Alert severity="error">{props.error}</Alert>}
        {props.preparation}

        <div className="room-match-layout">
          <div className="room-match-stage">
            {round && (
              <RoomAudioNotice
                audio={props.audio}
                onEnable={props.onEnableAudio}
              />
            )}
            {room.phase === 'preparing' && (
              <section className="room-match-panel" role="status">
                Choosing songs…
              </section>
            )}
            {room.phase === 'paused' && (
              <section className="room-match-panel" role="status">
                Waiting to resume the next round…
              </section>
            )}

            {completed && <FinalStandings {...props} />}

            {initialCountdown && (
              <MatchCountdown startsAt={round?.startsAt} now={props.now} />
            )}

            {round && !completed && !showResult && !initialCountdown && (
              <>
                <section
                  className="room-match-panel room-match-answer"
                  aria-label="Your answer"
                >
                  <div className="room-match-answer-heading">
                    <h2>Which anime is it?</h2>
                    <RoundTimer
                      room={room}
                      now={props.now}
                      deadline={props.deadline}
                      guessing={guessing}
                    />
                  </div>
                  <DeadlineBar
                    room={room}
                    now={props.now}
                    deadline={props.deadline}
                    guessing={guessing}
                  />
                  <p className="room-match-muted room-match-timer-note">
                    {guessing
                      ? 'One answer per song. Guess or pass.'
                      : 'Playback starts together when the countdown ends.'}
                  </p>
                  <GuessInput
                    key={round.id}
                    catalog={props.catalog}
                    disabled={!props.canGuess}
                    onGuess={props.onGuess}
                  />
                  {props.pendingGuess && (
                    <p role="status" className="room-match-submission">
                      Submitting answer…
                    </p>
                  )}
                  {room.submission && (
                    <p role="status" className="room-match-submission">
                      <FiCheck aria-hidden="true" />
                      {room.submission.animeId === null
                        ? 'Passed.'
                        : 'Answer submitted.'}{' '}
                      Waiting for the reveal.
                    </p>
                  )}
                </section>
                <RoomPlayback audio={props.audio} guessing={guessing} />
              </>
            )}

            {showResult && personalResult && (
              <GuessResultBanner result={personalResult} />
            )}

            {showResult && (
              <section
                className="room-match-panel room-match-reveal"
                aria-label="Round reveal"
              >
                <RoundResult room={room} playerId={playerId} />
                {room.phase === 'countdown' && round && (
                  <div className="room-match-next">
                    <div>
                      <strong role="timer">Next song in {nextSeconds}s</strong>
                      <span className="room-match-muted">
                        {
                          room.players.filter(
                            (player) => player.connected && player.ready,
                          ).length
                        }{' '}
                        of{' '}
                        {
                          room.players.filter((player) => player.connected)
                            .length
                        }{' '}
                        connected players ready
                      </span>
                    </div>
                    <Button
                      variant="contained"
                      disableElevation
                      disabled={!props.ready || isReady}
                      onClick={props.onReady}
                      endIcon={<FiArrowRight />}
                    >
                      {isReady
                        ? 'Ready for next song'
                        : 'Ready for next song now'}
                    </Button>
                  </div>
                )}
              </section>
            )}
          </div>

          <Scoreboard
            room={room}
            playerId={playerId}
            showResult={showResult}
            guessing={guessing}
          />
        </div>
      </div>
    </CafePage>
  );
}

// Urgency follows the answer window; preloading stays mint to avoid implying
// that players need to answer before synchronized playback begins.
function countdownColor(seconds: number, guessing: boolean) {
  if (!guessing || seconds > 15) return '#9ae1d0';
  if (seconds > 10) return '#e8d580';
  if (seconds > 5) return '#efa76f';
  return '#ef817f';
}

function RoundTimer({
  room,
  now,
  deadline,
  guessing,
}: Pick<Props, 'room' | 'now' | 'deadline' | 'guessing'>) {
  const startsAt = room.round?.startsAt;
  const clockAvailable = now > 0 && Boolean(startsAt || guessing);
  const seconds = Math.max(
    0,
    Math.ceil(((guessing ? deadline : (startsAt ?? now)) - now) / 1000),
  );
  return (
    <div className="room-match-clock" role="timer">
      <strong style={{ color: countdownColor(seconds, guessing) }}>
        {clockAvailable ? seconds : '—'}
        <span>{clockAvailable ? 's' : ''}</span>
      </strong>
      <small>
        {guessing ? 'left to answer' : startsAt ? 'until playback' : 'Paused'}
      </small>
    </div>
  );
}

function DeadlineBar({
  room,
  now,
  deadline,
  guessing,
}: Pick<Props, 'room' | 'now' | 'deadline' | 'guessing'>) {
  const startsAt = room.round?.startsAt;
  // Use the deadline sent by the server. Local pause, seek or pass never
  // changes the clock, and a shortened deadline never restarts its animation.
  const shortened = startsAt !== undefined && deadline < startsAt + 90_000;
  const windowSeconds = guessing ? (shortened ? 20 : 90) : 10;
  const remaining =
    startsAt === undefined || !now
      ? 0
      : Math.max(0, ((guessing ? deadline : startsAt) - now) / 1000);
  const percent = Math.min(100, (remaining / windowSeconds) * 100);
  return (
    <div
      className="room-match-deadline"
      role="progressbar"
      aria-label={guessing ? 'Answer time remaining' : 'Playback countdown'}
      aria-valuemin={0}
      aria-valuemax={windowSeconds}
      aria-valuenow={Math.min(windowSeconds, Math.ceil(remaining))}
    >
      <span
        style={{
          width: `${percent}%`,
          background: countdownColor(remaining, guessing),
        }}
      />
    </div>
  );
}

function GuessInput({
  catalog,
  disabled,
  onGuess,
}: Pick<Props, 'catalog' | 'onGuess'> & { disabled: boolean }) {
  const [selected, setSelected] = useState<AnimeOption | null>(null);
  return (
    <div className="room-match-guess">
      <AnimeAutocomplete
        client={catalog}
        value={selected}
        onChange={setSelected}
        disabled={disabled}
        appearance="cafe"
      />
      <div className="room-match-guess-actions">
        <Button
          variant="contained"
          disableElevation
          disabled={disabled || !selected}
          onClick={() => onGuess(selected!.id)}
          endIcon={<FiArrowRight />}
        >
          Submit guess
        </Button>
        <Button
          variant="outlined"
          disabled={disabled}
          onClick={() => onGuess(null)}
        >
          Pass
        </Button>
      </div>
    </div>
  );
}

function RoundResult({ room, playerId }: Pick<Props, 'room' | 'playerId'>) {
  const result = room.result!;
  const mine = result.players.find((player) => player.id === playerId);
  return (
    <>
      <div className="room-match-reveal-heading">
        <p className="room-match-eyebrow">Song {result.number} · The answer</p>
      </div>
      <div className="room-match-song">
        <span className="room-match-song-mark" aria-hidden="true">
          <FiMusic />
        </span>
        <div>
          <h2>{result.anime}</h2>
          <p>{result.name}</p>
        </div>
      </div>
      {mine && (
        <div className="room-match-personal-result">
          {mine.correct ? (
            <FiCheck aria-hidden="true" />
          ) : mine.guess ? (
            <FiX aria-hidden="true" />
          ) : (
            <FiMinus aria-hidden="true" />
          )}
          <span>
            {mine.guess
              ? `You answered ${mine.guess}`
              : 'You passed or did not answer.'}
          </span>
        </div>
      )}
    </>
  );
}

function playerStatus(
  player: RoomSnapshot['players'][number],
  guessing: boolean,
  completed: boolean,
) {
  if (!player.connected) return 'Disconnected';
  if (guessing) return player.submitted ? 'Answer submitted' : 'Listening';
  if (player.ready) return 'Ready';
  return completed ? 'Not ready' : 'Connected';
}

function Scoreboard({
  room,
  playerId,
  showResult,
  guessing,
}: Pick<Props, 'room' | 'playerId' | 'guessing'> & { showResult: boolean }) {
  const players = [...room.players].sort(
    (first, second) => (second.score ?? 0) - (first.score ?? 0),
  );
  const completed = room.phase === 'completed';
  return (
    <section
      className="room-match-panel room-match-scores"
      aria-label="Players and scores"
    >
      <div className="room-match-scores-heading">
        <h2>{completed ? 'Scores' : 'Players'}</h2>
        <span className="room-match-muted">
          {guessing
            ? `${players.filter((player) => player.submitted).length} / ${players.length} answered`
            : `${players.length} / 10`}
        </span>
      </div>
      <ol>
        {players.map((player) => {
          const result = showResult
            ? room.result?.players.find((answer) => answer.id === player.id)
            : undefined;
          const rank =
            players.findIndex(
              (other) => (other.score ?? 0) === (player.score ?? 0),
            ) + 1;
          const status = playerStatus(player, guessing, completed);
          return (
            <li key={player.id} data-me={player.id === playerId}>
              <span className="room-match-rank">{rank}</span>
              <div className="room-match-player-name">
                <strong>
                  {player.nickname}
                  {player.id === playerId ? ' (you)' : ''}
                </strong>
                <small>
                  {player.id === room.hostId ? 'Host · ' : ''}
                  {status}
                </small>
                {result && (
                  <small className="room-match-player-answer">
                    {result.guess ?? 'Pass / no answer'}
                    {result.guess
                      ? result.correct
                        ? ' · Correct'
                        : ' · Wrong answer'
                      : ''}
                  </small>
                )}
              </div>
              <div className="room-match-points">
                <span>
                  {player.score ?? 0}
                  <small> points</small>
                </span>
                {result && (
                  <span
                    className="room-match-point-change"
                    data-negative={result.points < 0}
                  >
                    {signedPoints(result.points)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="room-match-muted room-match-score-note">
        {completed
          ? 'Scores reset when the next match starts.'
          : showResult
            ? 'Round points appear below each total.'
            : 'Answers stay hidden until the reveal.'}
      </p>
    </section>
  );
}

function FinalStandings(props: Props) {
  const { room, playerId } = props;
  const [editing, setEditing] = useState(false);
  const isHost = room.hostId === playerId;
  const me = room.players.find((player) => player.id === playerId);
  const highestScore = Math.max(
    ...room.players.map((player) => player.score ?? 0),
  );
  const leaders = room.players.filter(
    (player) => (player.score ?? 0) === highestScore,
  );
  const connected = room.players.filter((player) => player.connected);

  return (
    <section
      className="room-match-panel room-match-finale"
      aria-label="Match complete"
    >
      <div className="room-match-finale-heading">
        <p className="room-match-eyebrow">That's a wrap</p>
        {isHost && (
          <Button
            variant="outlined"
            startIcon={<FiSettings />}
            aria-expanded={editing}
            onClick={() => setEditing(!editing)}
          >
            Match preferences
          </Button>
        )}
      </div>
      <FiAward className="room-match-award" aria-hidden="true" />
      <h2>
        {leaders.length === 1
          ? `${leaders[0].nickname} takes the win.`
          : "It's a tie."}
      </h2>
      {me && (
        <p className="room-match-final-score">
          Your score <strong>{me.score ?? 0} points</strong>
        </p>
      )}
      <div className="room-match-rematch-actions">
        <Button
          variant="contained"
          disableElevation
          disabled={props.rematchDisabled}
          onClick={me?.ready ? props.onUnready : props.onReady}
        >
          {me?.ready ? 'Not ready' : 'Ready for next match'}
        </Button>
      </div>
      <p className="room-match-muted">
        {connected.filter((player) => player.ready).length} of{' '}
        {connected.length} connected players ready. The next match starts when
        everyone connected is ready.
      </p>
      {!isHost && (
        <div className="room-match-guest-settings">
          <p>
            {room.settings &&
              `${room.settings.amount} songs · ${songTypes(room.settings)}`}
            {room.settings &&
              !room.settings.repeatAnimes &&
              ' · No repeated anime'}
          </p>
          <p className="room-match-muted">
            Only the host can change these settings.
          </p>
        </div>
      )}
      {isHost && editing && (
        <div className="room-match-preferences">
          <RoomPreferences
            controller={props.preferences}
            isHost
            isReady={Boolean(me?.ready)}
            isRematch
          />
        </div>
      )}
    </section>
  );
}
