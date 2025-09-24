// src/components/TableDisplay.jsx
import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { positionOptions } from '../data/ranges';

export default function TableDisplay({
  activePositions = [],
  buttonPosition,
  heroPosition,
  playerHands = {},
  stackedSeats = [],
  stacks = {},            // stack amounts per seat
  pot = 0,                // live pot value (currently only used in AICoaching overlay)
  putInRound = {},        // amount each seat has put in this betting round
  board = []              // community cards in deal order ([], then 3, then 4, then 5)
}) {
  // === Responsive scaling wrapper ==========================================
  const BASE_W = 950, BASE_H = 500; // keep your original canvas size
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = (entry) => {
      const cw = (entry?.contentRect?.width ?? el.clientWidth) || BASE_W;
      const vw = window.innerWidth || cw;
      const vh = window.innerHeight || BASE_H;

      // Always fit by width
      let s = cw / BASE_W;

      // On small screens, keep some vertical room for controls/chat
      if (vw < 640) {
        const sHeightCap = (vh * 0.42) / BASE_H; // tweak 0.42 if you want more/less headroom
        s = Math.min(s, sHeightCap);
      }

      // Allow down to 0.30 on tiny screens, never upscale past 1
      setScale(Math.min(1, Math.max(0.30, s)));
    };

    const ro = new ResizeObserver(([entry]) => compute(entry));
    ro.observe(el);

    const onWin = () => compute();
    window.addEventListener('resize', onWin);
    window.addEventListener('orientationchange', onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
      window.removeEventListener('orientationchange', onWin);
    };
  }, []);
  // ==========================================================================

  // === Mobile-aware UI sizing (does NOT affect position math) ===============
  const [isMobile, setIsMobile] = useState(
    (typeof window !== 'undefined') ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const MOBILE_BOOST = 1.2;                // 20% larger seat/card UI on phones
  const cardW   = isMobile ? 60 : 55;      // hole card width
  const boardW  = isMobile ? 72 : 60;      // board card width
  const seatW   = isMobile ? Math.round(120 * MOBILE_BOOST) : 120;
  const seatH   = isMobile ? Math.round(48  * MOBILE_BOOST) : 48;
  const chipSize = isMobile ? 36 : 32;
  const chipPosFactor = isMobile ? 0.7 : 0.5; // bring chips closer to seat on phones
  // ==========================================================================

  // TABLESIZE (keep all your original math)
  const width = BASE_W, height = BASE_H;
  const cx = width / 2, cy = height / 2;
  const rx = width / 2 - seatW;
  const ry = height / 2 - seatH;
  const chipSrc = `${process.env.PUBLIC_URL}/chips/chip.png`;

  const cardStyle = {
    width: `${cardW}px`,
    backgroundColor: 'white',
    padding: '2px',
    borderRadius: '4px',
    zIndex: 10,
  };

  // BOARD card styling
  const boardCardStyle = {
    width: `${boardW}px`,
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
    <div
      ref={containerRef}
      className="mx-auto my-4 w-full max-w-[1000px] relative"
      style={{ height: BASE_H * scale }}   // reserve scaled height so nothing overlaps
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          className="absolute inset-0 bg-green-700"
          style={{
            border: '4px solid #2e7d32',
            borderRadius: '50% / 25%',
          }}
        />

        {/* Pot display */}
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

        {/* Center board (0..5 cards exactly as provided) */}
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

          // chip position (closer to seat on mobile)
          const midX = cx + (rx * chipPosFactor) * Math.cos(angle) - chipSize / 2;
          const midY = cy + (ry * chipPosFactor) * Math.sin(angle) - chipSize / 2;

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
                        fontSize: isMobile ? 13 : 12,
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
                  fontSize: isMobile ? '0.95rem' : undefined, // larger labels on phones
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
                    {cards.map((card, idx2) => (
                      <img
                        key={`${label}-${idx2}-${card}`}
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
                      fontSize: isMobile ? '0.85rem' : '0.75rem',
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
  board: PropTypes.arrayOf(PropTypes.string)
};
