import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { FiCheck, FiMinus, FiMusic, FiX } from 'react-icons/fi';
import type { RoomSnapshot } from './client';
import './RoundReveal.css';

type RevealedResult = NonNullable<RoomSnapshot['result']>;

function songMetadataLabel(result: RevealedResult): string | undefined {
  const labels = { opening: 'Opening', ending: 'Ending', soundtrack: 'Soundtrack' };
  const songType = result.songType;
  if (!songType || !Object.hasOwn(labels, songType)) return undefined;

  const sequence = result.sequenceNumber;
  const hasSequence = songType !== 'soundtrack'
    && typeof sequence === 'number'
    && Number.isSafeInteger(sequence)
    && sequence > 0;

  return hasSequence ? `${labels[songType]} ${sequence}` : labels[songType];
}

interface Props {
  result: RevealedResult;
  playerId: string;
  children?: ReactNode;
}

/** Mount only for a revealed result, keyed by round and artwork URL. That keeps
 * image failures and the full-size dialog scoped to the current reveal. */
export default function RoundReveal({ result, playerId, children }: Props) {
  const [posterFailed, setPosterFailed] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dialogTitleId = useId();
  const hasPoster = Boolean(result.artworkUrl) && !posterFailed;
  const mine = result.players.find((player) => player.id === playerId);
  const metadataLabel = songMetadataLabel(result);

  function handlePosterError() {
    setPosterFailed(true);
    setPosterLoaded(false);
    setExpanded(false);
  }

  return (
    <section
      className="room-match-panel room-match-reveal"
      aria-label="Round reveal"
      data-artwork={hasPoster || undefined}
    >
      {hasPoster && posterLoaded && (
        <div className="round-reveal-backdrop" aria-hidden="true">
          <img src={result.artworkUrl} alt="" decoding="async" />
        </div>
      )}
      <div className="room-match-reveal-heading">
        <p className="room-match-eyebrow">Song {result.number} · The answer</p>
      </div>
      <div className="room-match-song">
        {hasPoster ? (
          <button
            type="button"
            className="round-reveal-poster-button"
            aria-label={`Enlarge ${result.anime} poster`}
            aria-haspopup="dialog"
            onClick={() => setExpanded(true)}
          >
            <img
              className="round-reveal-poster"
              src={result.artworkUrl}
              alt={`${result.anime} poster`}
              decoding="async"
              onLoad={() => setPosterLoaded(true)}
              onError={handlePosterError}
            />
          </button>
        ) : (
          <span className="room-match-song-mark" aria-hidden="true"><FiMusic /></span>
        )}
        <div className="round-reveal-answer">
          <h2>{result.anime}</h2>
          <p>{result.name}</p>
          {metadataLabel && <p className="round-reveal-metadata">{metadataLabel}</p>}
          {hasPoster && <p className="round-reveal-hint">Click the poster for a closer look</p>}
        </div>
      </div>
      {mine && (
        <div className="room-match-personal-result">
          {mine.correct ? <FiCheck aria-hidden="true" /> : mine.guess ? <FiX aria-hidden="true" /> : <FiMinus aria-hidden="true" />}
          <span>{mine.guess ? `You answered ${mine.guess}` : 'You passed or did not answer.'}</span>
        </div>
      )}
      {children}
      {hasPoster && (
        <Dialog
          open={expanded}
          onClose={() => setExpanded(false)}
          aria-labelledby={dialogTitleId}
          maxWidth="md"
          className="round-reveal-dialog"
        >
          <DialogTitle id={dialogTitleId}>{result.anime} poster</DialogTitle>
          <DialogContent>
            <img
              className="round-reveal-full-poster"
              src={result.artworkUrl}
              alt={`${result.anime} poster, enlarged`}
              onError={handlePosterError}
            />
          </DialogContent>
          <DialogActions><Button onClick={() => setExpanded(false)}>Close poster</Button></DialogActions>
        </Dialog>
      )}
    </section>
  );
}
