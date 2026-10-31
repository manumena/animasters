import { FiCheckCircle, FiMinusCircle, FiXCircle } from 'react-icons/fi';
import type { RoomSnapshot } from './client';

type PlayerResult = NonNullable<RoomSnapshot['result']>['players'][number];

/** Only render from a revealed result, never from a pending submission. */
export default function GuessResultBanner({
  result,
}: {
  result: PlayerResult;
}) {
  // The reveal contract groups explicit passes and unanswered rounds together.
  // Avoid claiming the player clicked Pass when they may have timed out.
  const outcome = result.correct
    ? 'correct'
    : result.guess
      ? 'wrong'
      : 'unanswered';
  const Icon =
    outcome === 'correct'
      ? FiCheckCircle
      : outcome === 'wrong'
        ? FiXCircle
        : FiMinusCircle;
  const title =
    outcome === 'correct'
      ? 'You got it!'
      : outcome === 'wrong'
        ? 'Not this time'
        : 'Pass / no answer';
  const detail =
    outcome === 'correct'
      ? 'Correct answer'
      : outcome === 'wrong'
        ? 'Wrong answer'
        : 'No points lost';
  const points = `${result.points > 0 ? '+' : ''}${result.points}`;

  return (
    <div
      className="guess-result-banner"
      data-outcome={outcome}
      role="status"
      aria-label="Your round result"
    >
      <Icon aria-hidden="true" />
      <div className="guess-result-message">
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      <div className="guess-result-points">
        <strong>{points}</strong>
        <span>{Math.abs(result.points) === 1 ? 'point' : 'points'}</span>
      </div>
    </div>
  );
}
