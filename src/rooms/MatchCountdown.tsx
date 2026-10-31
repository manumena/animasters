import { FiHeadphones } from 'react-icons/fi';

interface Props {
  startsAt?: number;
  now: number;
}

/** Display the server's scheduled start; never start audio from a local timer. */
export default function MatchCountdown({ startsAt, now }: Props) {
  const seconds = startsAt && now > 0
    ? Math.max(0, Math.ceil((startsAt - now) / 1000))
    : null;

  return (
    <section className="room-match-panel match-countdown" aria-label="Match starting">
      <FiHeadphones aria-hidden="true" />
      <p className="room-match-eyebrow">Get ready</p>
      <h2>Your match is about to start</h2>
      <strong className="match-countdown-number" role="timer" aria-label="Seconds until playback">
        {seconds ?? '—'}
      </strong>
      <p className="room-match-muted">Headphones on. The first song starts together.</p>
    </section>
  );
}
