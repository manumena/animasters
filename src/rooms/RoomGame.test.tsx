import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import RoomGame from './RoomGame';
import { watchRoom, type RoomSession } from './client';

// Exercise the screen's socket actions and phase transitions without downloading
// a catalog or opening a real audio device. Those have their own focused tests.
const mocks = vi.hoisted(() => ({
  send: vi.fn(() => true),
  enable: vi.fn(async () => {}),
  pause: vi.fn(),
  prepare: vi.fn(async () => {}),
  audioState: { enabled: true, loading: false, duration: 90 },
  catalogState: { phase: 'ready' },
}));

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  watchRoom: vi.fn(),
}));
vi.mock('../catalog/client', () => ({
  CatalogClient: class {
    getSnapshot = () => mocks.catalogState;
    subscribe = () => () => {};
    start() {}
    dispose() {}
  },
}));
vi.mock('./audio', () => ({
  RoomAudio: class {
    getSnapshot = () => mocks.audioState;
    subscribe = () => () => {};
    enable = mocks.enable;
    pause = mocks.pause;
    prepare = mocks.prepare;
    dispose() {}
  },
}));
vi.mock('../components/AnimeAutocomplete', () => ({
  default: () => <div>Anime search</div>,
}));

function completedSession(playerId = 'host'): RoomSession {
  return {
    playerId,
    token: 'private-token',
    room: {
      code: 'AB12',
      hostId: 'host',
      phase: 'completed',
      catalogVersion: 'catalog-v1',
      settingsRevision: 3,
      settings: {
        amount: 1,
        repeatAnimes: false,
        includeOpenings: true,
        includeEndings: false,
        includeSoundtracks: false,
      },
      players: [
        {
          id: 'host',
          nickname: 'Host',
          connected: true,
          score: 2,
          ready: false,
        },
        {
          id: 'guest',
          nickname: 'Guest',
          connected: true,
          score: 0,
          ready: false,
        },
      ],
      result: {
        roundId: 'last-song',
        number: 1,
        anime: 'Example anime',
        name: 'Example song',
        players: [],
      },
    },
  };
}

beforeEach(() => {
  vi.mocked(watchRoom).mockImplementation(
    (session, onRoom, onStatus, callbacks) => {
      callbacks?.onSender?.(mocks.send);
      callbacks?.onClock?.(Date.now() - performance.now());
      onStatus('Connected');
      onRoom(session.room);
      return () => {};
    },
  );
});

it('keeps final standings visible while the host saves preferences and opts into a rematch', async () => {
  const session = completedSession();
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <RoomGame session={session} onBack={vi.fn()} />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { name: 'Final standings' }),
  ).toBeVisible();
  expect(screen.getByText(/Host \(you\).*2 points/)).toBeVisible();
  expect(mocks.pause).toHaveBeenCalled();

  await user.click(screen.getByLabelText('Include endings'));
  expect(mocks.send).toHaveBeenLastCalledWith({
    type: 'settings',
    settings: { ...session.room.settings, includeEndings: true },
    settingsRevision: 3,
  });

  const receiveSnapshot = vi.mocked(watchRoom).mock.calls[0][1];
  const updatedRoom = {
    ...session.room,
    settings: { ...session.room.settings!, includeEndings: true },
    settingsRevision: 4,
  };
  act(() => receiveSnapshot(updatedRoom));
  await user.click(
    screen.getByRole('button', { name: 'Ready for next match' }),
  );
  expect(mocks.enable).toHaveBeenCalledOnce();
  expect(mocks.send).toHaveBeenLastCalledWith({
    type: 'ready-next-match',
    completedRoundId: 'last-song',
    catalogVersion: 'catalog-v1',
    settingsRevision: 4,
  });

  act(() =>
    receiveSnapshot({
      ...updatedRoom,
      players: updatedRoom.players.map((player) => ({
        ...player,
        ready: player.id === 'host',
      })),
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Not ready' }));
  expect(mocks.send).toHaveBeenLastCalledWith({ type: 'unready' });

  // A successful rematch replaces the final result and preloads the new song.
  const nextRound = {
    id: 'new-first',
    number: 1,
    total: 1,
    startsAt: Date.now() + 10_000,
    audioUrl: 'https://audio.example/new',
  };
  act(() =>
    receiveSnapshot({
      ...updatedRoom,
      phase: 'countdown',
      result: undefined,
      round: nextRound,
    }),
  );
  expect(
    screen.queryByRole('heading', { name: 'Next match preferences' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Example song')).not.toBeInTheDocument();
  expect(mocks.prepare).toHaveBeenCalledWith(nextRound, expect.any(Function));
});

it('lets a guest ready for another match without exposing host editing controls', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <RoomGame session={completedSession('guest')} onBack={vi.fn()} />
    </MemoryRouter>,
  );
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  expect(
    screen.getByText('Only the host can change these settings.'),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Ready for next match' }),
  );
  expect(mocks.send).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'ready-next-match' }),
  );
});

function lobbySession(playerId = 'host'): RoomSession {
  const session = completedSession(playerId);
  return {
    ...session,
    room: { ...session.room, phase: 'lobby', result: undefined },
  };
}

it('keeps Ready inside the code card and the growing player list last', async () => {
  const user = userEvent.setup();
  const session = lobbySession();
  const { container } = render(
    <MemoryRouter>
      <RoomGame session={session} onBack={vi.fn()} />
    </MemoryRouter>,
  );
  const invitation = screen.getByRole('region', {
    name: 'Room invitation and readiness',
  });
  expect(
    within(invitation).getByRole('button', { name: 'Ready to start' }),
  ).toBeVisible();
  expect(container.querySelector('.room-lobby')?.lastElementChild).toHaveClass(
    'room-lobby-players',
  );
  const back = screen.getByRole('button', { name: 'Back to room entry' });
  expect(
    back.compareDocumentPosition(invitation) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Ready to start' }));
  expect(mocks.enable).toHaveBeenCalledOnce();
  expect(mocks.send).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'ready', settingsRevision: 3 }),
  );
});

it('keeps autosaving after Back to lobby and blocks Ready until acknowledgement', async () => {
  const user = userEvent.setup();
  const session = lobbySession();
  render(
    <MemoryRouter>
      <RoomGame session={session} onBack={vi.fn()} />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: 'Match preferences' }));
  expect(screen.queryByText('AB12')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Save|Cancel|Ready/ }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByLabelText('Include endings'));
  await user.click(screen.getByRole('button', { name: 'Back to lobby' }));
  expect(screen.getByRole('button', { name: 'Ready to start' })).toBeDisabled();

  const receive = vi.mocked(watchRoom).mock.calls[0][1];
  act(() =>
    receive({
      ...session.room,
      settingsRevision: 4,
      settings: { ...session.room.settings!, includeEndings: true },
    }),
  );
  expect(screen.getByRole('button', { name: 'Ready to start' })).toBeEnabled();
  expect(screen.getByText('Openings · Endings')).toBeVisible();
});

it('offers guests Ready and a settings summary without the preferences button', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <RoomGame session={lobbySession('guest')} onBack={vi.fn()} />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  expect(mocks.enable).toHaveBeenCalledOnce();
  expect(
    screen.queryByRole('button', { name: 'Match preferences' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Next match' })).toHaveTextContent(
    'Openings',
  );
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
});
