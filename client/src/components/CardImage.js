import React from 'react';

export default function CardImage({ card, size = 48 }) {
  if (!card || typeof card !== 'string' || card.length < 2) return null;

  // Normalize to match file names (rank uppercase, suit lowercase)
  const code = card.trim();
  const rank = code[0].toUpperCase();
  const suit = code[1].toLowerCase();
  const safeCard = `${rank}${suit}`;

  const src = `${process.env.PUBLIC_URL}/cards/${safeCard}.png`;

  return (
    <img
      src={src}
      alt={safeCard}
      width={size}
      height={size}
      className="inline-block mx-1 bg-white p-1 rounded"
      onError={() => console.warn(`Image not found for card: ${safeCard}`)}
    />
  );
}
