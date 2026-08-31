// Board is square: GRID_SIZE x GRID_SIZE cells.
export const GRID_SIZE = 20;

// The snake advances one cell per tick. Ticks get shorter as the score grows,
// which is what makes the game harder over time.
export const BASE_TICK_MS = 150;
export const MIN_TICK_MS = 65;

// Every SPEED_UP_EVERY points, a tick gets SPEED_UP_STEP_MS shorter.
export const SPEED_UP_EVERY = 5;
export const SPEED_UP_STEP_MS = 8;

export const POINTS_PER_FOOD = 1;
export const INITIAL_SNAKE_LENGTH = 3;

// Turns are queued rather than applied instantly, so a quick two-key combo
// (e.g. up-then-left) survives even when both keys land inside one tick.
export const MAX_QUEUED_TURNS = 2;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const STATUS = {
  idle: 'idle',
  running: 'running',
  paused: 'paused',
  over: 'over',
  won: 'won',
};
