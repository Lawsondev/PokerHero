// utils/rangeUtils.js

// Returns two random, non-matching hands from a list

export function pickTwoRandomFromRange(range) {
  if (!Array.isArray(range) || range.length < 2) return ['', ''];
  const shuffled = [...range].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
}


const SUITS = ['h','d','c','s'];

/**
 * Given a combo string like 'AKs', 'QJo', or '77',
 * return an array of two specific cards, e.g. ['Ah','Kh'].
 */
export function dealCombo(combo) {
  const rank1 = combo[0];
  const rank2 = combo[1];
  const type  = combo[2] || ''; // 's', 'o', or '' for pairs

  // Pick two distinct suits
  const pickTwo = () => {
    const copy = SUITS.slice();
    const s1 = copy.splice(Math.floor(Math.random()*copy.length), 1)[0];
    const s2 = copy[Math.floor(Math.random()*copy.length)];
    return [s1, s2];
  };

  if (rank1 === rank2) {
    // pocket pair: pick any two suits
    const [s1, s2] = pickTwo();
    return [`${rank1}${s1}`, `${rank2}${s2}`];
  }

  if (type === 's') {
    // suited: pick one suit, use for both
    const s = SUITS[Math.floor(Math.random()*SUITS.length)];
    return [`${rank1}${s}`, `${rank2}${s}`];
  }

  // offsuit: pick two different suits
  const [s1, s2] = pickTwo();
  return [`${rank1}${s1}`, `${rank2}${s2}`];
}