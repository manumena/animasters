import { beforeEach, expect, it, vi } from 'vitest';
import { enterRoom, normalizeRoomCode, savedSession } from './client';

beforeEach(() => localStorage.clear());

it('uppercases ASCII code input, strips special characters and limits it to four', () => {
  expect(normalizeRoomCode('a7b2')).toBe('A7B2');
  expect(normalizeRoomCode(' a-7_b!2z')).toBe('A7B2');
  expect(normalizeRoomCode('ßあé１２')).toBe('');
});

it('stores the private reconnect credential without adding it to the request URL', async () => {
  const session = { room: { code: 'A7B2', hostId: 'host', phase: 'lobby', players: [] }, playerId: 'host', token: 'secret' };
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(session, { status: 201 }));
  expect(await enterRoom(' Host ')).toEqual(session);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/rooms$/), expect.objectContaining({ body: '{"nickname":"Host"}' }));
  expect(savedSession('A7B2')).toEqual(session);
});

it('shows API errors without saving a broken session', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'This room is full.' }, { status: 409 }));
  await expect(enterRoom('Guest', 'A7B2')).rejects.toThrow('This room is full.');
  expect(savedSession('A7B2')).toBeNull();
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
