import React from 'react';

const BUTTONS = [
  { direction: 'up', label: 'Up', glyph: '↑', className: 'touchpad__up' },
  { direction: 'left', label: 'Left', glyph: '←', className: 'touchpad__left' },
  { direction: 'down', label: 'Down', glyph: '↓', className: 'touchpad__down' },
  { direction: 'right', label: 'Right', glyph: '→', className: 'touchpad__right' },
];

/**
 * On-screen direction pad, shown on touch devices and narrow screens where
 * there is no keyboard. Uses pointerdown so a turn registers immediately
 * rather than waiting for the click to settle.
 */
export default function TouchPad({ onDirection }) {
  return (
    <div className="touchpad" data-testid="touchpad">
      {BUTTONS.map(({ direction, label, glyph, className }) => (
        <button
          key={direction}
          type="button"
          className={`touchpad__button ${className}`}
          aria-label={label}
          onPointerDown={(event) => {
            event.preventDefault();
            onDirection(direction);
          }}
        >
          <span aria-hidden="true">{glyph}</span>
        </button>
      ))}
    </div>
  );
}
