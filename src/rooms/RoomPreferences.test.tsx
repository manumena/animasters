import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import RoomPreferences from './RoomPreferences';

const settings = { amount: 40, repeatAnimes: false, includeOpenings: true, includeEndings: true, includeSoundtracks: true };
function setup(overrides = {}) {
  const props = {
    settings, isHost: true, connected: true, canReady: true, isReady: false,
    onSave: vi.fn(), onReady: vi.fn(), onUnready: vi.fn(), ...overrides,
  };
  const view = render(<RoomPreferences {...props} />);
  return { ...view, props, user: userEvent.setup() };
}

it('saves the same count/type preferences and blocks Ready while edits are unsaved', async () => {
  const { user, props } = setup();
  await user.clear(screen.getByLabelText('Songs per match'));
  await user.type(screen.getByLabelText('Songs per match'), '10');
  await user.click(screen.getByLabelText('Include endings'));
  await user.click(screen.getByLabelText('Include soundtracks'));
  expect(screen.getByRole('button', { name: 'Enable audio & Ready' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Save settings' }));
  expect(props.onSave).toHaveBeenCalledWith({ ...settings, amount: 10, includeEndings: false, includeSoundtracks: false });
});

it('shows guests the saved preferences without editing controls', () => {
  setup({ isHost: false, settings: { ...settings, amount: 7, includeOpenings: false, includeEndings: false } });
  expect(screen.getByText('7 songs · Soundtracks · No repeated anime')).toBeVisible();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Save settings' })).not.toBeInTheDocument();
});

it('rejects invalid counts and lets a ready host withdraw before editing', async () => {
  const { user, props, rerender } = setup();
  await user.clear(screen.getByLabelText('Songs per match'));
  await user.type(screen.getByLabelText('Songs per match'), '0');
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Enable audio & Ready' })).toBeDisabled();
  rerender(<RoomPreferences {...props} isReady />);
  expect(screen.getByLabelText('Songs per match')).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Not ready' }));
  expect(props.onUnready).toHaveBeenCalledOnce();
});

it('preserves drafts on unrelated snapshots and resets them on a server revision', async () => {
  const { user, props, rerender } = setup();
  await user.clear(screen.getByLabelText('Songs per match'));
  await user.type(screen.getByLabelText('Songs per match'), '5');
  rerender(<RoomPreferences {...props} settings={{ ...settings }} />);
  expect(screen.getByLabelText('Songs per match')).toHaveValue(5);
  rerender(<RoomPreferences key={1} {...props} settings={{ ...settings, amount: 5 }} />);
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Enable audio & Ready' })).toBeEnabled();
});

it('explains that no selected types includes every song type', () => {
  setup({ isHost: false, settings: { ...settings, includeOpenings: false, includeEndings: false, includeSoundtracks: false } });
  expect(screen.getByText('40 songs · All song types · No repeated anime')).toBeVisible();
});
