import React from 'react';
import Cell from './Cell';

function Board({ board, gameOver, onReveal, onFlag }) {
  const cols = board[0]?.length ?? 0;

  return (
    <div
      className="board"
      style={{ gridTemplateColumns: `repeat(${cols}, var(--cell-size))` }}
    >
      {board.map((row) =>
        row.map((cell) => (
          <Cell
            key={`${cell.row}-${cell.col}`}
            cell={cell}
            gameOver={gameOver}
            onReveal={onReveal}
            onFlag={onFlag}
          />
        ))
      )}
    </div>
  );
}

export default Board;
