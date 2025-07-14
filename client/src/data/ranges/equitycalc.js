import { evaluate } from 'poker-evaluator';
import parseRange from 'poker-hand-range';

export function calculateEquity(range1, range2, board = []) {
  const hands1 = parseRange(range1);
  const hands2 = parseRange(range2);

  let wins1 = 0;
  let wins2 = 0;
  let ties = 0;
  let total = 0;

  hands1.forEach((hand1) => {
    hands2.forEach((hand2) => {
      // Skip duplicate cards
      const allCards = [...hand1, ...hand2, ...board];
      const cardSet = new Set(allCards);
      if (cardSet.size !== allCards.length) return;

      const result1 = evaluate([...hand1, ...board]);
      const result2 = evaluate([...hand2, ...board]);

      total++;
      if (result1.value > result2.value) wins1++;
      else if (result2.value > result1.value) wins2++;
      else ties++;
    });
  });

  return {
    equity1: (((wins1 + ties / 2) / total) * 100).toFixed(2),
    equity2: (((wins2 + ties / 2) / total) * 100).toFixed(2),
  };
}
