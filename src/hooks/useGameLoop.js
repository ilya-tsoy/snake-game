import { useEffect, useRef } from 'react';

/**
 * Calls `onTick` every `delayMs` while `active` is true.
 *
 * Built on requestAnimationFrame with a fixed-step accumulator rather than
 * setInterval: ticks stay aligned to paints, the delay can change mid-game
 * without restarting a timer, and a backgrounded tab simply stops advancing
 * instead of queueing up a burst of moves.
 */
export default function useGameLoop(onTick, delayMs, active) {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!active || !delayMs) return undefined;

    let frame = null;
    let lastTime = null;
    let accumulated = 0;

    const loop = (time) => {
      if (lastTime !== null) {
        accumulated += time - lastTime;
        // Cap the catch-up so a long stall (tab switch, slow frame) costs at
        // most one move instead of teleporting the snake into a wall.
        if (accumulated > delayMs * 3) accumulated = delayMs;

        while (accumulated >= delayMs) {
          accumulated -= delayMs;
          onTickRef.current();
        }
      }

      lastTime = time;
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [active, delayMs]);
}
