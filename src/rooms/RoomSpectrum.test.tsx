import { StrictMode } from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { RoomAudio } from './audio';
import RoomSpectrum from './RoomSpectrum';

let reducedMotion: boolean;
let hidden: boolean;
let clockTime: number;
let signal: number;
let media: EventTarget;
let frames: Map<number, FrameRequestCallback>;
let onIntersection: IntersectionObserverCallback;
let disconnect: ReturnType<typeof vi.fn>;
let readSpectrum: ReturnType<typeof vi.fn>;
let audio: RoomAudio;

beforeEach(() => {
  reducedMotion = false;
  hidden = false;
  clockTime = 0;
  signal = 1;
  media = new EventTarget();
  frames = new Map();
  disconnect = vi.fn();
  readSpectrum = vi.fn((levels: Float32Array) => levels.fill(signal));
  audio = { readSpectrum } as unknown as RoomAudio;
  let nextFrameId = 0;

  Object.defineProperty(media, 'matches', { get: () => reducedMotion });
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.spyOn(performance, 'now').mockImplementation(() => clockTime);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++nextFrameId;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) {
      onIntersection = callback;
    }
    observe() {}
    disconnect = disconnect;
  });
});

function advanceFrame(milliseconds: number) {
  clockTime += milliseconds;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach(callback => callback(clockTime)));
}

function barLevel(bar: HTMLSpanElement): number {
  return (Number(bar.style.transform.match(/[\d.]+/)![0]) - 0.035) / 0.965;
}

it('uses the playing signal with a 60 ms fall and settles when audio stops', () => {
  const { container } = render(<RoomSpectrum audio={audio} />);
  const bars = [...container.querySelectorAll('span')];
  expect(bars).toHaveLength(34);

  advanceFrame(22);
  const peak = barLevel(bars[0]);
  expect(peak).toBeCloseTo(1 - Math.exp(-1), 3);

  signal = 0;
  advanceFrame(60);
  expect(barLevel(bars[0])).toBeCloseTo(peak * Math.exp(-1), 3);
  for (let frame = 0; frame < 10; frame++) advanceFrame(60);
  expect(barLevel(bars[0])).toBeCloseTo(0, 3);
});

it('keeps reduced motion static and stops work while hidden or offscreen', () => {
  reducedMotion = true;
  const { container } = render(<RoomSpectrum audio={audio} />);
  expect(frames.size).toBe(0);
  expect(readSpectrum).not.toHaveBeenCalled();

  reducedMotion = false;
  act(() => media.dispatchEvent(new Event('change')));
  advanceFrame(22);
  expect(barLevel(container.querySelector('span')!)).toBeGreaterThan(0);

  hidden = true;
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(frames.size).toBe(0);
  expect(barLevel(container.querySelector('span')!)).toBe(0);

  act(() => onIntersection([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
  hidden = false;
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(frames.size).toBe(0);

  act(() => onIntersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(frames.size).toBe(1);
  reducedMotion = true;
  act(() => media.dispatchEvent(new Event('change')));
  expect(frames.size).toBe(0);
  expect(barLevel(container.querySelector('span')!)).toBe(0);
});

it('cleans up its frame loop and listeners through Strict Mode and unmount', () => {
  const { unmount } = render(<StrictMode><RoomSpectrum audio={audio} /></StrictMode>);
  expect(frames.size).toBe(1);
  advanceFrame(22);
  expect(readSpectrum).toHaveBeenCalledOnce();

  unmount();
  expect(frames.size).toBe(0);
  expect(disconnect).toHaveBeenCalledTimes(2);
  act(() => {
    media.dispatchEvent(new Event('change'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(frames.size).toBe(0);
});
