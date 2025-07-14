// src/utils/rangeParser.js

// Ordered list of ranks for reference & indexing
export const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];

/**
 * Expand a shorthand string into a list of generic combos.
 * Supports:
 *  - Pocket pairs: '22', '22+'
 *  - Suited combos: 'A2s', 'A2s+', 'K9s+'
 *  - Offsuit combos: 'A2o', 'A2o+', 'KJo+'
 *
 * Examples:
 *   expandShorthand('22+')  => ['22','33','44',...,'AA']
 *   expandShorthand('A2s+') => ['A2s','A3s','A4s',...,'AKs']
 *   expandShorthand('K9o')  => ['K9o']
 *
 * @param {string} shorthand
 * @returns {string[]}
 */
export function expandShorthand(shorthand) {
  const isPlus = shorthand.endsWith('+');
  const core = isPlus ? shorthand.slice(0, -1) : shorthand;

  // Pocket pairs
  if (core.length === 2 && core[0] === core[1]) {
    const idx = RANKS.indexOf(core[0]);
    if (idx === -1) return [];
    const end = isPlus ? RANKS.length - 1 : idx;
    return RANKS.slice(idx, end + 1).map(r => `${r}${r}`);
  }

  // Suited / offsuit
  if (core.length === 3) {
    const [r1, r2, suffix] = core;
    const i1 = RANKS.indexOf(r1);
    const i2 = RANKS.indexOf(r2);
    if (i1 === -1 || i2 === -1) return [];
    // for "X2s+" we go from r2 up to one below r1
    const end = isPlus ? i1 - 1 : i2;
    return RANKS.slice(i2, end + 1).map(r => `${r1}${r}${suffix}`);
  }

  // unrecognized
  return [];
}

/**
 * Expand an object of shorthand ranges into full generic combo lists.
 *
 * Supports two shapes for `rangesByPosition`:
 *
 * 1) Legacy flat array:
 *    { UTG: ['22+','A2s+'], MP: […], … }
 *
 * 2) New nested-by-category:
 *    { UTG: { RFI: […], '3B': […], '4B': […] }, MP: { RFI: […], … }, … }
 *
 * @param {Object.<string, string[]|Object.<string,string[]>>} rangesByPosition
 * @returns {Object.<string, Object.<string,string[]>>}
 */
export function expandAllRanges(rangesByPosition) {
  const expanded = {};

  for (const pos in rangesByPosition) {
    if (!Object.prototype.hasOwnProperty.call(rangesByPosition, pos)) continue;

    const entry = rangesByPosition[pos];

    if (Array.isArray(entry)) {
      // legacy: treat as RFI
      expanded[pos] = {
        RFI: entry.flatMap(expandShorthand)
      };
    } else {
      // nested categories
      expanded[pos] = {};
      for (const cat in entry) {
        if (!Object.prototype.hasOwnProperty.call(entry, cat)) continue;
        expanded[pos][cat] = entry[cat].flatMap(expandShorthand);
      }
    }
  }

  return expanded;
}
