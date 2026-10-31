import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import RoomGame from './RoomGame';
import { watchRoom, type RoomSession, type GameAction } from './client';

// Exercise the screen's socket actions and phase transitions without downloading
// a catalog or opening a real audio device. Those have their own focused tests.
const mocks = vi.hoisted(() => ({
  send: vi.fn<(action: GameAction) => boolean>(() => true),
  enable: vi.fn(async () => {}),
  pause: vi.fn(),
  prepare: vi.fn(async () => {}),
  position: vi.fn(() => 0),
  play: vi.fn(),
  repeat: vi.fn(),
  seek: vi.fn(),
  volume: vi.fn(),
  cancelScheduled: vi.fn(),
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
    position = mocks.position;
    play = mocks.play;
    isRepeating = () => true;
    repeat = mocks.repeat;
    seek = mocks.seek;
    volume = mocks.volume;
    cancelScheduled = mocks.cancelScheduled;
    dispose() {}
  },
}));
vi.mock('../components/AnimeAutocomplete', () => ({
  default: ({
    onChange,
    disabled,
  }: {
    onChange: (answer: {
      id: number;
      title: string;
      detail: string;
      matchedAlias: string;
    }) => void;
    disabled: boolean;
  }) => (
    <button
      disabled={disabled}
      onClick={() =>
        onChange({
          id: 42,
          title: 'Example anime',
          detail: '',
          matchedAlias: 'Example anime',
        })
      }
    >
      Select anime
    </button>
  ),
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
  expect(
    screen.getByRole('region', { name: 'Players and scores' }),
  ).toHaveTextContent('Host (you)');
  expect(
    screen.getByRole('region', { name: 'Players and scores' }),
  ).toHaveTextContent('2 points');
  expect(mocks.pause).toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Match preferences' }));
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

function playingSession(): RoomSession {
  const session = completedSession();
  return {
    ...session,
    room: {
      ...session.room,
      phase: 'guessing',
      // Old results can remain in snapshots, but must stay hidden while guessing.
      round: {
        id: 'playing-round',
        number: 2,
        total: 5,
        startsAt: Date.now() - 10_000,
        deadline: Date.now() + 80_000,
        audioUrl: 'https://audio.example/current',
      },
    },
  };
}

it.each(['guess', 'pass'] as const)(
  'preserves %s commands, answer privacy and next-round readiness',
  async (action) => {
    const user = userEvent.setup();
    const session = playingSession();
    render(
      <MemoryRouter>
        <RoomGame session={session} onBack={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Example song')).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Your round result' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Round reveal' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit guess' })).toBeDisabled();
    if (action === 'guess') {
      await user.click(screen.getByRole('button', { name: 'Select anime' }));
      await user.click(screen.getByRole('button', { name: 'Submit guess' }));
    } else {
      await user.click(screen.getByRole('button', { name: 'Pass' }));
    }
    const sent = mocks.send.mock.calls.at(-1)?.[0];
    expect(sent).toEqual({
      type: 'guess',
      roundId: 'playing-round',
      actionId: expect.any(String),
      animeId: action === 'guess' ? 42 : null,
    });
    expect(screen.getByRole('button', { name: 'Pass' })).toBeDisabled();
    expect(screen.getByText('Submitting answer…')).toBeVisible();

    const receive = vi.mocked(watchRoom).mock.calls[0][1];
    const revealed = {
      ...session.room,
      phase: 'countdown' as const,
      round: {
        ...session.room.round!,
        id: 'next-round',
        number: 3,
        startsAt: Date.now() + 10_000,
        deadline: undefined,
      },
      result: {
        roundId: 'playing-round',
        number: 2,
        anime: 'Example anime',
        name: 'Example song',
        players: [
          {
            id: 'host',
            guess: action === 'guess' ? 'Example anime' : null,
            points: action === 'guess' ? 2 : 0,
            correct: action === 'guess',
          },
        ],
      },
    };
    act(() => receive(revealed));
    expect(screen.getByRole('status', { name: 'Your round result' })).toHaveTextContent(action === 'guess' ? 'You got it!' : 'Pass / no answer');
    expect(
      screen.getByRole('region', { name: 'Round reveal' }),
    ).toHaveTextContent('Example song');
    expect(
      screen.queryByRole('button', { name: 'Submit guess' }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Ready for next song now' }),
    );
    expect(mocks.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'ready', roundId: 'next-round' }),
    );

    act(() =>
      receive({
        ...revealed,
        phase: 'guessing',
        round: { ...revealed.round, startsAt: Date.now() - 1000 },
      }),
    );
    expect(screen.queryByText('Example song')).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Your round result' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pass' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Submit guess' })).toBeDisabled();
  },
);

it('keeps playback controls local without sending room commands', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <RoomGame session={playingSession()} onBack={vi.fn()} />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  await user.click(screen.getByRole('button', { name: 'Play' }));
  await user.click(screen.getByRole('button', { name: 'Repeat on' }));
  expect(mocks.pause).toHaveBeenCalledOnce();
  expect(mocks.play).toHaveBeenCalledOnce();
  expect(mocks.repeat).toHaveBeenCalledWith(false);
  expect(mocks.send).not.toHaveBeenCalled();
});

it('shows tied final scores without choosing an arbitrary winner', () => {
  const session = completedSession();
  session.room.players.forEach((player) => {
    player.score = -1;
  });
  render(
    <MemoryRouter>
      <RoomGame session={session} onBack={vi.fn()} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: "It's a tie." })).toBeVisible();
});
