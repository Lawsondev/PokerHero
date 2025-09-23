// client/src/utils/pokerSimulation.js

// Build a fresh, ordered 52-card deck of codes like '2c','Ah','Td'
function buildDeck() {
  const suits = ['c', 'd', 'h', 's'];                  // lowercase suits to match /public/cards/*.png
  const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A']; // 'T' for Ten, upper-case faces
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push(`${r}${s}`);
  return deck;
}

// Fisher-Yates in-place shuffle
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Deals a new hand for the hero (2 cards) and returns a hand state.
 * Shape matches AICoaching.jsx expectations.
 * @returns {{ deck: string[], playerCards: string[], board: string[] }}
 */
export function dealHand() {
  const deck = shuffle(buildDeck());
  // Hero gets two off the top
  const playerCards = [deck.pop(), deck.pop()];
  return {
    deck,               // remaining deck after removing hero cards
    playerCards,        // e.g. ['Ah', 'Td']
    board: []           // [] initially; board is revealed later
  };
}

/**
 * Reveals the next set of community cards based on the current stage.
 * IMPORTANT: Mutates the passed-in hand.deck by popping cards, so subsequent
 * calls continue from the same shoe. This matches how AICoaching.jsx passes
 * the old `hand` and only updates `board` in state.
 *
 * @param {{deck:string[], playerCards:string[], board:string[]}} hand
 * @param {'pre-flop'|'flop'|'turn'|'river'|'showdown'} stage
 * @returns {{cards: string[], stage: 'flop'|'turn'|'river'|'showdown'}}
 */
export function revealNextCard(hand, stage) {
  // Defensive copy of stage; we’ll mutate hand.deck but NOT hand.board here.
  let nextStage = stage;
  let count = 0;

  switch (stage) {
    case 'pre-flop':
      nextStage = 'flop';
      count = 3;
      break;
    case 'flop':
      nextStage = 'turn';
      count = 1;
      break;
    case 'turn':
      nextStage = 'river';
      count = 1;
      break;
    default:
      // 'river' or anything else ends at showdown
      return { cards: [], stage: 'showdown' };
  }

  if (!hand || !Array.isArray(hand.deck)) {
    // Fail-safe: if somehow missing, rebuild a fresh deck excluding used cards.
    const used = new Set([...(hand?.playerCards ?? []), ...(hand?.board ?? [])]);
    const rebuilt = shuffle(buildDeck().filter(c => !used.has(c)));
    hand.deck = rebuilt;
  }

  const drawn = [];
  for (let i = 0; i < count; i++) {
    const card = hand.deck.pop();
    if (!card) break; // deck exhausted—shouldn't happen, but don't crash
    drawn.push(card);
  }

  return { cards: drawn, stage: nextStage };
}
