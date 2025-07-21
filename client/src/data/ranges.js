// client/src/data/ranges.js

// 6-max table positions
export const positionOptions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

/**
 * Ranges by position, now organized into named categories.
 * For now each position only has an "RFI" range, but you can add
 * additional keys (e.g. "3B", "4B") beside RFI in the future.
 */
export const rangesByPosition = {
  // Early (UTG): ~10% RFI
  UTG: {
    RFI: [
      '77+', // 77,88,99,TT,JJ,QQ,KK,AA
      'ATs+', // ATs,AJs,AQs,AKs
      'AQo+', // ATo,AJo,AQo,AKo
      'KQs', // King-Queen suited
    ],
  },

  // Middle (MP = UTG+2): ~15.7% RFI
  MP: {
    RFI: ['66+', 'A9s+', 'KJs+', 'QTs+', 'JTs', 'ATo+', 'KQo'],
  },

  // Cutoff: ~27% RFI
  CO: {
    RFI: ['55+', 'A5s+', 'K9s+', 'QTs+', 'JTs+', 'T9s+', 'ATo+', 'KJo', 'QJo'],
  },

  // Button: ~51% RFI
  BTN: {
    RFI: [
      '22+',
      'A2s+',
      'K2s+',
      'Q2s+',
      'J2s+',
      'T2s+',
      'A2o+',
      'KTo+',
      'QTo+',
      'JTo',
      'T9s+',
      '98s+',
      '87s+',
      '76s+',
      '65s+',
      '54s+',
    ],
  },

  // Small Blind: ~21.9% RFI (raise for value & bluff)
  SB: {
    RFI: [
      '22+',
      'A2s+',
      'K5s+',
      'Q9s+',
      'J9s+',
      'T8s+',
      '98s+',
      '87s+',
      '76s+',
      '65s+',
      '54s+',
      'A2o+',
      'K9o+',
      'QTo+',
      'JTo',
    ],
  },

  // Big Blind: same as SB RFI
  BB: {
    RFI: [
      '22+',
      'A2s+',
      'K5s+',
      'Q9s+',
      'J9s+',
      'T8s+',
      '98s+',
      '87s+',
      '76s+',
      '65s+',
      '54s+',
      'A2o+',
      'K9o+',
      'QTo+',
      'JTo',
    ],
  },
};
