// src/utils/betEngine.js

// Basic helpers for a 6-max table, single-action MVP.
// We track stacks in big blinds (bb).

export const DEFAULT_STACK_BB = 100;
export const BLINDS = { sb: 0.5, bb: 1 };

export function initStacks(positions, starting = DEFAULT_STACK_BB) {
  const s = {};
  positions.forEach(p => { s[p] = starting; });
  return s;
}

export function postBlinds(stacks) {
  const s = { ...stacks };
  s.SB -= BLINDS.sb;
  s.BB -= BLINDS.bb;
  return s;
}

export function freshBetState() {
  return {
    street: 'pre',             // 'pre' | 'flop' | 'turn' | 'river'
    toAct: 'UTG',
    pot: BLINDS.sb + BLINDS.bb, // 1.5bb after blinds
    currentBet: BLINDS.bb,     // amount to call
    lastRaiseSize: BLINDS.bb,  // how much the last raise increased the bet
    minRaiseTo: BLINDS.bb * 2, // legal min-raise target
    putInRound: {},            // per-position contributed on this street
    folded: new Set(),         // folded players
  };
}

export function startStreet(bet, firstToAct) {
  // Reset round numbers for new street
  const next = { ...bet };
  next.currentBet = 0;
  next.lastRaiseSize = BLINDS.bb;
  next.minRaiseTo = BLINDS.bb;
  next.putInRound = {};
  next.toAct = firstToAct;
  return next;
}

export function nextStreetName(street) {
  if (street === 'pre') return 'flop';
  if (street === 'flop') return 'turn';
  if (street === 'turn') return 'river';
  return 'showdown';
}

export function potOdds(callAmount, pot) {
  if (callAmount <= 0) return 0;
  return callAmount / (pot + callAmount);
}

/**
 * Apply a hero action.
 * @param {object} bet - bet state (mutated via returned copy)
 * @param {object} stacks - stacks map (mutated via returned copy)
 * @param {string} actor - position acting (hero)
 * @param {'check'|'call'|'bet'|'raise'|'fold'} action
 * @param {number} amount - for bet/raiseTo (bb). For call/check/fold ignore.
 * @returns {{bet, stacks, roundComplete:boolean, handComplete:boolean}}
 */
export function applyHeroAction(bet, stacks, actor, action, amount = 0) {
  let b = { ...bet };
  let s = { ...stacks };

  const put = (b.putInRound[actor] ?? 0);

  if (action === 'fold') {
    b.folded = new Set(b.folded);
    b.folded.add(actor);
    // If hero folds, hand is complete immediately for our MVP
    return { bet: b, stacks: s, roundComplete: true, handComplete: true };
  }

  if (action === 'check') {
    // only legal when currentBet == put
    if (b.currentBet !== put) return { bet: b, stacks: s, roundComplete: false, handComplete: false };
    b.toAct = null; // we’ll let the caller decide who’s next / end round
  }

  if (action === 'call') {
    const toCall = Math.max(0, b.currentBet - put);
    const pay = Math.min(toCall, s[actor]); // all-in cap
    s[actor] -= pay;
    b.pot += pay;
    b.putInRound = { ...b.putInRound, [actor]: put + pay };
    b.toAct = null;
  }

  if (action === 'bet') {
    // only legal when currentBet == 0
    if (b.currentBet !== 0) return { bet: b, stacks: s, roundComplete: false, handComplete: false };
    const betSize = Math.max(BLINDS.bb, Math.min(amount, s[actor])); // clamp
    s[actor] -= betSize;
    b.pot += betSize;
    b.currentBet = betSize;
    b.lastRaiseSize = betSize;
    b.minRaiseTo = b.currentBet + b.lastRaiseSize;
    b.putInRound = { ...b.putInRound, [actor]: betSize };
    b.toAct = null;
  }

  if (action === 'raise') {
    // amount is the target "raise to" size (not the add-on)
    const putNow = b.putInRound[actor] ?? 0;
    const toCall = Math.max(0, b.currentBet - putNow);
    const minRaiseTo = b.minRaiseTo;

    const target = Math.max(minRaiseTo, Math.min(amount, putNow + s[actor] + toCall)); // clamp to stack (all-in)
    const addOn = Math.max(0, target - putNow);
    const pay = Math.min(addOn, s[actor]);
    s[actor] -= pay;
    b.pot += pay;

    const raiseSize = target - b.currentBet;
    b.currentBet = target;
    b.lastRaiseSize = Math.max(b.lastRaiseSize, raiseSize);
    b.minRaiseTo = b.currentBet + b.lastRaiseSize;
    b.putInRound = { ...b.putInRound, [actor]: putNow + pay };
    b.toAct = null;
  }

  // Check if round looks complete: all live players have matched currentBet or are all-in/checked
  // For MVP we’ll let the caller decide; we signal roundComplete=true if no one has less than currentBet
  const allPut = Object.values(b.putInRound);
  const anyBehind = allPut.some(v => v < b.currentBet);
  const roundComplete = !anyBehind; // naive but works with hero+simple villain loop

  return { bet: b, stacks: s, roundComplete, handComplete: false };
}

export function simpleVillainRespond(bet, stacks, villainPos) {
  const b = { ...bet };
  const s = { ...stacks };
  const put = b.putInRound[villainPos] ?? 0;
  const toCall = Math.max(0, b.currentBet - put);
  const pot = b.pot;
  const stack = s[villainPos];

  // Check if there's nothing to call
  if (toCall <= 0) {
    b.putInRound = { ...b.putInRound, [villainPos]: put };
    return { bet: b, stacks: s, action: 'check' };
  }

  // Compute pot odds and random aggression
  const odds = potOdds(toCall, pot);
  const rand = Math.random();

  // Basic threshold logic
  if (odds < 0.25 || rand < 0.3) {
    // Call
    const pay = Math.min(toCall, stack);
    s[villainPos] -= pay;
    b.pot += pay;
    b.putInRound = { ...b.putInRound, [villainPos]: put + pay };
    return { bet: b, stacks: s, action: 'call' };
  }

  // Raise 10% of the time if stack allows
  if (rand > 0.9 && stack > toCall + b.lastRaiseSize * 2) {
    const raiseAmount = b.currentBet + b.lastRaiseSize * 2;
    const pay = Math.min(raiseAmount - put, stack);
    s[villainPos] -= pay;
    b.pot += pay;
    b.currentBet = put + pay;
    b.lastRaiseSize = pay - toCall;
    b.minRaiseTo = b.currentBet + b.lastRaiseSize;
    b.putInRound = { ...b.putInRound, [villainPos]: put + pay };
    return { bet: b, stacks: s, action: 'raise' };
  }

  // Otherwise fold
  b.folded = new Set(b.folded);
  b.folded.add(villainPos);
  return { bet: b, stacks: s, action: 'fold' };
}