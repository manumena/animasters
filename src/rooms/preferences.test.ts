import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup() {
  const send = vi.fn(() => true);
  const controller = new RoomPreferencesController(room, 'host', send);
  controller.setConnection(true);
  controller.receive(room);
  return { controller, send };
}

it('debounces count typing and does not save invalid intermediate values', () => {
  const { controller, send } = setup();
  controller.changeAmount('');
  vi.advanceTimersByTime(500);
  expect(send).not.toHaveBeenCalled();
  controller.changeAmount('1');
  vi.advanceTimersByTime(300);
  controller.changeAmount('12');
  vi.advanceTimersByTime(449);
  expect(send).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(send).toHaveBeenCalledExactlyOnceWith({
    type: 'settings',
    settings: { ...room.settings, amount: 12 },
    settingsRevision: 2,
  });
  expect(controller.getSnapshot().blocked).toBe(true);
});

it('serializes rapid toggles and uses the acknowledged revision for queued edits', () => {
  const { controller, send } = setup();
  controller.changeType('includeEndings', false);
  controller.changeType('includeSoundtracks', true);
  controller.changeType('includeOpenings', false);
  expect(send).toHaveBeenCalledTimes(1);
  controller.receive({
    ...room,
    settings: { ...room.settings!, includeEndings: false },
    settingsRevision: 3,
  });
  expect(send).toHaveBeenCalledTimes(2);
  const finalSettings = {
    ...room.settings!,
    includeEndings: false,
    includeOpenings: false,
    includeSoundtracks: true,
  };
  expect(send).toHaveBeenLastCalledWith({
    type: 'settings',
    settings: finalSettings,
    settingsRevision: 3,
  });
  expect(controller.getSnapshot().draft).toMatchObject(finalSettings);
  controller.receive({ ...room, settings: finalSettings, settingsRevision: 4 });
  expect(controller.getSnapshot()).toMatchObject({
    blocked: false,
    status: 'Saved',
  });
});

it('preserves newer count typing while an older save is acknowledged', () => {
  const { controller, send } = setup();
  controller.changeType('includeEndings', false);
  controller.changeAmount('8');
  controller.receive({
    ...room,
    settings: { ...room.settings!, includeEndings: false },
    settingsRevision: 3,
  });
  expect(controller.getSnapshot().amount).toBe('8');
  expect(send).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(450);
  expect(send).toHaveBeenLastCalledWith({
    type: 'settings',
    settings: { ...room.settings, includeEndings: false, amount: 8 },
    settingsRevision: 3,
  });
});

it.each([true, false])(
  'resolves an uncertain connection loss before retrying (applied: %s)',
  (applied) => {
    const { controller, send } = setup();
    controller.changeType('includeEndings', false);
    controller.setConnection(false);
    vi.advanceTimersByTime(9000);
    controller.setConnection(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().blocked).toBe(true);
    controller.receive(
      applied
        ? {
            ...room,
            settings: { ...room.settings!, includeEndings: false },
            settingsRevision: 3,
          }
        : room,
    );
    expect(send).toHaveBeenCalledTimes(applied ? 1 : 2);
    expect(controller.getSnapshot().blocked).toBe(!applied);
  },
);

it('adopts conflicting settings from another tab without automatically overwriting them', () => {
  const { controller, send } = setup();
  controller.changeAmount('12');
  controller.receive({
    ...room,
    settings: { ...room.settings!, amount: 7 },
    settingsRevision: 3,
  });
  vi.advanceTimersByTime(500);
  expect(send).not.toHaveBeenCalled();
  expect(controller.getSnapshot()).toMatchObject({
    amount: '7',
    blocked: true,
    error: expect.stringContaining('elsewhere'),
  });
  controller.retry();
  expect(controller.getSnapshot().blocked).toBe(false);
  expect(send).not.toHaveBeenCalled();
});

it('shows confirmation failures, blocks readiness and retries the same unconfirmed payload', () => {
  const { controller, send } = setup();
  controller.changeType('includeEndings', false);
  vi.advanceTimersByTime(8000);
  expect(controller.getSnapshot()).toMatchObject({
    blocked: true,
    error: expect.stringContaining('confirm'),
  });
  controller.retry();
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);
  controller.receive({
    ...room,
    settings: { ...room.settings!, includeEndings: false },
    settingsRevision: 3,
  });
  expect(controller.getSnapshot()).toMatchObject({
    blocked: false,
    error: '',
    status: 'Saved',
  });
});

it('preserves a rejected draft and stops saving until a retry or edit', () => {
  const { controller, send } = setup();
  controller.changeType('includeEndings', false);
  controller.reject('Server rejected this change.');
  controller.receive(room);
  expect(send).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().draft?.includeEndings).toBe(false);
  controller.retry();
  expect(send).toHaveBeenCalledTimes(2);
});

it('cancels pending typing when the room controller is disposed', () => {
  const { controller, send } = setup();
  controller.changeAmount('10');
  controller.dispose();
  vi.advanceTimersByTime(1000);
  expect(send).not.toHaveBeenCalled();
});
