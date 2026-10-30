import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import RoomPreferences from './RoomPreferences';
import { RoomPreferencesController } from './preferences';
import type { RoomSnapshot } from './client';

const room: RoomSnapshot = {
  code: 'A7B2',
  hostId: 'host',
  phase: 'lobby',
  settingsRevision: 2,
  settings: {
    amount: 40,
    repeatAnimes: false,
    includeOpenings: true,
    includeEndings: true,
    includeSoundtracks: false,
  },
  players: [{ id: 'host', nickname: 'Manu', connected: true, ready: false }],
};
const controllers: RoomPreferencesController[] = [];

afterEach(() =>
  controllers.splice(0).forEach((controller) => controller.dispose()),
);

function setup(isHost = true) {
  const send = vi.fn(() => true);
  const controller = new RoomPreferencesController(
    room,
    isHost ? 'host' : 'guest',
    send,
  );
  controllers.push(controller);
  controller.setConnection(true);
  controller.receive(room);
  const view = render(
    <RoomPreferences controller={controller} isHost={isHost} isReady={false} />,
  );
  return { ...view, controller, send, user: userEvent.setup() };
}

it('autosaves a toggle without save labels and waits for server confirmation', async () => {
  const { user, send, controller } = setup();
  expect(
    screen.queryByRole('button', { name: /Save|Cancel/ }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByLabelText('Include endings'));
  expect(send).toHaveBeenCalledWith({
    type: 'settings',
    settings: { ...room.settings, includeEndings: false },
    settingsRevision: 2,
  });
  expect(
    screen.queryByText(/Saved|Saving|Changes save automatically/),
  ).not.toBeInTheDocument();
  expect(controller.getSnapshot().blocked).toBe(true);
  act(() =>
    controller.receive({
      ...room,
      settings: { ...room.settings!, includeEndings: false },
      settingsRevision: 3,
    }),
  );
  expect(controller.getSnapshot().blocked).toBe(false);
});

it('offers four presets, saves immediately and preserves the choice when remounting', async () => {
  const { user, send, controller, unmount } = setup();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  for (const amount of [5, 10, 20, 50]) {
    expect(
      screen.getByRole('button', { name: `${amount} songs` }),
    ).toBeVisible();
  }
  await user.click(screen.getByRole('button', { name: '20 songs' }));
  expect(send).toHaveBeenCalledWith({
    type: 'settings',
    settings: { ...room.settings, amount: 20 },
    settingsRevision: 2,
  });
  // A second click on the active choice cannot deselect it or send an empty count.
  await user.click(screen.getByRole('button', { name: '20 songs' }));
  expect(send).toHaveBeenCalledTimes(1);
  unmount();
  render(<RoomPreferences controller={controller} isHost isReady={false} />);
  expect(screen.getByRole('button', { name: '20 songs' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(controller.getSnapshot().blocked).toBe(true);
});

it('shows guests a read-only summary', () => {
  setup(false);
  expect(
    screen.getByText('40 songs · Openings · Endings · No repeated anime'),
  ).toBeVisible();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(
    screen.getByText('Only the host can change these settings.'),
  ).toBeVisible();
});

it('locks ready hosts and explains how to return to editing', () => {
  const { controller, rerender } = setup();
  act(() =>
    controller.receive({
      ...room,
      players: [{ ...room.players[0], ready: true }],
    }),
  );
  rerender(<RoomPreferences controller={controller} isHost isReady />);
  expect(screen.getByRole('button', { name: '20 songs' })).toBeDisabled();
  expect(screen.getByLabelText('Include endings')).toBeDisabled();
  expect(
    screen.getByText(/Return to the lobby and click Not ready/),
  ).toBeVisible();
});
