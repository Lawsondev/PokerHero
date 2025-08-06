// src/utils/pokerSimulation.js

// Simple in-repo Deck implementation
class Deck {
  constructor() {
    const suits = ['h','d','c','s'];
    const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
    this.cards = suits.flatMap(suit => ranks.map(r => r + suit));
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  draw() {
    // Return an object with a `.code` property for compatibility
    return { code: this.cards.pop() };
  }
}

// Deal a fresh hand
export function dealHand() {
  const deck = new Deck();
  deck.shuffle();
  const playerCards = [deck.draw(), deck.draw()].map(c => c.code);
  return { playerCards, board: [], deck };
}

// Reveal flop/turn/river and generate placeholder feedback
export function revealNextCard({ playerCards, board, deck }, currentStage) {
  let cardsToReveal = 0, nextStage;
  switch (currentStage) {
    case 'pre-flop': cardsToReveal = 3; nextStage = 'flop'; break;
    case 'flop':     cardsToReveal = 1; nextStage = 'turn'; break;
    case 'turn':     cardsToReveal = 1; nextStage = 'river'; break;
    default:         cardsToReveal = 0; nextStage = 'showdown';
  }

  const cards = [];
  for (let i = 0; i < cardsToReveal; i++) {
    cards.push(deck.draw().code);
  }

  const feedback = `After the ${nextStage}, your cards are ${[...playerCards, ...board, ...cards].join(', ')}. Consider your equity.`;
  return { cards, stage: nextStage, feedback };
}
