import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import RoundReveal from './RoundReveal';
import type { RoomSnapshot } from './client';
import { useReadyShortcut } from './KeyboardShortcuts';

const result: NonNullable<RoomSnapshot['result']> = {
  roundId: 'revealed-song',
  number: 2,
  anime: 'Naruto Shippuden',
  name: 'Blue Bird',
  artworkUrl: 'https://images.example/naruto-poster.jpg',
  players: [{ id: 'me', guess: 'Naruto Shippuden', points: 1, correct: true }],
};

function RevealWithReadyShortcut({ onReady }: { onReady: () => void }) {
  useReadyShortcut(true, onReady);
  return <RoundReveal result={result} playerId="me" />;
}

it('shows the full performer credit between the song title and song type', () => {
  render(<RoundReveal result={{ ...result, artistCredit: 'Masayuki Suzuki feat. Airi Suzuki', songType: 'opening', sequenceNumber: 3 }} playerId="me" />);

  const credit = screen.getByText('Masayuki Suzuki feat. Airi Suzuki');
  expect(credit).toHaveClass('round-reveal-artist');
  expect(credit.previousElementSibling).toHaveTextContent('Blue Bird');
  expect(credit.nextElementSibling).toHaveTextContent('Opening 3');
});

it.each([undefined, '', '  '])('omits the artist line for uncertain credits and older rooms (%s)', artistCredit => {
  render(<RoundReveal result={{ ...result, artistCredit }} playerId="me" />);
  expect(document.querySelector('.round-reveal-artist')).toBeNull();
  expect(screen.getByText('Blue Bird')).toBeVisible();
});

it.each([
  { songType: 'opening' as const, sequenceNumber: 3, label: 'Opening 3' },
  { songType: 'ending' as const, sequenceNumber: 2, label: 'Ending 2' },
  { songType: 'opening' as const, sequenceNumber: undefined, label: 'Opening' },
  { songType: 'ending' as const, sequenceNumber: 0, label: 'Ending' },
  { songType: 'opening' as const, sequenceNumber: 1.5, label: 'Opening' },
  { songType: 'soundtrack' as const, sequenceNumber: 1, label: 'Soundtrack' },
])('shows $label independently of the match position', ({ songType, sequenceNumber, label }) => {
  render(<RoundReveal result={{ ...result, songType, sequenceNumber }} playerId="me" />);

  expect(screen.getByText(label)).toHaveClass('round-reveal-metadata');
  expect(screen.getByText('Song 2 · The answer')).toBeVisible();
});

it('omits metadata for older rooms and never renders a sequence without a type', () => {
  render(<RoundReveal result={{ ...result, sequenceNumber: 3 }} playerId="me" />);
  expect(document.querySelector('.round-reveal-metadata')).toBeNull();
});

it('shows the full poster and its backdrop, and opens an accessible enlarged view', async () => {
  const user = userEvent.setup();
  const onReady = vi.fn();
  render(<RevealWithReadyShortcut onReady={onReady} />);

  const poster = screen.getByRole('img', { name: 'Naruto Shippuden poster' });
  expect(poster).toHaveAttribute('src', result.artworkUrl);
  fireEvent.load(poster);
  const decorativePoster = document.querySelector('.round-reveal-backdrop');
  expect(decorativePoster).toHaveAttribute('aria-hidden', 'true');

  const enlargeButton = screen.getByRole('button', { name: 'Enlarge Naruto Shippuden poster' });
  await user.click(enlargeButton);
  const dialog = screen.getByRole('dialog', { name: 'Naruto Shippuden poster' });
  expect(dialog).toBeVisible();
  fireEvent.keyDown(dialog, { key: 'Enter' });
  fireEvent.keyDown(dialog, { key: ' ' });
  expect(onReady).not.toHaveBeenCalled();
  expect(screen.getByRole('img', { name: 'Naruto Shippuden poster, enlarged' })).toHaveAttribute('src', result.artworkUrl);
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(enlargeButton).toHaveFocus();
  fireEvent.keyDown(document.body, { key: 'Enter' });
  expect(onReady).toHaveBeenCalledOnce();
});

it('falls back to the answer and music icon when artwork fails without losing next-song controls', () => {
  render(<RoundReveal result={result} playerId="me"><button>Ready for next song</button></RoundReveal>);

  const poster = screen.getByRole('img', { name: 'Naruto Shippuden poster' });
  fireEvent.load(poster);
  fireEvent.error(poster);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(document.querySelector('.round-reveal-backdrop')).toBeNull();
  expect(document.querySelector('.room-match-song-mark')).not.toBeNull();
  expect(screen.getByRole('heading', { name: 'Naruto Shippuden' })).toBeVisible();
  expect(screen.getByText('Blue Bird')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Ready for next song' })).toBeEnabled();
});

it('supports results from rooms created before artwork was available', () => {
  render(<RoundReveal result={{ ...result, artworkUrl: undefined }} playerId="me" />);
  expect(screen.queryByRole('button', { name: /Enlarge/ })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Naruto Shippuden' })).toBeVisible();
});
