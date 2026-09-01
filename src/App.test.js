import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { INITIAL_SNAKE_LENGTH } from './game/constants';

/**
 * The game loop runs on requestAnimationFrame. Stubbing it keeps these tests
 * deterministic: nothing advances until a test drives a frame by hand.
 */
let pendingFrame = null;

beforeEach(() => {
  window.localStorage.clear();
  pendingFrame = null;

  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pendingFrame = callback;
    return 1;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Runs one frame at `time` milliseconds. */
const frame = (time) => {
  const callback = pendingFrame;
  if (!callback) throw new Error('no animation frame was requested');
  pendingFrame = null;
  act(() => callback(time));
};

const headPosition = () => {
  const { style } = screen.getByTestId('snake-head');
  return { left: style.left, top: style.top };
};

describe('App', () => {
  it('renders the board, the snake and the food', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Snake' })).toBeInTheDocument();
    expect(screen.getByTestId('board')).toBeInTheDocument();
    expect(screen.getByTestId('food')).toBeInTheDocument();
    expect(screen.getByTestId('snake-head')).toBeInTheDocument();
    expect(screen.getAllByTestId('snake-segment')).toHaveLength(INITIAL_SNAKE_LENGTH - 1);
  });

  it('waits behind a start overlay', () => {
    render(<App />);

    expect(screen.getByTestId('overlay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ready when you are.');
  });

  it('starts when the Play button is pressed', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Playing.');
  });

  it('starts on the first arrow key', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'ArrowUp' });

    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
  });

  it('starts on WASD too', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'w' });

    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
  });

  it('moves the snake as frames elapse', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    const before = headPosition();

    // The first frame only sets the clock; the second one carries enough
    // elapsed time for exactly one move.
    frame(0);
    frame(1000);

    expect(headPosition()).not.toEqual(before);
    // The catch-up cap means a long gap still costs only a single move.
    expect(screen.getAllByTestId('snake-segment')).toHaveLength(INITIAL_SNAKE_LENGTH - 1);
  });

  it('toggles pause with the space bar', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
  });

  it('tears down the loop when paused', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    frame(0);

    const before = headPosition();
    fireEvent.keyDown(window, { key: ' ' });

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(headPosition()).toEqual(before);

    // Resuming restarts the clock, so the pause costs no elapsed time.
    fireEvent.keyDown(window, { key: ' ' });
    frame(2000);
    expect(headPosition()).toEqual(before);
  });

  it('pauses when the window loses focus', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    fireEvent.blur(window);

    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('ignores movement keys combined with a modifier', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'ArrowUp', metaKey: true });

    expect(screen.getByTestId('overlay')).toBeInTheDocument();
  });

  it('restarts with the R key', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    frame(0);
    frame(1000);

    fireEvent.keyDown(window, { key: 'r' });

    expect(screen.getAllByTestId('snake-segment')).toHaveLength(INITIAL_SNAKE_LENGTH - 1);
    expect(screen.getByRole('status')).toHaveTextContent('Score 0.');
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
  });

  it('shows the stored high score', () => {
    window.localStorage.setItem('snake.highScore', '17');

    render(<App />);

    expect(screen.getByText('Best').nextSibling).toHaveTextContent('17');
  });

  it('offers on-screen controls for touch devices', () => {
    render(<App />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Up' }));

    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
  });
});
