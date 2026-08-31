# Snake

A classic single-player Snake game built with React.

![Snake](https://img.shields.io/badge/React-18-61dafb) ![Tests](https://img.shields.io/badge/tests-46-brightgreen)

## Play

- **Move** — arrow keys or `W` `A` `S` `D`
- **Pause / resume** — `Space`
- **Restart** — `R`, or `Enter` on the game-over card
- **Touch** — swipe anywhere on the board, or use the on-screen pad

Eat the food to grow and score. The game ends when the snake leaves the board or
runs into itself. Fill every cell and you win outright.

## Design

The game is a pure state machine wrapped in a thin React shell. All the rules
live in `src/game/engine.js` as a reducer over `tick` / `turn` / `togglePause` /
`restart` actions — no DOM, no timers, no React. That split is what makes the
rules straightforward to test and the components purely presentational.

```
src/
  game/
    constants.js     board size, tick rates, direction vectors
    engine.js        the rules: createInitialState + the reducer
    engine.test.js   unit tests for every rule
  hooks/
    useGameLoop.js   fixed-step requestAnimationFrame loop
    useHighScore.js  best score, persisted to localStorage
    useSwipe.js      touch drags to direction changes
  components/
    Board.js         snake and food, positioned over a CSS grid
    Hud.js           score, best, length, level and speed meter
    Overlay.js       start / paused / game-over card
    TouchPad.js      on-screen direction pad
  App.js             input handling, wiring, layout
```

Three details worth knowing:

- **Turns are queued, not applied instantly.** Applying turns immediately loses
  the second press of a quick combo such as up-then-left when both land inside
  one tick. Turns go into a short queue and are consumed one per tick instead,
  so both register.
- **The loop is `requestAnimationFrame` with a fixed-step accumulator**, not
  `setInterval`. Ticks stay aligned to paints, the tick rate can change mid-game
  without restarting a timer, and a backgrounded tab stops advancing instead of
  queueing up a burst of moves.
- **Food placement enumerates free cells** rather than retrying random guesses,
  so it stays fast and terminating even when the board is nearly full — and
  returns `null` when there is no free cell, which is how a win is detected.

## Develop

```bash
npm install
npm start     # dev server on http://localhost:3000
npm test      # watch mode
npm run build # production bundle in build/
```

See [README_BUILD.md](README_BUILD.md) for build and deployment details.
