import React from 'react';
import { STATUS } from '../game/constants';

const CONTENT = {
  [STATUS.idle]: {
    title: 'Ready?',
    body: 'Arrow keys or WASD to move. Space pauses.',
    action: 'Play',
  },
  [STATUS.paused]: {
    title: 'Paused',
    body: 'Take your time.',
    action: 'Resume',
  },
  [STATUS.over]: {
    title: 'Game over',
    body: null,
    action: 'Play again',
  },
  [STATUS.won]: {
    title: 'Perfect game',
    body: 'You filled the entire board. Nothing left to eat.',
    action: 'Play again',
  },
};

/**
 * The idle / paused / finished card. Renders nothing while the game is running
 * so the board is never obscured mid-play.
 */
export default function Overlay({ status, score, highScore, onPrimaryAction }) {
  const content = CONTENT[status];
  if (!content) return null;

  const isFinished = status === STATUS.over || status === STATUS.won;
  const beatBest = isFinished && score > 0 && score >= highScore;

  return (
    <div className="overlay" data-testid="overlay">
      <div className="overlay__card" role="dialog" aria-modal="false" aria-label={content.title}>
        <h2 className="overlay__title">{content.title}</h2>

        {isFinished && (
          <p className="overlay__score">
            {score} {score === 1 ? 'point' : 'points'}
            {beatBest && <span className="overlay__badge">New best</span>}
          </p>
        )}

        {content.body && <p className="overlay__body">{content.body}</p>}

        <button type="button" className="button" onClick={onPrimaryAction} autoFocus>
          {content.action}
        </button>

        {isFinished && <p className="overlay__hint">or press Enter</p>}
      </div>
    </div>
  );
}
