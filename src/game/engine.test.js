import {
  BASE_TICK_MS,
  GRID_SIZE,
  INITIAL_SNAKE_LENGTH,
  MAX_QUEUED_TURNS,
  MIN_TICK_MS,
  SPEED_UP_EVERY,
  SPEED_UP_STEP_MS,
  STATUS,
} from './constants';
import { createGameReducer, createInitialState, placeFood, tickDelayFor } from './engine';

// Always picks the first free cell, so food placement is predictable.
const firstFreeCell = () => 0;
const reduce = createGameReducer(firstFreeCell);

/** Applies a list of actions in order. */
const run = (state, ...actions) => actions.reduce(reduce, state);

const makeState = (overrides) => ({
  ...createInitialState(firstFreeCell, STATUS.running),
  ...overrides,
});

const allCells = () => {
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) cells.push({ x, y });
  }
  return cells;
};

describe('createInitialState', () => {
  const state = createInitialState(firstFreeCell);

  it('starts idle, heading right, with a centred snake', () => {
    expect(state.status).toBe(STATUS.idle);
    expect(state.direction).toBe('right');
    expect(state.score).toBe(0);
    expect(state.snake).toHaveLength(INITIAL_SNAKE_LENGTH);
    expect(state.snake[0]).toEqual({ x: GRID_SIZE / 2, y: GRID_SIZE / 2 });
  });

  it('lays the body out behind the head', () => {
    const xs = state.snake.map((segment) => segment.x);
    expect(xs).toEqual([...xs].sort((a, b) => b - a));
    expect(new Set(state.snake.map((s) => s.y)).size).toBe(1);
  });

  it('never places food under the snake', () => {
    expect(state.snake).not.toContainEqual(state.food);
  });
});

describe('tickDelayFor', () => {
  it('starts at the base delay', () => {
    expect(tickDelayFor(0)).toBe(BASE_TICK_MS);
  });

  it('speeds up one step per threshold crossed', () => {
    expect(tickDelayFor(SPEED_UP_EVERY - 1)).toBe(BASE_TICK_MS);
    expect(tickDelayFor(SPEED_UP_EVERY)).toBe(BASE_TICK_MS - SPEED_UP_STEP_MS);
    expect(tickDelayFor(SPEED_UP_EVERY * 2)).toBe(BASE_TICK_MS - SPEED_UP_STEP_MS * 2);
  });

  it('never drops below the floor', () => {
    expect(tickDelayFor(10_000)).toBe(MIN_TICK_MS);
  });

  it('leaves enough reaction time at the hardest level', () => {
    // The difficulty ceiling has to stay playable: crossing the whole board
    // should never take less than 1.5s, or high levels become guesswork.
    const fastestBoardCrossing = tickDelayFor(10_000) * GRID_SIZE;
    expect(fastestBoardCrossing).toBeGreaterThanOrEqual(1500);
  });

  it('ramps down over at least ten levels', () => {
    // A lower ceiling must not come from a shorter ramp -- the speed-up should
    // still be spread across many levels rather than bottoming out early.
    const levelsToTopSpeed = Math.ceil(
      (BASE_TICK_MS - MIN_TICK_MS) / SPEED_UP_STEP_MS,
    );
    expect(levelsToTopSpeed).toBeGreaterThanOrEqual(10);
  });
});

describe('placeFood', () => {
  it('avoids every snake cell', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    expect(placeFood(snake, firstFreeCell)).toEqual({ x: 3, y: 0 });
  });

  it('returns null when the snake covers the board', () => {
    expect(placeFood(allCells(), firstFreeCell)).toBeNull();
  });

  it('tolerates an rng that returns 1', () => {
    const food = placeFood([{ x: 0, y: 0 }], () => 1);
    expect(food).toEqual({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
  });
});

describe('turn', () => {
  it('queues a legal turn and starts an idle game', () => {
    const state = run(createInitialState(firstFreeCell), { type: 'turn', direction: 'up' });

    expect(state.status).toBe(STATUS.running);
    expect(state.queuedTurns).toEqual(['up']);
    // The direction itself only changes on the next tick.
    expect(state.direction).toBe('right');
  });

  it('rejects a reversal into its own neck', () => {
    const state = makeState({});
    expect(reduce(state, { type: 'turn', direction: 'left' })).toBe(state);
  });

  it('rejects a turn in the direction it already travels', () => {
    const state = makeState({});
    expect(reduce(state, { type: 'turn', direction: 'right' })).toBe(state);
  });

  it('validates against the last queued turn, not the current direction', () => {
    const state = run(makeState({}), { type: 'turn', direction: 'up' });

    // 'down' reverses the queued 'up', so it must not be accepted...
    expect(reduce(state, { type: 'turn', direction: 'down' })).toBe(state);
    // ...but 'left' is a legal follow-up to 'up'.
    expect(reduce(state, { type: 'turn', direction: 'left' }).queuedTurns).toEqual(['up', 'left']);
  });

  it('caps the queue so old input cannot pile up', () => {
    const state = run(
      makeState({}),
      { type: 'turn', direction: 'up' },
      { type: 'turn', direction: 'left' },
      { type: 'turn', direction: 'down' },
    );

    expect(state.queuedTurns).toHaveLength(MAX_QUEUED_TURNS);
  });

  it('ignores unknown directions', () => {
    const state = makeState({});
    expect(reduce(state, { type: 'turn', direction: 'sideways' })).toBe(state);
  });

  it('ignores input after the game is over', () => {
    const state = makeState({ status: STATUS.over });
    expect(reduce(state, { type: 'turn', direction: 'up' })).toBe(state);
  });
});

describe('tick', () => {
  it('does nothing unless the game is running', () => {
    for (const status of [STATUS.idle, STATUS.paused, STATUS.over, STATUS.won]) {
      const state = makeState({ status });
      expect(reduce(state, { type: 'tick' })).toBe(state);
    }
  });

  it('advances the head and drops the tail, keeping the length', () => {
    const state = makeState({
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
      food: { x: 19, y: 19 },
    });

    const next = reduce(state, { type: 'tick' });

    expect(next.snake).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }]);
    expect(next.score).toBe(0);
  });

  it('consumes one queued turn per tick', () => {
    let state = run(
      makeState({ snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }], food: { x: 19, y: 19 } }),
      { type: 'turn', direction: 'up' },
      { type: 'turn', direction: 'left' },
    );

    state = reduce(state, { type: 'tick' });
    expect(state.direction).toBe('up');
    expect(state.snake[0]).toEqual({ x: 5, y: 4 });
    expect(state.queuedTurns).toEqual(['left']);

    state = reduce(state, { type: 'tick' });
    expect(state.direction).toBe('left');
    expect(state.snake[0]).toEqual({ x: 4, y: 4 });
    expect(state.queuedTurns).toEqual([]);
  });

  it('grows the snake and scores when it eats', () => {
    const state = makeState({
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }],
      food: { x: 6, y: 5 },
    });

    const next = reduce(state, { type: 'tick' });

    expect(next.snake).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }]);
    expect(next.score).toBe(1);
    expect(next.food).not.toEqual({ x: 6, y: 5 });
    expect(next.snake).not.toContainEqual(next.food);
  });

  it.each([
    ['right', { x: GRID_SIZE - 1, y: 5 }],
    ['left', { x: 0, y: 5 }],
    ['up', { x: 5, y: 0 }],
    ['down', { x: 5, y: GRID_SIZE - 1 }],
  ])('ends the game when the head leaves the board heading %s', (direction, head) => {
    const state = makeState({
      snake: [head],
      direction,
      food: { x: 10, y: 10 },
    });

    expect(reduce(state, { type: 'tick' }).status).toBe(STATUS.over);
  });

  it('ends the game when the head runs into the body', () => {
    const state = makeState({
      // A tight loop: turning down from (1,0) hits the neck at (1,1).
      snake: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
      direction: 'down',
      food: { x: 10, y: 10 },
    });

    expect(reduce(state, { type: 'tick' }).status).toBe(STATUS.over);
  });

  it('allows moving into the cell the tail is vacating', () => {
    const state = makeState({
      snake: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
      direction: 'left',
      food: { x: 10, y: 10 },
    });

    const next = reduce(state, { type: 'tick' });

    expect(next.status).toBe(STATUS.running);
    expect(next.snake[0]).toEqual({ x: 0, y: 0 });
    expect(next.snake).toHaveLength(4);
  });

  it('ends the game if the tail stays put because the snake is growing', () => {
    const tail = { x: 0, y: 0 };
    const state = makeState({
      snake: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, tail],
      direction: 'left',
      // Eating on this tick means the tail does not move out of the way.
      food: tail,
    });

    expect(reduce(state, { type: 'tick' }).status).toBe(STATUS.over);
  });

  it('is won when the last free cell is eaten', () => {
    const cells = allCells();
    const lastCell = { x: 0, y: 0 };
    const body = cells.filter((cell) => cell.x !== 0 || cell.y !== 0);

    const state = makeState({
      snake: [{ x: 1, y: 0 }, ...body.filter((cell) => cell.x !== 1 || cell.y !== 0)],
      direction: 'left',
      food: lastCell,
    });

    const next = reduce(state, { type: 'tick' });

    expect(next.status).toBe(STATUS.won);
    expect(next.food).toBeNull();
    expect(next.snake).toHaveLength(GRID_SIZE * GRID_SIZE);
  });
});

describe('togglePause and restart', () => {
  it('pauses and resumes a running game', () => {
    const running = makeState({});
    const paused = reduce(running, { type: 'togglePause' });

    expect(paused.status).toBe(STATUS.paused);
    expect(reduce(paused, { type: 'togglePause' }).status).toBe(STATUS.running);
  });

  it('starts an idle game', () => {
    const idle = createInitialState(firstFreeCell);
    expect(reduce(idle, { type: 'togglePause' }).status).toBe(STATUS.running);
  });

  it('leaves a finished game alone', () => {
    const over = makeState({ status: STATUS.over });
    expect(reduce(over, { type: 'togglePause' })).toBe(over);
  });

  it('restart returns a fresh, running game', () => {
    const messy = makeState({ score: 42, status: STATUS.over, queuedTurns: ['up'] });
    const fresh = reduce(messy, { type: 'restart' });

    expect(fresh.status).toBe(STATUS.running);
    expect(fresh.score).toBe(0);
    expect(fresh.queuedTurns).toEqual([]);
    expect(fresh.snake).toHaveLength(INITIAL_SNAKE_LENGTH);
  });

  it('ignores unknown actions', () => {
    const state = makeState({});
    expect(reduce(state, { type: 'nope' })).toBe(state);
  });
});
