import React from 'react';
import { BASE_TICK_MS, MIN_TICK_MS, SPEED_UP_EVERY } from '../game/constants';

const Stat = ({ label, value }) => (
  <div className="stat">
    <span className="stat__label">{label}</span>
    <span className="stat__value">{value}</span>
  </div>
);

export default function Hud({ score, highScore, tickDelay, length }) {
  const level = Math.floor(score / SPEED_UP_EVERY) + 1;
  // Fraction of the way from the starting tick rate to the fastest one.
  const speedPercent = Math.round(
    ((BASE_TICK_MS - tickDelay) / (BASE_TICK_MS - MIN_TICK_MS)) * 100,
  );

  return (
    <div className="hud">
      <Stat label="Score" value={score} />
      <Stat label="Best" value={highScore} />
      <Stat label="Length" value={length} />
      <div className="stat stat--speed">
        <span className="stat__label">Level {level}</span>
        <span className="speed-meter" aria-hidden="true">
          <span className="speed-meter__fill" style={{ width: `${speedPercent}%` }} />
        </span>
      </div>
    </div>
  );
}
