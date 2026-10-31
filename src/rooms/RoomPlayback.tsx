import { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, Button, Slider } from '@mui/material';
import {
  FiHeadphones,
  FiPause,
  FiPlay,
  FiRotateCcw,
  FiVolume2,
} from 'react-icons/fi';
import type { RoomAudio } from './audio';

interface Props {
  audio: RoomAudio;
  guessing: boolean;
  onEnable: () => void;
}

function playbackTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

// Decorative, fixed profile: it never implies access to real frequency data.
const soundBars = Array.from({ length: 34 }, (_, index) => {
  const envelope = Math.pow(Math.sin(((index + 1) / 35) * Math.PI), 0.75);
  const detail =
    0.65 + 0.22 * Math.sin(index * 1.6) + 0.13 * Math.sin(index * 0.63);
  return 10 + envelope * detail * 78;
});

/** A view over the existing audio controller. RoomGame still owns scheduling,
 * teardown and round transitions; these controls affect this device only. */
export default function RoomPlayback({
  audio,
  guessing,
}: Omit<Props, 'onEnable'>) {
  const state = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  const [position, setPosition] = useState(0);
  const [repeating, setRepeating] = useState(() => audio.isRepeating());
  const disabled = !state.enabled || state.loading;

  useEffect(() => {
    const timer = setInterval(() => setPosition(audio.position()), 250);
    return () => clearInterval(timer);
  }, [audio]);

  return (
    <section
      className="room-match-panel room-playback"
      aria-label="Audio player"
    >
      <div className="room-playback-heading">
        <div>
          <p className="room-match-eyebrow">
            {guessing ? 'Now playing' : 'Getting ready'}
          </p>
          <h2>{guessing ? 'Know this one?' : 'Your next song'}</h2>
        </div>
        <span>
          <FiHeadphones aria-hidden="true" /> Your playback
        </span>
      </div>
      <div className="room-match-spectrum" aria-hidden="true">
        {soundBars.map((height, index) => (
          <span key={index} style={{ height }} />
        ))}
      </div>

      {guessing && (
        <div className="room-playback-controls">
          <div className="room-playback-buttons">
            <Button
              variant="outlined"
              disabled={disabled}
              onClick={() => audio.play()}
              startIcon={<FiPlay />}
            >
              Play
            </Button>
            <Button
              variant="outlined"
              disabled={disabled}
              onClick={() => audio.pause()}
              startIcon={<FiPause />}
            >
              Pause
            </Button>
            <Button
              variant="outlined"
              disabled={disabled}
              aria-pressed={repeating}
              color={repeating ? "primary" : "inherit"}
              onClick={() => {
                audio.repeat(!repeating);
                setRepeating(!repeating);
              }}
              startIcon={<FiRotateCcw />}
            >
              Repeat {repeating ? "on" : "off"}
            </Button>
          </div>
          <div className="room-playback-seek">
            <Slider
              aria-label="Song position"
              disabled={disabled}
              min={0}
              max={state.duration || 1}
              value={Math.min(position, state.duration || 1)}
              onChange={(_, value) => audio.seek(value as number)}
            />
            <span>
              {playbackTime(position)} / {playbackTime(state.duration)}
            </span>
          </div>
          <div className="room-playback-volume">
            <FiVolume2 aria-hidden="true" />
            <Slider
              aria-label="Volume"
              min={0}
              max={1}
              step={0.01}
              defaultValue={1}
              onChange={(_, value) => audio.volume(value as number)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

/** Keep audio recovery available during the reveal/preload as well as playback. */
export function RoomAudioNotice({
  audio,
  onEnable,
}: Pick<Props, 'audio' | 'onEnable'>) {
  const state = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  if (!state.loading && !state.error && state.enabled) return null;

  return (
    <div className="room-match-audio-notice">
      {state.loading && (
        <p role="status" className="room-match-muted">
          Loading song…
        </p>
      )}
      {state.error && <Alert severity="warning">{state.error}</Alert>}
      {!state.enabled && (
        <Button variant="outlined" onClick={onEnable}>
          Enable audio / Resume
        </Button>
      )}
    </div>
  );
}
