import { StrictMode } from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import HomeSpectrum from './HomeSpectrum';

let reducedMotion: boolean;
let hidden: boolean;
let clockTime: number;
let media: EventTarget;
let frames: Map<number, FrameRequestCallback>;
let onIntersection: IntersectionObserverCallback;
let disconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  reducedMotion = false;
  hidden = false;
  clockTime = 0;
  media = new EventTarget();
  frames = new Map();
  disconnect = vi.fn();
  let nextFrameId = 0;

  Object.defineProperty(media, 'matches', { get: () => reducedMotion });
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.spyOn(performance, 'now').mockImplementation(() => clockTime);

  // Keep a deterministic browser frame queue to check pause/resume and cleanup.
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextFrameId;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { onIntersection = callback; }
    observe() {}
    disconnect = disconnect;
  });
});

function advanceFrame() {
  clockTime += 1000 / 60;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach(callback => callback(clockTime)));
}

it('keeps reduced-motion users static and responds to preference changes', () => {
  reducedMotion = true;
  const { container } = render(<HomeSpectrum />);
  const bars = [...container.querySelectorAll('span')];
  const initial = bars.map(bar => bar.style.transform);
  expect(bars).toHaveLength(21);
  expect(frames.size).toBe(0);

  reducedMotion = false;
  act(() => media.dispatchEvent(new Event('change')));
  expect(frames.size).toBe(1);
  advanceFrame();
  expect(bars.map(bar => bar.style.transform)).not.toEqual(initial);

  reducedMotion = true;
  act(() => media.dispatchEvent(new Event('change')));
  expect(frames.size).toBe(0);
  const paused = bars.map(bar => bar.style.transform);
  advanceFrame();
  expect(bars.map(bar => bar.style.transform)).toEqual(paused);
});

it('pauses for hidden tabs and offscreen content, resuming only when both are visible', () => {
  render(<HomeSpectrum />);
  expect(frames.size).toBe(1);

  hidden = true;
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(frames.size).toBe(0);

  act(() => onIntersection([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
  hidden = false;
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(frames.size).toBe(0);

  act(() => onIntersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(frames.size).toBe(1);
  advanceFrame();
  expect(frames.size).toBe(1);
});

it('owns only one frame loop in Strict Mode and removes it and its listeners on unmount', () => {
  const { unmount } = render(<StrictMode><HomeSpectrum /></StrictMode>);
  expect(frames.size).toBe(1);
  advanceFrame();
  expect(frames.size).toBe(1);

  unmount();
  expect(frames.size).toBe(0);
  expect(disconnect).toHaveBeenCalledTimes(2);

  act(() => {
    media.dispatchEvent(new Event('change'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(frames.size).toBe(0);
});
