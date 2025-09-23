// src/pages/AICoaching.jsx
import React, { useState, useEffect } from 'react';
import TableDisplay from '../components/TableDisplay';
// import CardImage from '../components/CardImage'; // no longer needed (board renders in TableDisplay)
import Chatbot from '../components/Chatbot';
import { dealHand, revealNextCard } from '../utils/pokerSimulation.js';
import { rangesByPosition } from '../data/ranges.js';
import { calculateEquity } from '../utils/equityCalc.js';
import { sendToAI } from '../utils/aiService.js';
import {
  DEFAULT_STACK_BB,
  BLINDS,
  initStacks,
  postBlinds,
  freshBetState,
  startStreet,
  nextStreetName,
  potOdds,
  applyHeroAction,
  simpleVillainRespond
} from '../utils/betEngine.js';

export default function AICoaching() {
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const [position, setPosition] = useState('');
  const [hand, setHand] = useState({ playerCards: [], board: [], deck: null });
  const [stage, setStage] = useState('pre-flop');
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stacks, setStacks] = useState(() => initStacks(positions, DEFAULT_STACK_BB));
  const [bet, setBet] = useState(freshBetState());
  const [betInput, setBetInput] = useState(2.5);
  const [villains, setVillains] = useState([]);
  const [handReview, setHandReview] = useState('');
  const activePositions = positions.filter(p => !bet.folded.has(p));
  const blindsOnly = ['SB', 'BB'];
  const stackedSeats = stage === 'pre-flop' ? blindsOnly : positions.filter(p => p !== position);
  // --- Action availability (BB free-check, no 'Check' when facing a bet, etc.)
  const EPS = 1e-6;
  const heroPutNow = bet?.putInRound?.[position] ?? 0;
  const currentBet = bet?.currentBet ?? 0;
  const toCallNow = Math.max(0, currentBet - heroPutNow);

  const canCheck = toCallNow <= EPS;   // no bet to match
  const canCall  = toCallNow > EPS;    // facing a bet/raise
  const raiseLabel = 'Raise';
  // NEW: reveal next street and append cards to the board (flop → turn → river)
  const revealNextStreet = () => {
    const { cards, stage: nextStage } = revealNextCard(hand, stage);
    if (cards && cards.length) {
      setHand(prev => ({ ...prev, board: [...(prev.board || []), ...cards] }));
    }
    setStage(nextStage);
  };

  const startNewHand = () => {
	setHandReview('');
    const heroPos = positions[Math.floor(Math.random() * positions.length)];
    const villainSeats = positions.filter(p => p !== heroPos);
    setPosition(heroPos);
    setVillains(villainSeats);

    // Ensure fresh board + deck + hero cards
    const newHand = dealHand();
    setHand({ ...newHand, board: [] });
    setStage('pre-flop');

    // Reset stacks and post blinds
    const base = initStacks(positions, DEFAULT_STACK_BB);
    const withBlinds = postBlinds(base);
    setStacks(withBlinds);

    // Fresh betting state; UTG to act
    const b0 = freshBetState();
    b0.toAct = 'UTG';
    setBet(b0);

    // Pre-hero villain actions (only those before hero position)
    const logs = [];
    let curBet = b0;
    let curStacks = withBlinds;

    for (let v of villainSeats) {
      if (positions.indexOf(v) >= positions.indexOf(heroPos)) break;
      const result = simpleVillainRespond(curBet, curStacks, v);
      curBet = result.bet;
      curStacks = result.stacks;
      logs.push({
        sender: 'ai',
        message:
          result.action === 'call'
            ? `Villain (${v}) calls (pot ${curBet.pot.toFixed(1)}bb).`
            : `Villain (${v}) ${result.action}.`
      });
    }

    setStacks(curStacks);
    setBet(curBet);

    const heroPut = curBet.putInRound[heroPos] ?? 0;
    const toCall = Math.max(0, curBet.currentBet - heroPut);
    const odds = toCall > 0 ? potOdds(toCall, curBet.pot) : null;

    logs.push({
      sender: 'ai',
      message: `You're in ${heroPos} with ${newHand.playerCards.join(', ')}. ${
        toCall > 0
          ? `To call ${toCall.toFixed(1)}bb into ${curBet.pot.toFixed(1)}bb (pot odds ${(odds * 100).toFixed(1)}%).`
          : ''
      } What will you do?`
    });

    setChatLogs(logs);
  };

  useEffect(startNewHand, []);

  const formatCombo = combo => {
    if (!combo || combo.length < 2) return '';
    const r1 = combo[0], r2 = combo[1];
    if (r1 === r2) return `${r1}h${r2}d`;
    const suited = combo[2] === 's';
    return `${r1}h${r2}${suited ? 'h' : 'd'}`;
  };

  // NEW: coaching prompt builder (used for showdown / folds)
  const buildCoachingPrompt = (phase = 'showdown') => {
    const heroStack = stacks?.[position] ?? DEFAULT_STACK_BB;
    const potNow = bet?.pot ?? 0;
    const hole = hand.playerCards.join(', ');
    const boardTxt = hand.board.length ? hand.board.join(', ') : '(no board dealt)';
    const street = bet?.street || stage;
    const villainsIn = positions.filter(p => p !== position && !bet.folded.has(p));

    return `You are a poker coach for 6-max 100bb cash games. Analyze the hand and coach the hero.
Context:
- Hero position: ${position || '—'}
- Hole cards: ${hole || '—'}
- Board: ${boardTxt}
- Street: ${street}
- Pot: ${potNow.toFixed ? potNow.toFixed(1) : potNow} bb
- Hero stack: ${heroStack} bb
- Villains active at end: ${villainsIn.join(', ') || 'none'}

Task: Provide coaching (not a recap). Use concise bullet points:
1) What went well / mistakes this hand.
2) Recommended line(s) with sizings for the final street reached${phase === 'fold' ? ' and whether folding was optimal given pot odds/ranges' : ''}.
3) Key math (pot odds, equity benchmarks, SPR, outs) relevant here.
4) One actionable takeaway for next time.

Keep it under ~150 words. Be specific to this hand. Avoid generic advice.`;
  };

  const processAction = async (action) => {
    if (stage === 'showdown') return;

    // Recompute each time in case state moved since render
    const heroPutNow2 = bet?.putInRound?.[position] ?? 0;
    const currentBet2 = bet?.currentBet ?? 0;
    const toCall2 = Math.max(0, currentBet2 - heroPutNow2);
    const canCheckNow = toCall2 <= 1e-6;
    const canCallNow  = toCall2 > 1e-6;

    // Sanity guards so we don't send invalid actions to the engine
    let normalized = action;
    if (action === 'check' && !canCheckNow) {
      setChatLogs(prev => [
        ...prev,
        { sender: 'ai', message: `You can’t check here — you have ${toCall2.toFixed(1)}bb to call.` }
      ]);
      return;
    }
    if (action === 'call' && !canCallNow) {
      // BB free option: treat as check instead of call
      normalized = 'check';
    }

    const target = Number.isFinite(betInput) ? Math.max(BLINDS.bb, betInput) : BLINDS.bb;
    const heroRes = applyHeroAction(bet, stacks, position, normalized, target);
    setStacks(heroRes.stacks);
    setBet(heroRes.bet);

    const suffix = (normalized === 'bet' || normalized === 'raise') ? ` to ${target}bb` : '';
    let logs = [...chatLogs, { sender: 'user', message: `I choose to ${normalized}${suffix}` }];

    if (heroRes.handComplete) {
  setStage('showdown');
  setChatLogs(logs);          // keep normal action logs
  setLoading(true);
  const coach = await sendToAI(buildCoachingPrompt('fold'), logs);
  setLoading(false);
  setHandReview(coach);       // ⬅️ goes to Hand Review panel
  return;

}

    let curBet = heroRes.bet;
    let curStacks = heroRes.stacks;
    const activeVillains = villains.filter(v => !curBet.folded.has(v));

    for (let v of activeVillains) {
      const result = simpleVillainRespond(curBet, curStacks, v);
      curBet = result.bet;
      curStacks = result.stacks;
      logs.push({
        sender: 'ai',
        message: result.action === 'call'
          ? `Villain (${v}) calls (pot ${curBet.pot.toFixed(1)}bb).`
          : `Villain (${v}) ${result.action}.`
      });
    }

    setStacks(curStacks);
    setBet(curBet);

    const stillIn = villains.filter(v => !curBet.folded.has(v));
    if (stillIn.length === 0) {
      setStage('showdown');
      const endLogs = [
        ...logs,
        { sender: 'ai', message: 'All villains folded. You win the pot.' },
        { sender: 'ai', message: `Final Pot: ${curBet.pot.toFixed(1)}bb. Hand ends.` }
      ];
      setChatLogs(endLogs);         // keep the “You win” + “Final Pot” messages
setLoading(true);
const coach = await sendToAI(buildCoachingPrompt('win-noflop'), endLogs);
setLoading(false);
setHandReview(coach);         // ⬅️ NOT to chat
return;
    }

    const allMatched =
      stillIn.every(v => (curBet.putInRound[v] ?? 0) >= curBet.currentBet) &&
      (curBet.putInRound[position] ?? 0) >= curBet.currentBet;

    if (allMatched) {
      const next = nextStreetName(curBet.street);
      if (next === 'showdown') {
        setStage('showdown');
setChatLogs(logs);
setLoading(true);
const coach = await sendToAI(buildCoachingPrompt('showdown'), logs);
setLoading(false);
setHandReview(coach);         // ⬅️ NOT to chat
return;
      }

      const { cards: newCards, stage: nextStage } = revealNextCard(hand, stage);
      const nextBoard = [...hand.board, ...newCards];
      setHand(prev => ({ ...prev, board: nextBoard }));
      setStage(nextStage);

      const bNext = { ...curBet, street: next };
      setBet(startStreet(bNext, position));

      let oppCombo = '';
      const posRanges = rangesByPosition[position];
      if (Array.isArray(posRanges)) oppCombo = posRanges[0] || '';
      else if (posRanges && typeof posRanges === 'object') {
        const key = Object.keys(posRanges)[0];
        if (Array.isArray(posRanges[key])) oppCombo = posRanges[key][0] || '';
      }

      const equity = calculateEquity(hand.playerCards.join(''), formatCombo(oppCombo), nextBoard.join(''));
      const equityMsg = typeof equity === 'number' ? `Your equity is ${equity.toFixed(2)}%.` : null;
      const boardMsg = `${next.toUpperCase()} dealt: ${nextBoard.join(', ')}. Pot is ${bNext.pot.toFixed(1)}bb. What will you do?`;

      setChatLogs(
        equityMsg
          ? [...logs, { sender: 'ai', message: boardMsg }, { sender: 'ai', message: equityMsg }]
          : [...logs, { sender: 'ai', message: boardMsg }]
      );

      return;
    }

    // Prompt hero again with updated to-call info
    const heroPut3 = curBet.putInRound[position] ?? 0;
    const toCall3 = Math.max(0, curBet.currentBet - heroPut3);
    if (toCall3 > 0) {
      const odds = potOdds(toCall3, curBet.pot);
      logs.push({
        sender: 'ai',
        message: `To call ${toCall3.toFixed(1)}bb into ${curBet.pot.toFixed(1)}bb (pot odds ${(odds * 100).toFixed(1)}%). Your move?`
      });
    } else {
      logs.push({ sender: 'ai', message: `Action is on you. Pot is ${curBet.pot.toFixed(1)}bb.` });
    }

    setChatLogs(logs);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">AI Coaching</h1>
      <div className="flex gap-8">
        <div className="flex-1">
          <div className="relative w-full h-[600px] ">
            {/* Pot is shown on the felt by TableDisplay; keep or remove this line as you prefer */}
            {/* <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-bold drop-shadow">
              Pot: {bet.pot?.toFixed(1) ?? 0} bb
            </div> */}
            <TableDisplay
              className="absolute inset-0"
              activePositions={activePositions}
              buttonPosition="BTN"
              heroPosition={position}
              playerHands={{ [position]: hand.playerCards }}
              stackedSeats={stackedSeats}
              pot={bet.pot}
              stacks={stacks}
              putInRound={bet.putInRound}
              board={hand.board}
            />
          </div>

           <div className="mt-6 flex flex-wrap justify-center gap-3">
            {stage !== 'showdown' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Amount (bb)</label>
                  <input
                    type="range"
                    min="1"
                    max={stacks[position] ?? DEFAULT_STACK_BB}
                    step="0.5"
                    value={betInput}
                    onChange={e => setBetInput(parseFloat(e.target.value))}
                    className="w-48"
                  />
                  <span>{parseFloat(betInput).toFixed(1)} bb</span>
                </div>

                <button
                  onClick={() => processAction('check')}
                  disabled={!canCheck}
                  className={`px-4 py-2 rounded ${canCheck ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-200 opacity-50 cursor-not-allowed'}`}
                  title={canCheck ? '' : `You must call ${toCallNow.toFixed(1)}bb or fold`}
                >
                  Check
                </button>

                <button
                  onClick={() => processAction('call')}
                  disabled={!canCall}
                  className={`px-4 py-2 rounded ${canCall ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-200 opacity-50 cursor-not-allowed'}`}
                  title={canCall ? '' : 'Nothing to call'}
                >
                  Call
                </button>

                <button
                  onClick={() => processAction('raise')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {raiseLabel}
                </button>

                <button
                  onClick={() => processAction('fold')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Fold
                </button>
              </>
            )}
            <button onClick={startNewHand} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Next Hand</button>
			
          </div>
		  {handReview && (
  <div className="mt-6 w-full max-w-3xl mx-auto">
    <h2 className="text-lg font-semibold mb-2">Hand Review</h2>
    <div className="bg-gray-50 border rounded p-3 text-sm whitespace-pre-wrap">
      {handReview}
    </div>
  </div>
)}
        </div>

        <div className="w-1/3 border-l pl-4 flex flex-col relative">
          <div className="flex-1 overflow-y-auto">
            <Chatbot
              logs={chatLogs}
              loading={loading}
              onSend={msg => setChatLogs(logs => [...logs, { sender: 'user', message: msg }])}
              onReceive={msg => setChatLogs(logs => [...logs, { sender: 'ai', message: msg }])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
