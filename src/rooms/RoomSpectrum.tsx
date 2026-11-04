import { useEffect, useRef } from 'react';
import type { RoomAudio } from './audio';
import { SPECTRUM_BAR_COUNT } from './audioSpectrum';

const BAR_INDICES = Array.from({ length: SPECTRUM_BAR_COUNT }, (_, index) => index);
const RESTING_SCALE = 0.035;
const RISE_MILLISECONDS = 22;
const FALL_MILLISECONDS = 60;

/** Reads the player's signal without owning playback, scheduling or React state.
 * Per-frame transforms preserve the bars' shared center and rounded shape. */
export default function RoomSpectrum({ audio }: { audio: RoomAudio }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.matchMedia || !window.requestAnimationFrame) return;

    const bars = Array.from(container.querySelectorAll('span'));
    const targets = new Float32Array(SPECTRUM_BAR_COUNT);
    const levels = new Float32Array(SPECTRUM_BAR_COUNT);
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inViewport = true;
    let frameId: number | null = null;
    let previousTime = 0;

    function paint() {
      bars.forEach((bar, index) => {
        const scale = RESTING_SCALE + levels[index] * (1 - RESTING_SCALE);
        bar.style.transform = `scaleY(${scale.toFixed(4)})`;
      });
    }

    function shouldAnimate(): boolean {
      return !motionPreference.matches && !document.hidden && inViewport;
    }

    function tick(now: number) {
      frameId = null;
      if (!shouldAnimate()) return;

      const elapsed = Math.max(0, Math.min(100, now - previousTime));
      previousTime = now;
      audio.readSpectrum(targets);

      levels.forEach((current, index) => {
        const target = targets[index];
        const response = target > current ? RISE_MILLISECONDS : FALL_MILLISECONDS;
        levels[index] = current + (target - current) * (1 - Math.exp(-elapsed / response));
      });

      paint();
      frameId = requestAnimationFrame(tick);
    }

    function stop() {
      if (frameId === null) return;
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    function updateAnimation() {
      if (!shouldAnimate()) {
        stop();
        levels.fill(0);
        paint();
        return;
      }
      if (frameId !== null) return;

      // Hidden/offscreen time must not advance the visual response on resume.
      previousTime = performance.now();
      frameId = requestAnimationFrame(tick);
    }

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      inViewport = entries.some(entry => entry.isIntersecting);
      updateAnimation();
    });

    observer?.observe(container);
    motionPreference.addEventListener('change', updateAnimation);
    document.addEventListener('visibilitychange', updateAnimation);
    updateAnimation();

    // Strict Mode and reveal transitions can remount this view while audio lives on.
    return () => {
      stop();
      observer?.disconnect();
      motionPreference.removeEventListener('change', updateAnimation);
      document.removeEventListener('visibilitychange', updateAnimation);
    };
  }, [audio]);

  return (
    <div className="room-match-spectrum" ref={containerRef} aria-hidden="true">
      {BAR_INDICES.map(index => (
        <span key={index} style={{ transform: `scaleY(${RESTING_SCALE})` }} />
      ))}
    </div>
  );
}
