import { useEffect } from 'react';
import './KeyboardShortcuts.css';

export function ShortcutKeycaps({ includeSpace = false }: { includeSpace?: boolean }) {
  // Decorative hints keep the action's accessible name concise. The button's
  // aria-keyshortcuts exposes the same shortcuts to assistive technology.
  return (
    <span className="room-shortcut-keycaps" aria-hidden="true">
      <kbd>Enter ↵</kbd>
      {includeSpace && (
        <>
          <span>or</span>
          <kbd>Space ␣</kbd>
        </>
      )}
    </span>
  );
}

export function useReadyShortcut(enabled: boolean, onReady: () => void) {
  useEffect(() => {
    if (!enabled) return;

    function handleReadyShortcut(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.keyCode === 229
      ) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      // Keep native keyboard behavior on links, playback controls and editable
      // fields. In particular, Space must remain available for typing titles.
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          'button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="combobox"], [role="textbox"]',
        )
      ) return;

      event.preventDefault();
      onReady();
    }

    window.addEventListener('keydown', handleReadyShortcut);
    return () => window.removeEventListener('keydown', handleReadyShortcut);
  }, [enabled, onReady]);
}
