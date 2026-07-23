import React from 'react';

// Classic Minesweeper number colors keyed by adjacent-mine count.
const NUMBER_COLORS = {
  1: '#1976d2',
  2: '#388e3c',
  3: '#d32f2f',
  4: '#7b1fa2',
  5: '#ff8f00',
  6: '#0097a7',
  7: '#424242',
  8: '#757575',
};

function Cell({ cell, gameOver, onReveal, onFlag }) {
  const { isRevealed, isFlagged, isMine, adjacentMines } = cell;

  const handleContextMenu = (e) => {
    e.preventDefault();
    onFlag(cell.row, cell.col);
  };

  const handleClick = () => onReveal(cell.row, cell.col);

  let content = '';
  if (isRevealed) {
    if (isMine) content = '💣';
    else if (adjacentMines > 0) content = adjacentMines;
  } else if (isFlagged) {
    content = '🚩';
  }

  const classNames = ['cell'];
  if (isRevealed) classNames.push('revealed');
  if (isRevealed && isMine) classNames.push('mine');

  const style =
    isRevealed && !isMine && adjacentMines > 0
      ? { color: NUMBER_COLORS[adjacentMines] }
      : undefined;

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      style={style}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={gameOver || isRevealed}
      aria-label={`cell-${cell.row}-${cell.col}`}
    >
      {content}
    </button>
  );
}

export default Cell;
