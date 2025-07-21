// src/components/TableDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { positionOptions } from '../data/ranges'; // seat labels

/**
 * Renders an oval poker table with 6 fixed seat‐positions
 * but rotates them so that `heroPosition` sits at the bottom.
 *
 * Props:
 *  • activePositions: array of positionLabels that are in the hand
 *  • buttonPosition: which label is the dealer (always "BTN")
 *  • heroPosition: which label to pin at bottom
 *  • playerHands: { [positionLabel]: [card1, card2], ... }
 *  • stackedSeats: array of positionLabels showing chip stacks
 */
export default function TableDisplay({
  activePositions = [], // ← default to empty array
  buttonPosition,
  heroPosition,
  playerHands = {},
  stackedSeats = [],
}) {
  const width = 800,
    height = 400;
  const seatW = 120,
    seatH = 48;
  const cx = width / 2,
    cy = height / 2;
  const rx = width / 2 - seatW;
  const ry = height / 2 - seatH;
  const chipSize = 32;
  const chipSrc = `${process.env.PUBLIC_URL}/chips/chip.png`;
  const cardStyle = {
    width: '40px',
    backgroundColor: 'white',
    padding: '2px',
    borderRadius: '4px',
    zIndex: 10,
  };

  // Fixed 6 seats in order UTG, MP, CO, BTN, SB, BB
  const baseSeats = positionOptions.slice(0, 6);
  // Find how much to rotate so heroPosition lands at index 3
  const idx = baseSeats.indexOf(heroPosition);
  const rot = (3 - idx + 6) % 6;
  // Apply rotation
  const seats = baseSeats.map((_, i) => baseSeats[(i - rot + 6) % 6]);

  return (
    <div
      className="mx-auto my-4"
      style={{ position: 'relative', width, height }}
    >
      {/* Table surface */}
      <div
        className="absolute inset-0 bg-green-700"
        style={{ border: '4px solid #2e7d32', borderRadius: '50% / 25%' }}
      />

      {/* Seats */}
      {seats.map((label, i) => {
        const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
        const leftSeat = cx + rx * Math.cos(angle) - seatW / 2;
        const topSeat = cy + ry * Math.sin(angle) - seatH / 2;
        const isActive = activePositions.includes(label);

        // Chip halfway between seat & center
        const midX = cx + (rx / 2) * Math.cos(angle) - chipSize / 2;
        const midY = cy + (ry / 2) * Math.sin(angle) - chipSize / 2;

        return (
          <div key={label}>
            {/* Chip stack */}
            {stackedSeats.includes(label) && (
              <img
                src={chipSrc}
                alt="Chips"
                style={{
                  position: 'absolute',
                  left: midX,
                  top: midY,
                  width: chipSize,
                  zIndex: 8,
                }}
              />
            )}

            {/* Seat container */}
            <div
              className="absolute flex flex-col items-center justify-end bg-white rounded-md text-center text-sm"
              style={{
                width: seatW,
                height: seatH,
                left: leftSeat,
                top: topSeat,
                opacity: isActive ? 1 : 0.3,
                border: '1px solid #333',
              }}
            >
              {/* Face‐down for active non‐hero seats */}
              {isActive && !playerHands[label] && (
                <div
                  className="flex space-x-2 mb-1 justify-center"
                  style={{ width: seatW, zIndex: 10 }}
                >
                  <img src="/cards/back.png" alt="back" style={cardStyle} />
                  <img src="/cards/back.png" alt="back" style={cardStyle} />
                </div>
              )}

              {/* Player’s hole cards */}
              {playerHands[label] && (
                <div
                  className="flex space-x-2 mb-1 justify-center"
                  style={{ width: seatW, zIndex: 10 }}
                >
                  {playerHands[label].map((card) => (
                    <img
                      key={card}
                      src={`/cards/${card}.png`}
                      alt={card}
                      style={cardStyle}
                    />
                  ))}
                </div>
              )}

              {/* Seat label */}
              <span style={{ zIndex: 5 }}>{label}</span>

              {/* Dealer badge on BTN always */}
              {label === buttonPosition && (
                <span
                  className="absolute -top-2 right-[-10px] bg-yellow-300 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ zIndex: 20 }}
                  title="Dealer"
                >
                  D
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

TableDisplay.propTypes = {
  activePositions: PropTypes.arrayOf(PropTypes.string), // no longer .isRequired
  buttonPosition: PropTypes.string.isRequired,
  heroPosition: PropTypes.string.isRequired,
  playerHands: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  stackedSeats: PropTypes.arrayOf(PropTypes.string),
};
