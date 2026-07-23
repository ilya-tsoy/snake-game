import React, { useState, useCallback } from 'react';
import Board from './Board';
import {
  DIFFICULTIES,
  createBoard,
  placeMines,
  revealCell,
  toggleFlag,
  revealAllMines,
  checkWin,
  countFlags,
} from '../utils/minesweeperUtils';

const STATUS = {
  READY: 'ready',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

function Minesweeper() {
  const [difficultyKey, setDifficultyKey] = useState('beginner');
  const difficulty = DIFFICULTIES[difficultyKey];

  const [board, setBoard] = useState(() =>
    createBoard(difficulty.rows, difficulty.cols)
  );
  const [status, setStatus] = useState(STATUS.READY);

  const gameOver = status === STATUS.WON || status === STATUS.LOST;
  const minesLeft = difficulty.mines - countFlags(board);

  const resetGame = useCallback(
    (key = difficultyKey) => {
      const d = DIFFICULTIES[key];
      setBoard(createBoard(d.rows, d.cols));
      setStatus(STATUS.READY);
    },
    [difficultyKey]
  );

  const handleDifficultyChange = (e) => {
    const key = e.target.value;
    setDifficultyKey(key);
    resetGame(key);
  };

  const handleReveal = useCallback(
    (row, col) => {
      if (gameOver) return;

      setBoard((prev) => {
        // Lazily place mines on the first reveal, keeping the first click safe.
        let working = prev;
        if (status === STATUS.READY) {
          working = placeMines(prev, difficulty.mines, row, col);
        }

        const target = working[row][col];
        if (target.isRevealed || target.isFlagged) return working;

        if (target.isMine) {
          setStatus(STATUS.LOST);
          return revealAllMines(working);
        }

        const revealed = revealCell(working, row, col);
        if (checkWin(revealed)) {
          setStatus(STATUS.WON);
        } else {
          setStatus(STATUS.PLAYING);
        }
        return revealed;
      });
    },
    [gameOver, status, difficulty.mines]
  );

  const handleFlag = useCallback(
    (row, col) => {
      if (gameOver) return;
      setBoard((prev) => toggleFlag(prev, row, col));
    },
    [gameOver]
  );

  let message = '';
  if (status === STATUS.WON) message = '🎉 You win!';
  else if (status === STATUS.LOST) message = '💥 Game over';

  return (
    <div className="minesweeper">
      <h1>Minesweeper</h1>

      <div className="controls">
        <label>
          Difficulty:{' '}
          <select value={difficultyKey} onChange={handleDifficultyChange}>
            {Object.entries(DIFFICULTIES).map(([key, d]) => (
              <option key={key} value={key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mines-left" aria-label="mines-remaining">
          💣 {minesLeft}
        </div>

        <button type="button" className="reset" onClick={() => resetGame()}>
          {status === STATUS.LOST ? '😵' : status === STATUS.WON ? '😎' : '🙂'}{' '}
          New Game
        </button>
      </div>

      {message && (
        <div className={`status-message ${status}`}>{message}</div>
      )}

      <Board
        board={board}
        gameOver={gameOver}
        onReveal={handleReveal}
        onFlag={handleFlag}
      />

      <p className="hint">
        Left-click to reveal · Right-click to flag
      </p>
    </div>
  );
}

export default Minesweeper;
