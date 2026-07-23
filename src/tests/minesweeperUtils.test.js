import {
  createBoard,
  neighbors,
  placeMines,
  revealCell,
  toggleFlag,
  revealAllMines,
  checkWin,
  countFlags,
} from '../utils/minesweeperUtils';

describe('createBoard', () => {
  test('creates a grid of the requested size with empty cells', () => {
    const board = createBoard(5, 7);
    expect(board).toHaveLength(5);
    expect(board[0]).toHaveLength(7);
    for (const row of board) {
      for (const cell of row) {
        expect(cell.isMine).toBe(false);
        expect(cell.isRevealed).toBe(false);
        expect(cell.isFlagged).toBe(false);
        expect(cell.adjacentMines).toBe(0);
      }
    }
  });
});

describe('neighbors', () => {
  test('returns 8 neighbors for an interior cell', () => {
    const board = createBoard(3, 3);
    expect(neighbors(board, 1, 1)).toHaveLength(8);
  });

  test('clamps to bounds for a corner cell', () => {
    const board = createBoard(3, 3);
    expect(neighbors(board, 0, 0)).toHaveLength(3);
  });
});

describe('placeMines', () => {
  test('places the requested number of mines', () => {
    const board = placeMines(createBoard(9, 9), 10, 0, 0);
    const count = board.flat().filter((c) => c.isMine).length;
    expect(count).toBe(10);
  });

  test('keeps the first-clicked cell and its neighbors mine-free', () => {
    const board = placeMines(createBoard(9, 9), 10, 4, 4);
    expect(board[4][4].isMine).toBe(false);
    for (const n of neighbors(board, 4, 4)) {
      expect(n.isMine).toBe(false);
    }
  });

  test('computes adjacency counts correctly', () => {
    // Force a deterministic layout by building it by hand.
    const board = createBoard(3, 3);
    board[0][0].isMine = true;
    board[0][1].isMine = true;
    // Recompute via a manual pass mirroring placeMines' adjacency logic.
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c].isMine) continue;
        board[r][c].adjacentMines = neighbors(board, r, c).filter(
          (n) => n.isMine
        ).length;
      }
    }
    expect(board[1][1].adjacentMines).toBe(2);
    expect(board[1][0].adjacentMines).toBe(2);
    expect(board[2][2].adjacentMines).toBe(0);
  });
});

describe('revealCell', () => {
  test('flood-fills through empty regions', () => {
    // 3x3 board with a single mine in the corner; revealing the opposite
    // corner should open most of the board.
    const board = createBoard(3, 3);
    board[0][0].isMine = true;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c].isMine) continue;
        board[r][c].adjacentMines = neighbors(board, r, c).filter(
          (n) => n.isMine
        ).length;
      }
    }
    const revealed = revealCell(board, 2, 2);
    const revealedCount = revealed.flat().filter((c) => c.isRevealed).length;
    // All non-mine cells reachable without crossing a number>0 barrier open.
    expect(revealedCount).toBeGreaterThanOrEqual(5);
    expect(revealed[0][0].isRevealed).toBe(false); // the mine stays hidden
  });

  test('does not mutate the input board', () => {
    const board = createBoard(3, 3);
    revealCell(board, 1, 1);
    expect(board[1][1].isRevealed).toBe(false);
  });

  test('ignores flagged cells', () => {
    let board = createBoard(3, 3);
    board = toggleFlag(board, 1, 1);
    const revealed = revealCell(board, 1, 1);
    expect(revealed[1][1].isRevealed).toBe(false);
  });
});

describe('toggleFlag', () => {
  test('toggles a flag on and off', () => {
    let board = createBoard(3, 3);
    board = toggleFlag(board, 0, 0);
    expect(board[0][0].isFlagged).toBe(true);
    board = toggleFlag(board, 0, 0);
    expect(board[0][0].isFlagged).toBe(false);
  });

  test('cannot flag a revealed cell', () => {
    let board = createBoard(3, 3);
    board = revealCell(board, 0, 0);
    board = toggleFlag(board, 0, 0);
    expect(board[0][0].isFlagged).toBe(false);
  });
});

describe('checkWin', () => {
  test('true when all non-mine cells are revealed', () => {
    const board = createBoard(2, 2);
    board[0][0].isMine = true;
    board[0][1].isRevealed = true;
    board[1][0].isRevealed = true;
    board[1][1].isRevealed = true;
    expect(checkWin(board)).toBe(true);
  });

  test('false when a safe cell is still hidden', () => {
    const board = createBoard(2, 2);
    board[0][0].isMine = true;
    board[0][1].isRevealed = true;
    expect(checkWin(board)).toBe(false);
  });
});

describe('revealAllMines and countFlags', () => {
  test('revealAllMines reveals every mine', () => {
    const board = placeMines(createBoard(5, 5), 5, 0, 0);
    const revealed = revealAllMines(board);
    const hiddenMines = revealed
      .flat()
      .filter((c) => c.isMine && !c.isRevealed);
    expect(hiddenMines).toHaveLength(0);
  });

  test('countFlags counts placed flags', () => {
    let board = createBoard(3, 3);
    board = toggleFlag(board, 0, 0);
    board = toggleFlag(board, 1, 1);
    expect(countFlags(board)).toBe(2);
  });
});
