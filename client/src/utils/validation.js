const validRanks = [
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
const validSuits = ['c', 'd', 'h', 's'];

export function validateCards(str, expectedLength) {
  if (str.length !== expectedLength) return false;

  for (let i = 0; i < str.length; i += 2) {
    const rank = str[i].toUpperCase();
    const suit = str[i + 1].toLowerCase();

    if (!validRanks.includes(rank)) return false;
    if (!validSuits.includes(suit)) return false;
  }
  return true;
}

export function hasDuplicates(cardsArray) {
  const set = new Set(cardsArray);
  return set.size !== cardsArray.length;
}
