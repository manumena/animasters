import { beforeEach, expect, it, vi } from 'vitest';
import { enterRoom, normalizeRoomCode, savedNickname, savedSession } from './client';

beforeEach(() => localStorage.clear());

it('uppercases ASCII code input, strips special characters and limits it to four', () => {
  expect(normalizeRoomCode('a7b2')).toBe('A7B2');
  expect(normalizeRoomCode(' a-7_b!2z')).toBe('A7B2');
  expect(normalizeRoomCode('ßあé１２')).toBe('');
});

it('stores the nickname and private reconnect credential after creating a room', async () => {
  const session = {
    room: { code: 'A7B2', hostId: 'host', phase: 'lobby', players: [{ id: 'host', nickname: 'Host', connected: false }] },
    playerId: 'host', token: 'secret',
  };
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(session, { status: 201 }));
  expect(await enterRoom(' Host ')).toEqual(session);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/rooms$/), expect.objectContaining({ body: '{"nickname":"Host"}' }));
  expect(savedSession('A7B2')).toEqual(session);
  expect(savedNickname()).toBe('Host');
});

it('saves the joining player’s accepted nickname for future rooms', async () => {
  localStorage.setItem('animasters.nickname', 'Old name');
  const session = {
    room: {
      code: 'A7B2', hostId: 'host', phase: 'lobby',
      players: [
        { id: 'host', nickname: 'Host', connected: true },
        { id: 'guest', nickname: 'Café', connected: false },
      ],
    },
    playerId: 'guest', token: 'secret',
  };
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(session, { status: 201 }));

  await enterRoom('Cafe\u0301', 'A7B2');

  expect(savedNickname()).toBe('Café');
});

it('shows API errors and keeps the last successful nickname', async () => {
  localStorage.setItem('animasters.nickname', 'Host');
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'This room is full.' }, { status: 409 }));
  await expect(enterRoom('Guest', 'A7B2')).rejects.toThrow('This room is full.');
  expect(savedSession('A7B2')).toBeNull();
  expect(savedNickname()).toBe('Host');
});

it('tolerates malformed stored credentials', () => {
  localStorage.setItem('animasters.room.A7B2', '{');
  expect(savedSession('A7B2')).toBeNull();
  localStorage.setItem('animasters.room.A7B2', '{}');
  expect(savedSession('A7B2')).toBeNull();
});

it('clears an expired membership and stops before opening a socket', async () => {
  const { watchRoom } = await import('./client');
  const session = { room: { code: 'A7B2', hostId: 'host', phase: 'lobby' as const, players: [] }, playerId: 'host', token: 'secret' };
  localStorage.setItem('animasters.room.A7B2', JSON.stringify(session));
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Expired' }, { status: 404 }));
  const status = vi.fn();
  const stop = watchRoom(session, vi.fn(), status);
  await vi.waitFor(() => expect(status).toHaveBeenCalledWith(expect.stringContaining('expired')));
  expect(savedSession('A7B2')).toBeNull();
  stop();
});
