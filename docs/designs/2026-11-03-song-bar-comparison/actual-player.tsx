/* global document */

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Button, ThemeProvider, createTheme } from '@mui/material';
import CafePage, { CafeHeader } from '../../../src/components/CafePage';
import { RoomAudio } from '../../../src/rooms/audio';
import RoomPlayback, { RoomAudioNotice } from '../../../src/rooms/RoomPlayback';
import '../../../src/styles.css';
import '../../../src/rooms/RoomMatch.css';

const audioBase = 'https://dszqiegiplfnrnovpqvn.supabase.co/storage/v1/object/public/animasters/';
const theme = createTheme({ palette: { primary: { main: '#f8f9fa' } } });

/** Exercise the actual player and scheduling without creating a room or socket. */
function ActualPlayerPreview() {
  const [audio] = useState(() => new RoomAudio());
  const [error, setError] = useState('');

  useEffect(() => () => audio.dispose(), [audio]);

  async function loadSong(nextSong: boolean) {
    setError('');
    try {
      await audio.enable();
      const path = nextSong
        ? 'Dragon%20Ball%20Z/Dragon%20Ball%20Z%20-%20Boku-tachi%20wa%20Tenshi%20datta.mp3'
        : 'Chainsawman/kick_back.mp3';
      await audio.prepare({
        id: `player-preview-${Date.now()}`,
        number: nextSong ? 2 : 1,
        total: 2,
        startsAt: Date.now() + (nextSong ? 3000 : -1),
        audioUrl: audioBase + path,
      }, Date.now);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Audio could not be enabled.');
    }
  }

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <div className="main-container">
          <CafePage className="room-match-page">
            <CafeHeader />
            <div className="room-match">
              <div className="room-match-heading">
                <div>
                  <p className="room-match-eyebrow">Development preview · production player</p>
                  <h1>Live song spectrum</h1>
                  <p className="room-match-muted">Centered rounded bars · 60 ms falling time · 0 dB visual sensitivity</p>
                </div>
              </div>
              <section className="room-match-panel" aria-label="Preview controls">
                <Button variant="outlined" onClick={() => { void loadSong(false); }}>Load Kick Back</Button>
                <Button variant="outlined" onClick={() => { void loadSong(true); }}>Next song in 3 seconds</Button>
                {error && <p role="alert">{error}</p>}
              </section>
              <RoomAudioNotice audio={audio} onEnable={() => { void audio.enable(); }} />
              <RoomPlayback audio={audio} guessing />
            </div>
          </CafePage>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing preview root element.');
createRoot(root).render(<StrictMode><ActualPlayerPreview /></StrictMode>);
