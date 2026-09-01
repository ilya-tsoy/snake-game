import {
  BASE_TICK_MS,
  DIRECTIONS,
  GRID_SIZE,
  INITIAL_SNAKE_LENGTH,
  MAX_QUEUED_TURNS,
  MIN_TICK_MS,
  OPPOSITES,
  POINTS_PER_FOOD,
  SPEED_UP_EVERY,
  SPEED_UP_STEP_MS,
  STATUS,
} from './constants';

/**
 * The whole game is a pure state machine: `createInitialState` plus a reducer
 * over `{ type: 'tick' | 'turn' | 'togglePause' | 'restart' }` actions. Nothing
 * here touches the DOM, timers or React, so the rules can be tested directly
 * and the components stay purely presentational.
 */

const key = ({ x, y }) => `${x},${y}`;

const samePosition = (a, b) => a.x === b.x && a.y === b.y;

const isOutsideBoard = ({ x, y }, gridSize = GRID_SIZE) =>
  x < 0 || y < 0 || x >= gridSize || y >= gridSize;

/**
 * Milliseconds between ticks for a given score. Derived rather than stored so
 * it can never drift out of sync with the score.
 */
export const tickDelayFor = (score) => {
  const stepsEarned = Math.floor(score / SPEED_UP_EVERY);
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - stepsEarned * SPEED_UP_STEP_MS);
};

/**
 * Picks a uniformly random free cell. Enumerating the free cells (rather than
 * retrying random guesses) keeps this fast and terminating even when the board
 * is nearly full. Returns null when the snake covers every cell.
 */
export const placeFood = (snake, rng = Math.random, gridSize = GRID_SIZE) => {
  const occupied = new Set(snake.map(key));
  const free = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }

  if (free.length === 0) return null;
  return free[Math.min(free.length - 1, Math.floor(rng() * free.length))];
};

const createSnake = (gridSize = GRID_SIZE) => {
  const headX = Math.floor(gridSize / 2);
  const y = Math.floor(gridSize / 2);

  return Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, index) => ({
    x: headX - index,
    y,
  }));
};

export const createInitialState = (rng = Math.random, status = STATUS.idle) => {
  const snake = createSnake();

  return {
    snake,
    direction: 'right',
    // Turns land here first and are consumed one per tick, so two fast key
    // presses both register instead of the second overwriting the first.
    queuedTurns: [],
    food: placeFood(snake, rng),
    score: 0,
    status,
  };
};

/** The direction a newly queued turn has to be legal against. */
const lastCommittedDirection = (state) =>
  state.queuedTurns.length > 0
    ? state.queuedTurns[state.queuedTurns.length - 1]
    : state.direction;

const queueTurn = (state, direction) => {
  if (!DIRECTIONS[direction]) return state;
  if (state.status === STATUS.over || state.status === STATUS.won) return state;
  if (state.queuedTurns.length >= MAX_QUEUED_TURNS) return state;

  const reference = lastCommittedDirection(state);
  // A no-op turn would waste a queue slot; a reversal would eat the neck.
  if (direction === reference || direction === OPPOSITES[reference]) return state;

  return {
    ...state,
    // Nudging the snake is also how you start a fresh game.
    status: state.status === STATUS.idle ? STATUS.running : state.status,
    queuedTurns: [...state.queuedTurns, direction],
  };
};

const advance = (state, rng) => {
  if (state.status !== STATUS.running) return state;

  const [nextDirection, ...remainingTurns] = state.queuedTurns.length > 0
    ? state.queuedTurns
    : [state.direction];

  const vector = DIRECTIONS[nextDirection];
  const head = {
    x: state.snake[0].x + vector.x,
    y: state.snake[0].y + vector.y,
  };

  if (isOutsideBoard(head)) {
    return { ...state, direction: nextDirection, status: STATUS.over };
  }

  const willGrow = state.food !== null && samePosition(head, state.food);
  // The tail vacates its cell on this same tick, so moving into it is legal --
  // unless the snake is growing, in which case the tail stays put.
  const blocking = willGrow ? state.snake : state.snake.slice(0, -1);
  if (blocking.some((segment) => samePosition(segment, head))) {
    return { ...state, direction: nextDirection, status: STATUS.over };
  }

  const snake = [head, ...state.snake];
  if (!willGrow) snake.pop();

  const next = {
    ...state,
    snake,
    direction: nextDirection,
    queuedTurns: remainingTurns,
  };

  if (!willGrow) return next;

  const food = placeFood(snake, rng);

  return {
    ...next,
    score: state.score + POINTS_PER_FOOD,
    food,
    // No free cell left means the snake covers the board: a perfect game.
    status: food === null ? STATUS.won : next.status,
  };
};

const togglePause = (state) => {
  if (state.status === STATUS.running) return { ...state, status: STATUS.paused };
  if (state.status === STATUS.paused) return { ...state, status: STATUS.running };
  if (state.status === STATUS.idle) return { ...state, status: STATUS.running };
  return state;
};

/**
 * Builds the reducer. The random source is injected here so tests can drive
 * food placement deterministically.
 */
export const createGameReducer = (rng = Math.random) => (state, action) => {
  switch (action.type) {
    case 'tick':
      return advance(state, rng);
    case 'turn':
      return queueTurn(state, action.direction);
    case 'togglePause':
      return togglePause(state);
    case 'restart':
      return createInitialState(rng, STATUS.running);
    default:
      return state;
  }
};

export const gameReducer = createGameReducer();

export { isOutsideBoard, samePosition };
