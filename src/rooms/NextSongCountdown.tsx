import { useEffect, useRef } from 'react';

interface Props {
  startsAt?: number;
  now: number;
}

// Later rounds have a ten-second intermission; all-ready can shorten it.
const intermissionMilliseconds = 10_000;

/** Interpolate the synchronized clock for presentation only. RoomGame and the
 * server remain responsible for playback and phase changes. */
export default function NextSongCountdown({ startsAt, now }: Props) {
  const arc = useRef<SVGCircleElement>(null);
  const clockReady = startsAt !== undefined && now > 0;
  const remaining = clockReady ? Math.max(0, startsAt - now) : null;
  const seconds = remaining === null ? null : Math.ceil(remaining / 1000);
  const urgent = seconds !== null && seconds <= 3;

  useEffect(() => {
    const circle = arc.current;
    if (!circle || remaining === null) return;

    const sampledAt = performance.now();
    let frame: number;

    function drawArc() {
      if (!circle || remaining === null) return;
      const millisecondsLeft = Math.max(0, remaining - (performance.now() - sampledAt));
      const fractionLeft = Math.min(1, millisecondsLeft / intermissionMilliseconds);

      circle.style.strokeDashoffset = String(1 - fractionLeft);
      // Round caps leave a dot at zero unless the arc is explicitly hidden.
      circle.style.visibility = millisecondsLeft === 0 ? 'hidden' : 'visible';

      if (millisecondsLeft > 0) frame = requestAnimationFrame(drawArc);
    }

    drawArc();
    return () => cancelAnimationFrame(frame);
  }, [remaining]);

  return (
    <div className="next-song-countdown" data-urgent={urgent}>
      <div className="next-song-countdown-ring">
        <svg viewBox="0 0 132 132" aria-hidden="true">
          <circle className="next-song-countdown-track" cx="66" cy="66" r="59" />
          <circle
            ref={arc}
            className="next-song-countdown-arc"
            cx="66"
            cy="66"
            r="59"
            pathLength="1"
            strokeDasharray="1"
            style={{
              strokeDashoffset: remaining === null ? 1 : 1 - Math.min(1, remaining / intermissionMilliseconds),
              visibility: remaining === null || remaining === 0 ? 'hidden' : 'visible',
            }}
          />
        </svg>
        <strong
          className="next-song-countdown-number"
          role="timer"
          aria-label={seconds === null ? 'Waiting for next song timing' : `Next song in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`}
        >
          {seconds ?? '—'}<small>s</small>
        </strong>
      </div>
      <div className="next-song-countdown-copy">
        <p className="next-song-countdown-label">
          {seconds === 0 ? 'Next song starting' : 'Next song in'}
        </p>
        <p className="next-song-countdown-status">
          {seconds === null
            ? 'Syncing countdown…'
            : seconds === 0
              ? 'Starting playback…'
              : urgent
                ? 'Get ready to listen'
                : 'Starting automatically'}
        </p>
      </div>
    </div>
  );
}
