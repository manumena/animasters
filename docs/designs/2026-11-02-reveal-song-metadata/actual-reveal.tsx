import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CatalogClient } from '../../../src/catalog/client';
import { RoomAudio } from '../../../src/rooms/audio';
import type { RoomSnapshot } from '../../../src/rooms/client';
import { RoomPreferencesController } from '../../../src/rooms/preferences';
import RoomMatch from '../../../src/rooms/RoomMatch';
import '../../../src/styles.css';

// Render production components with a fixed revealed snapshot. No room, socket,
// catalog worker or audio request is created, and the countdown stays inspectable.
const previewNow = Date.now();
const previewRoom: RoomSnapshot = {
  code: 'DEMO',
  hostId: 'me',
  phase: 'countdown',
  players: [
    { id: 'me', nickname: 'Manu', connected: true, score: 5 },
    { id: 'friend', nickname: 'Sakura', connected: true, score: 3, ready: true },
    { id: 'other', nickname: 'Spike', connected: true, score: 1 },
  ],
  round: {
    id: 'next-preview-song',
    number: 3,
    total: 10,
    audioUrl: '',
    startsAt: previewNow + 8_000,
  },
  result: {
    roundId: 'blue-bird-preview',
    number: 2,
    anime: 'Naruto Shippuden',
    name: 'Blue Bird',
    artistCredit: 'Ikimonogakari',
    songType: 'opening',
    sequenceNumber: 3,
    artworkUrl: 'https://dszqiegiplfnrnovpqvn.supabase.co/storage/v1/object/public/animasters/Naruto%20Shippuden/artwork/cover-43-f9b0b898ebc984b52b179637080eb5ae07d352b6571c3962a2fd2d6c9cfce106.jpg',
    players: [
      { id: 'me', guess: 'Naruto Shippuden', correct: true, points: 3 },
      { id: 'friend', guess: 'Naruto Shippuden', correct: true, points: 2 },
      { id: 'other', guess: 'Naruto', correct: false, points: -1 },
    ],
  },
};

const audio = new RoomAudio();
const catalog = new CatalogClient(() => {
  throw new Error('Catalog search is unavailable in this reveal preview.');
});
const preferences = new RoomPreferencesController(previewRoom, 'me', () => false);

function ActualRevealPreview() {
  const [room, setRoom] = useState(previewRoom);

  function markReady() {
    setRoom(current => ({
      ...current,
      players: current.players.map(player => player.id === 'me' ? { ...player, ready: true } : player),
    }));
  }

  return (
    <BrowserRouter>
      <div className="main-container">
        <RoomMatch
          room={room}
          playerId="me"
          status="Preview"
          error=""
          preparation={null}
          now={previewNow}
          deadline={previewNow + 8_000}
          guessing={false}
          canGuess={false}
          pendingGuess={false}
          ready
          rematchDisabled
          audio={audio}
          catalog={catalog}
          preferences={preferences}
          onGuess={() => {}}
          onReady={markReady}
          onUnready={() => {}}
          onEnableAudio={() => { void audio.enable(); }}
          onBack={() => { window.location.href = '/rooms'; }}
        />
      </div>
    </BrowserRouter>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing preview root element.');

createRoot(root).render(<ActualRevealPreview />);
