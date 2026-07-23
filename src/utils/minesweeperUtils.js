// Core game logic for Minesweeper — pure functions, no React.

export const DIFFICULTIES = {
  beginner: { label: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { label: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { label: 'Expert', rows: 16, cols: 30, mines: 99 },
};

// Create an empty board of unrevealed, unflagged cells with no mines yet.
// Mines are placed lazily on the first click so the first cell is always safe.
export function createBoard(rows, cols) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

// Yield the in-bounds neighbors (up to 8) of a cell.
export function neighbors(board, row, col) {
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < board.length && c >= 0 && c < board[0].length) {
        result.push(board[r][c]);
      }
    }
  }
  return result;
}

// Place `mineCount` mines at random, avoiding the cell at (safeRow, safeCol)
// and its neighbors so the first click opens an area. Returns a new board.
export function placeMines(board, mineCount, safeRow, safeCol) {
  const rows = board.length;
  const cols = board[0].length;
  const next = board.map((row) => row.map((cell) => ({ ...cell })));

  const forbidden = new Set();
  forbidden.add(`${safeRow},${safeCol}`);
  for (const n of neighbors(next, safeRow, safeCol)) {
    forbidden.add(`${n.row},${n.col}`);
  }

  const candidates = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!forbidden.has(`${r},${c}`)) candidates.push([r, c]);
    }
  }

  // Fisher–Yates partial shuffle to pick unique mine positions.
  const toPlace = Math.min(mineCount, candidates.length);
  for (let i = 0; i < toPlace; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    const [r, c] = candidates[i];
    next[r][c].isMine = true;
  }

  // Compute adjacency counts.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].isMine) continue;
      next[r][c].adjacentMines = neighbors(next, r, c).filter((n) => n.isMine)
        .length;
    }
  }

  return next;
}

// Reveal a cell, flood-filling through empty (0-adjacent) regions.
// Returns a new board. Does not mutate the input.
export function revealCell(board, row, col) {
  const next = board.map((r) => r.map((cell) => ({ ...cell })));
  const start = next[row][col];
  if (start.isRevealed || start.isFlagged) return next;

  const stack = [start];
  while (stack.length) {
    const cell = stack.pop();
    if (cell.isRevealed || cell.isFlagged) continue;
    cell.isRevealed = true;
    if (!cell.isMine && cell.adjacentMines === 0) {
      for (const n of neighbors(next, cell.row, cell.col)) {
        if (!n.isRevealed && !n.isFlagged && !n.isMine) stack.push(n);
      }
    }
  }
  return next;
}

// Toggle a flag on an unrevealed cell. Returns a new board.
export function toggleFlag(board, row, col) {
  const next = board.map((r) => r.map((cell) => ({ ...cell })));
  const cell = next[row][col];
  if (!cell.isRevealed) cell.isFlagged = !cell.isFlagged;
  return next;
}

// Reveal every mine (used on loss). Returns a new board.
export function revealAllMines(board) {
  return board.map((row) =>
    row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
  );
}

// The player wins when every non-mine cell is revealed.
export function checkWin(board) {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
}

// Count flags currently placed on the board.
export function countFlags(board) {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isFlagged) count++;
    }
  }
  return count;
}
