# Minesweeper

A classic Minesweeper game built with React. Reveal every safe cell without detonating a mine.

## Project Structure

- `src/components/`: React components for the game
  - `Minesweeper.js`: Main component managing game state and logic
  - `Board.js`: Renders the grid of cells
  - `Cell.js`: A single cell (reveal / flag / mine / number)

- `src/utils/`: Helper functions
  - `minesweeperUtils.js`: Pure game logic — board creation, mine placement, flood-fill reveal, flagging, and win detection

- `src/tests/`: Unit tests for the game logic

## Game Features

- Three difficulty levels: Beginner (9×9, 10 mines), Intermediate (16×16, 40 mines), Expert (16×30, 99 mines)
- First click is always safe — mines are placed after the first reveal
- Flood-fill reveal of empty regions
- Right-click flagging with a remaining-mine counter
- Win/lose detection and one-click new game

## How to Play

- **Left-click** a cell to reveal it
- **Right-click** a cell to place or remove a flag
- Numbers show how many mines touch that cell
- Reveal all non-mine cells to win; hit a mine and you lose
- Use the difficulty selector or **New Game** button to restart

## Development

```bash
npm install   # install dependencies
npm start     # run the dev server at http://localhost:3000
npm test      # run the test suite
npm run build # production build
```
