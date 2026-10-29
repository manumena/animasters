import { useEffect, useRef } from 'react';
import { createHomeSpectrum } from './homeSpectrumMotion';

const initialLevels = createHomeSpectrum().sample();

/** A silent homepage illustration; animation updates the bars without React renders. */
export default function HomeSpectrum() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    // Keep a useful static illustration if animation APIs are unavailable.
    if (!container || !window.matchMedia || !window.requestAnimationFrame) return;

    const bars = Array.from(container.querySelectorAll('span'));
    const spectrum = createHomeSpectrum();
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inViewport = true;
    let frameId: number | null = null;
    let previousTime = 0;

    function paint(levels: number[]) {
      bars.forEach((bar, index) => {
        bar.style.transform = `scaleY(${levels[index].toFixed(4)})`;
      });
    }

    function shouldAnimate(): boolean {
      return !motionPreference.matches && !document.hidden && inViewport;
    }

    function tick(now: number) {
      frameId = null;
      if (!shouldAnimate()) return;

      const elapsed = (now - previousTime) / 1000;
      previousTime = now;
      paint(spectrum.advance(elapsed));
      frameId = requestAnimationFrame(tick);
    }

    function stop() {
      if (frameId === null) return;
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    function updatePlayback() {
      if (!shouldAnimate()) {
        stop();
        return;
      }
      if (frameId !== null) return;

      // Resume from this moment rather than counting time spent hidden or offscreen.
      previousTime = performance.now();
      frameId = requestAnimationFrame(tick);
    }

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      inViewport = entries.some(entry => entry.isIntersecting);
      updatePlayback();
    });

    paint(spectrum.sample());
    observer?.observe(container);
    motionPreference.addEventListener('change', updatePlayback);
    document.addEventListener('visibilitychange', updatePlayback);
    updatePlayback();

    // React Strict Mode remounts effects; dispose every subscription and pending frame.
    return () => {
      stop();
      observer?.disconnect();
      motionPreference.removeEventListener('change', updatePlayback);
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, []);

  return (
    <div className="home-wave" ref={containerRef} aria-hidden="true">
      {initialLevels.map((level, index) => (
        <span key={index} style={{ transform: `scaleY(${level.toFixed(4)})` }} />
      ))}
    </div>
  );
}
