import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import NextSongCountdown from './NextSongCountdown';

let localNow: number;
let nextFrame: FrameRequestCallback | undefined;

beforeEach(() => {
  localNow = 0;
  nextFrame = undefined;
  vi.spyOn(performance, 'now').mockImplementation(() => localNow);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    nextFrame = callback;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    nextFrame = undefined;
  });
});

function advanceFrame(milliseconds: number) {
  localNow += milliseconds;
  act(() => nextFrame?.(localNow));
}

it('drains between whole-second ticks without changing the displayed number', () => {
  const { container } = render(<NextSongCountdown startsAt={11_000} now={1000} />);
  const arc = container.querySelector<SVGCircleElement>('.next-song-countdown-arc')!;

  advanceFrame(250);
  expect(Number(arc.style.strokeDashoffset)).toBeCloseTo(0.025);
  advanceFrame(250);
  expect(Number(arc.style.strokeDashoffset)).toBeCloseTo(0.05);
  expect(screen.getByRole('timer')).toHaveAccessibleName('Next song in 10 seconds');
});

it('follows a shortened server deadline and synchronized clock updates', () => {
  const { container, rerender } = render(<NextSongCountdown startsAt={11_000} now={1000} />);
  advanceFrame(500);

  rerender(<NextSongCountdown startsAt={2000} now={1500} />);
  expect(screen.getByRole('timer')).toHaveAccessibleName('Next song in 1 second');
  expect(screen.getByText('Get ready to listen')).toBeVisible();
  expect(container.querySelector('[data-urgent="true"]')).toBeInTheDocument();

  advanceFrame(250);
  const arc = container.querySelector<SVGCircleElement>('.next-song-countdown-arc')!;
  expect(Number(arc.style.strokeDashoffset)).toBeCloseTo(0.975);
});

it('catches up after suspension, hides the endpoint and cancels on unmount', () => {
  const { container, rerender, unmount } = render(<NextSongCountdown startsAt={11_000} now={1000} />);
  advanceFrame(12_000);
  const arc = container.querySelector<SVGCircleElement>('.next-song-countdown-arc')!;
  expect(arc.style.visibility).toBe('hidden');
  expect(Number(arc.style.strokeDashoffset)).toBe(1);

  rerender(<NextSongCountdown startsAt={11_000} now={13_000} />);
  expect(screen.getByText('Next song starting')).toBeVisible();
  expect(screen.getByRole('timer')).toHaveAccessibleName('Next song in 0 seconds');
  unmount();
  expect(nextFrame).toBeUndefined();
});

it('waits for clock synchronization instead of displaying an invented countdown', () => {
  const { container } = render(<NextSongCountdown startsAt={11_000} now={0} />);
  expect(screen.getByRole('timer')).toHaveAccessibleName('Waiting for next song timing');
  expect(screen.getByText('Syncing countdown…')).toBeVisible();
  expect(container.querySelector<SVGCircleElement>('.next-song-countdown-arc')!.style.visibility).toBe('hidden');
  expect(nextFrame).toBeUndefined();
});
