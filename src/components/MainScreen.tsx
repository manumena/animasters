import { useState } from 'react';
import { Button } from '@mui/material';
import { FiArrowRight, FiMoon, FiSearch } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import HomeSpectrum from './HomeSpectrum';
import CafePage, { CafeHeader } from './CafePage';
import './MainScreen.css';

const howToPlay = [
  { title: 'Create & invite', description: 'Share the room code with your friends.' },
  { title: 'Listen & guess', description: 'Hear the same song. Choose the anime.' },
  { title: 'Score & repeat', description: 'Earlier correct guesses earn more points.' },
];

/** A local illustration: never load the song catalog or media on the homepage. */
function RoundPreview() {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="home-round" aria-label="Illustrative round preview">
      <div className="home-track">
        <span className="home-eyebrow">A taste of the game</span>
        <h2 aria-live="polite">
          {revealed ? 'Naruto Shippuden · Blue Bird' : 'That opening you know by heart.'}
        </h2>
        <HomeSpectrum />
        <span className="home-small">Illustrative round · no audio</span>
      </div>

      <div className="home-answer">
        <span className="home-eyebrow">Your guess</span>
        <div className="home-example-answer">
          <FiSearch aria-hidden="true" />
          <span>{revealed ? 'Naruto Shippuden' : 'Which anime is this?'}</span>
          <span className="home-enter" aria-hidden="true">↵</span>
        </div>
        <Button
          className="home-reveal"
          endIcon={<FiArrowRight aria-hidden="true" />}
          onClick={() => setRevealed(previous => !previous)}
        >
          {revealed ? 'Back to round preview' : 'Preview the reveal'}
        </Button>
        <div className="home-score">
          <span className="home-avatar" aria-hidden="true">M</span>
          <span>Manu</span>
          <small>First correct</small>
          <strong>+4</strong>
        </div>
      </div>
    </section>
  );
}

export default function MainScreen() {
  return (
    <CafePage className="home-page">
      <div className="home-hero">
        <CafeHeader />

        <div className="home-hero-copy">
          <p className="home-eyebrow">Your anime game night</p>
          <h1>You know the anime.<br /><span>How fast can you name it?</span></h1>
          <p className="home-description">
            Listen, guess and climb the scoreboard.<br />
            Openings, endings and soundtracks. Better with friends.
          </p>
          <div className="home-actions">
            <Button
              component={RouterLink}
              to="/rooms?mode=create"
              variant="contained"
              disableElevation
              className="home-create"
              endIcon={<FiArrowRight aria-hidden="true" />}
            >
              Create a room
            </Button>
            <Button component={RouterLink} to="/rooms?mode=join" variant="outlined" className="home-join">
              Join a room
            </Button>
          </div>
          <ul className="home-benefits" aria-label="Game features">
            <li>No account needed</li>
            <li>Up to 10 players</li>
            <li>Your own device</li>
          </ul>
        </div>

        <p className="home-scene-caption">
          <FiMoon aria-hidden="true" /> A familiar place. A new favorite game.
        </p>
      </div>

      <div className="home-content">
        <RoundPreview />

        <section className="home-how" aria-labelledby="home-how-heading">
          <div className="home-section-heading">
            <h2 id="home-how-heading">A good night starts with one room.</h2>
            <span className="home-small">Three simple steps</span>
          </div>
          <ol className="home-steps">
            {howToPlay.map((step, index) => (
              <li key={step.title}>
                <span className="home-step-number" aria-hidden="true">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="home-footer">
          <span>Made for people who never skip the opening.</span>
          <details>
            <summary>Scoring rules</summary>
            <p>
              With four players: +4, +3, +2, then +1 for correct guesses in order.
              Wrong answer: −1. Pass: 0.
            </p>
          </details>
        </footer>
      </div>
    </CafePage>
  );
}
