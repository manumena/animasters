import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MatchCountdown from './MatchCountdown';

afterEach(() => vi.useRealTimers());

it('keeps counting through generation and uses the same deadline once songs arrive', () => {
  const { rerender } = render(<MatchCountdown startsAt={6_000} now={1_000} preparing />);
  expect(screen.getByRole('timer')).toHaveTextContent('5');

  rerender(<MatchCountdown startsAt={6_000} now={3_000} preparing />);
  expect(screen.getByRole('timer')).toHaveTextContent('3');

  rerender(<MatchCountdown startsAt={6_000} now={4_000} />);
  expect(screen.getByRole('timer')).toHaveTextContent('2');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('shows an error when the countdown expires before generation responds', () => {
  const { rerender } = render(<MatchCountdown startsAt={6_000} now={1_000} preparing />);

  rerender(<MatchCountdown startsAt={6_000} now={6_000} preparing />);
  expect(screen.getByRole('timer')).toHaveTextContent('0');
  expect(screen.getByRole('alert')).toHaveTextContent('This is taking longer than expected.');
});

it('ticks locally while timing is unavailable instead of holding at five', () => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000);
  const { rerender } = render(<MatchCountdown now={0} preparing />);

  vi.setSystemTime(3_000);
  rerender(<MatchCountdown now={0} preparing />);
  expect(screen.getByRole('timer')).toHaveTextContent('3');

  vi.setSystemTime(6_000);
  rerender(<MatchCountdown now={0} preparing />);
  expect(screen.getByRole('alert')).toBeVisible();
});
