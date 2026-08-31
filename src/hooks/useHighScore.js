import { useEffect, useState } from 'react';

const STORAGE_KEY = 'snake.highScore';

// localStorage throws in private-mode Safari and when storage is disabled, so
// every access is guarded and the game just runs without a persisted best.
const readStoredScore = () => {
  try {
    const stored = Number.parseInt(window.localStorage.getItem(STORAGE_KEY), 10);
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
};

const writeStoredScore = (score) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    /* best-effort only */
  }
};

/** Tracks the best score seen across sessions. */
export default function useHighScore(score) {
  const [highScore, setHighScore] = useState(readStoredScore);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      writeStoredScore(score);
    }
  }, [score, highScore]);

  return highScore;
}
