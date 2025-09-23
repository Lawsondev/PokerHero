// src/components/TableDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { positionOptions } from '../data/ranges';

// seat labels
export default function TableDisplay({
  activePositions = [],
  buttonPosition,
  heroPosition,
  playerHands = {},
  stackedSeats = [],
  stacks = {}, // stack amounts per seat
  pot = 0, // live pot value (currently only used in AICoaching overlay)
  putInRound = {}, // amount each seat has put in this betting round
  board = [] // NEW: community cards in deal order ([], then 3, then 4, then 5)
}) {
  // TABLESIZE
  const width = 950, height = 500;
  const seatW = 120, seatH = 48;
  const cx = width / 2, cy = height / 2;
  const rx = width / 2 - seatW;
  const ry = height / 2 - seatH;
  const chipSize = 32;
  const chipSrc = `${process.env.PUBLIC_URL}/chips/chip.png`;

  const cardStyle = {
    width: '55px',
    backgroundColor: 'white',
    padding: '2px',
    borderRadius: '4px',
    zIndex: 10,
  };

  // BOARD card styling (slightly wider for center display)
  const boardCardStyle = {
    width: '60px',
    backgroundColor: 'white',
    padding: '2px',
    borderRadius: '4px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    zIndex: 10
  };

  const baseSeats = positionOptions.slice(0, 6);
  const idx = baseSeats.indexOf(heroPosition);
  const rot = (3 - idx + 6) % 6;
  const seats = baseSeats.map((_, i) => baseSeats[(i - rot + 6) % 6]);

  return (
    <div className="mx-auto my-4" style={{ position: 'relative', width, height }}>
      <div
        className="absolute inset-0 bg-green-700"
        style={{
          border: '4px solid #2e7d32',
          borderRadius: '50% / 25%',
        }}
      />

      {/* Pot display (kept above the board) */}
      <div
        className="absolute text-white text-lg font-semibold"
        style={{
          left: '50%',
          top: '38%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '4px 12px',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      >
        Pot: {pot.toFixed(1)} bb
      </div>

      {/* NEW: Center board (shows 0..5 cards exactly as provided) */}
      {Array.isArray(board) && board.length > 0 && (
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 8,
            zIndex: 10
          }}
        >
          {board.map((card, idx) => (
            <img
              key={`board-${idx}-${card}`}
              src={`${process.env.PUBLIC_URL}/cards/${card}.png`}
              alt={card}
              style={boardCardStyle}
              draggable={false}
            />
          ))}
        </div>
      )}

      {seats.map((label, i) => {
        const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
        const leftSeat = cx + rx * Math.cos(angle) - seatW / 2;
        const topSeat = cy + ry * Math.sin(angle) - seatH / 2;
        const isActive = activePositions.includes(label);
        const midX = cx + (rx / 2) * Math.cos(angle) - chipSize / 2;
        const midY = cy + (ry / 2) * Math.sin(angle) - chipSize / 2;

        const stackAmount =
          typeof stacks[label] === 'number' ? stacks[label].toFixed(1) : null;

        const cards = playerHands[label];

        // invested amount for this seat in current round
        const invested = Number(putInRound?.[label] ?? 0);
        const showChips = stackedSeats.includes(label) || invested > 0;

        return (
          <div key={label}>
            {showChips && (
              <>
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
                {invested > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: midX + chipSize + 4,
                      top: midY + chipSize / 2 - 10,
                      transform: 'translateY(-50%)',
                      fontSize: 12,
                      padding: '2px 6px',
                      background: 'rgba(0,0,0,0.55)',
                      color: 'white',
                      borderRadius: 6,
                      zIndex: 9,
                      pointerEvents: 'none'
                    }}
                  >
                    {invested.toFixed(1)} bb
                  </span>
                )}
              </>
            )}

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
              {/* Hole cards */}
              {!cards && isActive && (
                <div
                  className="flex space-x-2 mb-1 justify-center"
                  style={{ width: seatW, zIndex: 10 }}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}/cards/back.png`}
                    alt="back"
                    style={cardStyle}
                  />
                  <img
                    src={`${process.env.PUBLIC_URL}/cards/back.png`}
                    alt="back"
                    style={cardStyle}
                  />
                </div>
              )}

              {Array.isArray(cards) && (
                <div
                  className="flex space-x-2 mb-1 justify-center"
                  style={{ width: seatW, zIndex: 10 }}
                >
                  {cards.map((card, idx) => (
                    <img
                      key={`${label}-${idx}-${card}`}
                      src={`${process.env.PUBLIC_URL}/cards/${card}.png`}
                      alt={card}
                      style={cardStyle}
                    />
                  ))}
                </div>
              )}

              <span style={{ zIndex: 5 }}>{label}</span>
              {/* Stack size */}
              {stackAmount && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    lineHeight: '1rem',
                    color: '#222',
                    zIndex: 5,
                  }}
                >
                  {stackAmount} bb
                </span>
              )}
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
  activePositions: PropTypes.arrayOf(PropTypes.string),
  buttonPosition: PropTypes.string.isRequired,
  heroPosition: PropTypes.string.isRequired,
  playerHands: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  stackedSeats: PropTypes.arrayOf(PropTypes.string),
  stacks: PropTypes.object,
  pot: PropTypes.number.isRequired,
  putInRound: PropTypes.object,
  board: PropTypes.arrayOf(PropTypes.string) // NEW
};
