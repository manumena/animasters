import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Rooms from './Rooms';
import { defaultAvatar, saveAvatar } from '../avatars/preferences';
import { enterRoom, savedSession, watchRoom } from '../rooms/client';

vi.mock('../rooms/client', async importOriginal => ({
  ...await importOriginal<typeof import('../rooms/client')>(),
  enterRoom: vi.fn(), savedSession: vi.fn(), watchRoom: vi.fn(),
}));
const session = {
  room: { code: 'A7B2', hostId: 'host', phase: 'lobby' as const, players: [{ id: 'host', nickname: 'Manu', connected: false }] },
  playerId: 'host', token: 'private',
};
beforeEach(() => {
  localStorage.clear();
  vi.mocked(savedSession).mockReturnValue(null);
  vi.mocked(enterRoom).mockResolvedValue(session);
  vi.mocked(watchRoom).mockReturnValue(() => {});
});
function setup(path = '/rooms') {
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/rooms/:code?" element={<Rooms />} /></Routes></MemoryRouter>);
  return userEvent.setup();
}

it('creates a room with the grouped avatar choices and displays its shareable code', async () => {
  const user = setup();
  await user.type(screen.getByLabelText(/Nickname/), 'Manu');
  await user.click(screen.getByRole('button', { name: 'Next hair style' }));
  await user.click(screen.getByRole('button', { name: 'Face & prop' }));
  expect(screen.queryByRole('button', { name: 'Next hair style' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Previous prop' }));
  expect(screen.getByText('Red scarf')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Next prop' }));
  expect(screen.getByText('None')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Next prop' }));
  expect(screen.getByText('Luffy’s straw hat')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Create my room' }));
  expect(await screen.findByRole('heading', { name: 'Your room' })).toBeVisible();
  expect(enterRoom).toHaveBeenCalledWith('Manu', undefined, { ...defaultAvatar, hair: 'bob', prop: 'straw' });
  expect(screen.getByText('A7B2')).toBeVisible();
  expect(screen.getByText(/Manu \(you\) · Host/)).toBeVisible();
});

it('joins by normalized code with the look saved in this browser', async () => {
  const avatar = { ...defaultAvatar, skin: 'mint', prop: 'headphones' } as const;
  saveAvatar(avatar);
  const user = setup();
  expect(screen.getByText('Mint green')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Join room' }));
  await user.type(screen.getByLabelText(/Nickname/), 'Manu');
  await user.type(screen.getByLabelText(/Room code/), 'a-7b!2');
  expect(screen.getByLabelText(/Room code/)).toHaveValue('A7B2');
  await user.click(screen.getByRole('button', { name: 'Join this room' }));
  await screen.findByRole('heading', { name: 'Your room' });
  expect(enterRoom).toHaveBeenCalledWith('Manu', 'A7B2', avatar);
});

it('prefills invite links and reports a missing room', async () => {
  vi.mocked(enterRoom).mockRejectedValue(new Error('Room not found or expired.'));
  const user = setup('/rooms/a7b2');
  expect(screen.getByLabelText(/Room code/)).toHaveValue('A7B2');
  await user.type(screen.getByLabelText(/Nickname/), 'Manu');
  await user.click(screen.getByRole('button', { name: 'Join this room' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Room not found or expired.');
});

it('restores this device’s saved player without creating another membership', () => {
  vi.mocked(savedSession).mockReturnValue(session);
  setup('/rooms/A7B2');
  expect(screen.getByRole('heading', { name: 'Your room' })).toBeVisible();
  expect(enterRoom).not.toHaveBeenCalled();
  expect(watchRoom).toHaveBeenCalledWith(session, expect.any(Function), expect.any(Function), expect.any(Object));
});
