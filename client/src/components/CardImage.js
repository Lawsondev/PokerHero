// src/components/CardImage.jsx
import React from 'react';

export default function CardImage({ card, size = 48 }) {
  if (!card || typeof card !== 'string' || card.length < 2) return null;

  const safeCard = card.trim().toUpperCase(); // Ensures Ah, KS, etc.
  const src = `/cards/${safeCard}.png`;

  return (
    <img
      src={src}
      alt={card}
      width={size}
      height={size}
      className="inline-block mx-1 bg-white p-[2px] rounded"
      onError={() => console.warn(`Image not found for card: ${card}`)}
    />
  );
}