// A simple card and board model for 6max 100bb

export const SUITS = ['h', 'd', 'c', 's'];
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

export function createDeck() {
  const deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

export function removeCards(deck, cardsToRemove) {
  return deck.filter((card) => !cardsToRemove.includes(card));
}
