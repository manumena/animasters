import { useState } from 'react';
import { Alert } from '@mui/material';
import { FiHeadphones } from 'react-icons/fi';

interface Props {
  startsAt?: number;
  now: number;
  preparing?: boolean;
}

/** The deadline is fixed when everyone readies, before generation completes. */
export default function MatchCountdown({ startsAt, now, preparing = false }: Props) {
  // Keep ticking locally even before clock synchronization or with an older
  // backend that does not publish the preparation deadline yet.
  const [localDeadline] = useState(() => Date.now() + 5_000);
  const currentTime = startsAt !== undefined && now > 0 ? now : Date.now();
  const seconds = Math.max(0, Math.ceil(((startsAt ?? localDeadline) - currentTime) / 1000));

  return (
    <section className="room-match-panel match-countdown" aria-label="Match starting">
      <FiHeadphones aria-hidden="true" />
      <p className="room-match-eyebrow">Get ready</p>
      <h2>Your match is about to start</h2>
      <strong className="match-countdown-number" role="timer" aria-label="Seconds until playback">
        {seconds}
      </strong>
      <p className="room-match-muted">Headphones on. The first song starts together.</p>
      {seconds === 0 && preparing && (
        <Alert severity="error" sx={{ mt: 3 }}>
          This is taking longer than expected.
        </Alert>
      )}
    </section>
  );
}
