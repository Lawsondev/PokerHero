export const trainerScenarios = [
  {
    players: 2,
    lastAction: 'raise',
    toAct: 'hero',
    heroPosition: 'BB', // ✚ which seat the hero occupies
    heroCards: ['Ad', 'Ah'],
    buttonPosition: 'SB',
    correctResponse: 'raise',
  },
  {
    players: 2,
    lastAction: 'fold',
    toAct: 'hero',
    heroPosition: 'BTN',
    heroCards: ['Qs', 'Js'],
    buttonPosition: 'SB',
    correctResponse: 'call',
  },
  // …more scenarios…
];
