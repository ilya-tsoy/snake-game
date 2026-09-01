import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import Board from './components/Board';
import Hud from './components/Hud';
import Overlay from './components/Overlay';
import TouchPad from './components/TouchPad';
import { GRID_SIZE, STATUS } from './game/constants';
import { createInitialState, gameReducer, tickDelayFor } from './game/engine';
import useGameLoop from './hooks/useGameLoop';
import useHighScore from './hooks/useHighScore';
import useSwipe from './hooks/useSwipe';
import './App.css';

const KEY_TO_DIRECTION = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
};

const STATUS_MESSAGE = {
  [STATUS.idle]: 'Ready when you are.',
  [STATUS.running]: 'Playing.',
  [STATUS.paused]: 'Paused.',
  [STATUS.over]: 'Game over.',
  [STATUS.won]: 'Perfect game. The board is full.',
};

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, () => createInitialState());
  const highScore = useHighScore(game.score);
  const boardRef = useRef(null);

  const { status, score, snake, food, direction } = game;
  const isFinished = status === STATUS.over || status === STATUS.won;
  const tickDelay = tickDelayFor(score);

  const turn = useCallback((nextDirection) => {
    dispatch({ type: 'turn', direction: nextDirection });
  }, []);

  const restart = useCallback(() => dispatch({ type: 'restart' }), []);

  useGameLoop(
    useCallback(() => dispatch({ type: 'tick' }), []),
    tickDelay,
    status === STATUS.running,
  );

  useSwipe(boardRef, turn);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      const nextDirection = KEY_TO_DIRECTION[key];

      if (nextDirection) {
        // Stop the arrow keys from scrolling the page mid-game.
        event.preventDefault();
        turn(nextDirection);
        return;
      }

      if (key === ' ') {
        // preventDefault here also stops Space from activating the focused
        // overlay button, which would otherwise toggle the pause twice.
        event.preventDefault();
        dispatch({ type: 'togglePause' });
        return;
      }

      if (key === 'r') {
        restart();
        return;
      }

      // Enter restarts, unless a button already has focus and will handle it.
      if (key === 'enter' && isFinished && event.target?.tagName !== 'BUTTON') {
        restart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, restart, turn]);

  // Losing focus mid-game (tab switch, alt-tab) shouldn't cost a run.
  useEffect(() => {
    const pauseIfRunning = () => {
      if (status === STATUS.running) dispatch({ type: 'togglePause' });
    };

    window.addEventListener('blur', pauseIfRunning);
    return () => window.removeEventListener('blur', pauseIfRunning);
  }, [status]);

  const handlePrimaryAction = isFinished ? restart : () => dispatch({ type: 'togglePause' });

  return (
    <div className="app">
      <main className="game" aria-label="Snake game">
        <header className="game__header">
          <h1 className="game__title">Snake</h1>
          <Hud
            score={score}
            highScore={highScore}
            tickDelay={tickDelay}
            length={snake.length}
          />
        </header>

        <div className="game__stage" ref={boardRef}>
          <Board snake={snake} food={food} gridSize={GRID_SIZE} direction={direction} />
          <Overlay
            status={status}
            score={score}
            highScore={highScore}
            onPrimaryAction={handlePrimaryAction}
          />
        </div>

        <p className="visually-hidden" role="status" aria-live="polite">
          {`${STATUS_MESSAGE[status]} Score ${score}.`}
        </p>

        <TouchPad onDirection={turn} />

        <footer className="game__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</span>
          <span><kbd>Space</kbd> pause</span>
          <span><kbd>R</kbd> restart</span>
        </footer>
      </main>
    </div>
  );
}
