import React from 'react';

/**
 * Draws the snake and the food as absolutely positioned cells over a CSS grid
 * background. Everything is sized in percentages, so the board scales to
 * whatever space the layout gives it without any resize maths in JS.
 */
export default function Board({ snake, food, gridSize, direction }) {
  const cellSize = 100 / gridSize;

  const cellStyle = ({ x, y }) => ({
    left: `${x * cellSize}%`,
    top: `${y * cellSize}%`,
    width: `${cellSize}%`,
    height: `${cellSize}%`,
  });

  return (
    <div
      className="board"
      data-testid="board"
      style={{ '--grid-size': gridSize }}
      role="img"
      aria-label={`Snake board, ${gridSize} by ${gridSize} cells. Snake is ${snake.length} segments long.`}
    >
      {food && <div className="food" data-testid="food" style={cellStyle(food)} />}

      {snake.map((segment, index) => (
        // Coordinates are unique across the snake (an overlap ends the game),
        // so keying by them lets React reuse nodes as the snake slides along:
        // only the new head and the dropped tail actually change.
        <div
          key={`${segment.x},${segment.y}`}
          className={index === 0 ? 'segment segment--head' : 'segment'}
          data-testid={index === 0 ? 'snake-head' : 'snake-segment'}
          data-direction={index === 0 ? direction : undefined}
          style={{
            ...cellStyle(segment),
            zIndex: snake.length - index,
            // Lets CSS fade and taper the body from head to tail.
            '--segment-progress': index / Math.max(1, snake.length - 1),
          }}
        />
      ))}
    </div>
  );
}
