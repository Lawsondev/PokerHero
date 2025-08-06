import { Hand } from 'pokersolver';

const allRanks = [
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
const allSuits = ['h', 'd', 'c', 's'];

function generateDeck(exclude) {
  const deck = [];
  for (const rank of allRanks) {
    for (const suit of allSuits) {
      const card = rank + suit;
      if (!exclude.includes(card)) {
        deck.push(card);
      }
    }
  }
  return deck;
}

function getRandomCards(deck, count) {
  const result = [];
  const deckCopy = [...deck];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * deckCopy.length);
    result.push(deckCopy.splice(idx, 1)[0]);
  }
  return result;
}

export function calculateEquity(
  heroHandStr,
  oppHandStr,
  boardStr = '',
  iterations = 1000
) {
  // Parse hands same as before:
  if (heroHandStr.length !== 4 || oppHandStr.length !== 4) {
    return 'Invalid hand format';
  }

  const heroHand = [heroHandStr.slice(0, 2), heroHandStr.slice(2, 4)];
  const oppHand = [oppHandStr.slice(0, 2), oppHandStr.slice(2, 4)];

  // Parse board cards from boardStr:
  const boardCards = [];
  for (let i = 0; i < boardStr.length; i += 2) {
    boardCards.push(boardStr.slice(i, i + 2));
  }

  if (boardCards.length > 5) {
    return 'Board cannot have more than 5 cards';
  }

  // Check for duplicates (hero, opp, board)
  const allUsedCards = [...heroHand, ...oppHand, ...boardCards];
  const uniqueCards = new Set(allUsedCards);
  if (uniqueCards.size !== allUsedCards.length) {
    return 'Duplicate cards detected';
  }

  // Generate deck excluding all known cards:
  const deck = generateDeck(allUsedCards);

  const cardsToDraw = 5 - boardCards.length;

  let heroWins = 0;
  let oppWins = 0;
  let ties = 0;

  for (let i = 0; i < iterations; i++) {
    const drawnCards = getRandomCards(deck, cardsToDraw);

    const fullBoard = [...boardCards, ...drawnCards];

    const hero = Hand.solve([...heroHand, ...fullBoard]);
    const opp = Hand.solve([...oppHand, ...fullBoard]);

    const winner = Hand.winners([hero, opp]);

    if (winner.length > 1) {
      ties++;
    } else if (winner[0] === hero) {
      heroWins++;
    } else {
      oppWins++;
    }
  }

  const heroEquity = ((heroWins + ties / 2) / iterations) * 100;

      // new—return a pure Number (rounded to 2 decimals)
  return parseFloat(heroEquity.toFixed(2));


}
