import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { RoomAudio } from './audio';
import RoomPlayback from './RoomPlayback';

beforeEach(() => localStorage.clear());

it.each([0, 0.35])('restores the slider to volume %s after a page reload', (volume) => {
  const audio = new RoomAudio();
  const { unmount } = render(<RoomPlayback audio={audio} guessing />);

  fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), {
    target: { value: String(volume) },
  });
  unmount();
  audio.dispose();

  render(<RoomPlayback audio={new RoomAudio()} guessing />);
  expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue(String(volume));
});

it.each([0, 0.35])('keeps volume %s when controls return for the next round', (volume) => {
  const audio = new RoomAudio();
  const { rerender, unmount } = render(<RoomPlayback audio={audio} guessing />);

  fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), {
    target: { value: String(volume) },
  });

  rerender(<RoomPlayback audio={audio} guessing={false} />);
  expect(screen.queryByRole('slider', { name: 'Volume' })).not.toBeInTheDocument();

  rerender(<RoomPlayback audio={audio} guessing />);
  expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue(String(volume));

  // The controller outlives the playback panel during reveal transitions.
  unmount();
  render(<RoomPlayback audio={audio} guessing />);
  expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue(String(volume));
});
