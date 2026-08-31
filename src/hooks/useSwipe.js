import { useEffect } from 'react';

const MIN_SWIPE_PX = 24;

/**
 * Turns touch drags on `ref` into direction callbacks, so the game is playable
 * on a phone without an on-screen keyboard.
 */
export default function useSwipe(ref, onSwipe) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    let start = null;

    const handleStart = (event) => {
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
    };

    const handleMove = (event) => {
      if (!start) return;

      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_SWIPE_PX) return;

      // The dominant axis wins, so a diagonal drag still reads as one turn.
      if (Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? 'right' : 'left');
      } else {
        onSwipe(dy > 0 ? 'down' : 'up');
      }

      // Consume the gesture: the next turn needs a fresh drag.
      start = null;
      event.preventDefault();
    };

    const handleEnd = () => {
      start = null;
    };

    node.addEventListener('touchstart', handleStart, { passive: true });
    node.addEventListener('touchmove', handleMove, { passive: false });
    node.addEventListener('touchend', handleEnd);
    node.addEventListener('touchcancel', handleEnd);

    return () => {
      node.removeEventListener('touchstart', handleStart);
      node.removeEventListener('touchmove', handleMove);
      node.removeEventListener('touchend', handleEnd);
      node.removeEventListener('touchcancel', handleEnd);
    };
  }, [ref, onSwipe]);
}
