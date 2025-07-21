// src/utils/rangeParser.js

export const RANKS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
  'A',
];

export function expandShorthand(shorthand) {
  const isPlus = shorthand.endsWith('+');
  const core = isPlus ? shorthand.slice(0, -1) : shorthand;

  // Pocket pairs
  if (core.length === 2 && core[0] === core[1]) {
    const idx = RANKS.indexOf(core[0]);
    if (idx === -1) return [];
    const end = isPlus ? RANKS.length - 1 : idx;
    return RANKS.slice(idx, end + 1).map((r) => `${r}${r}`);
  }

  // Suited / offsuit
  if (core.length === 3) {
    const [r1, r2, suffix] = core;
    const i1 = RANKS.indexOf(r1);
    const i2 = RANKS.indexOf(r2);
    if (i1 === -1 || i2 === -1) return [];
    const end = isPlus ? i1 - 1 : i2;
    return RANKS.slice(i2, end + 1).map((r) => `${r1}${r}${suffix}`);
  }

  return [];
}

export function expandAllRanges(rangesByPosition) {
  const expanded = {};

  for (const pos in rangesByPosition) {
    if (!Object.prototype.hasOwnProperty.call(rangesByPosition, pos)) continue;

    const entry = rangesByPosition[pos];

    if (Array.isArray(entry)) {
      // legacy flat list → treat as one big range
      expanded[pos] = entry.flatMap(expandShorthand);
    } else {
      // multiple categories (e.g., RFI, 3B, etc.)
      const allCombos = Object.values(entry).flat().flatMap(expandShorthand);

      expanded[pos] = allCombos;
    }
  }

  return expanded;
}
