// src/pages/AICoaching.jsx
import React, { useState, useEffect } from 'react';
import TableDisplay from '../components/TableDisplay';
import CardImage from '../components/CardImage';
import Chatbot from '../components/Chatbot';
import { dealHand, revealNextCard } from '../utils/pokerSimulation.js';
import { rangesByPosition } from '../data/ranges.js';
import { calculateEquity } from '../utils/equityCalc.js';
import { sendToAI } from '../utils/aiService.js';

export default function AICoaching() {
  // Available seats
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  // Track hero's seat
  const [position, setPosition] = useState('');

  // Poker state
  const [hand, setHand] = useState({ playerCards: [], board: [], deck: null });
  const [stage, setStage] = useState('pre-flop');
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const activePositions = positions;
  // Show only blinds pre-flop, then all opponents post-flop
  const blinds = ['SB','BB'];
  const stackedSeats = stage === 'pre-flop' ? blinds : positions.filter(p => p !== position);

  // Start new hand: randomize seat and deal
  const startNewHand = () => {
    const randomPos = positions[Math.floor(Math.random() * positions.length)];
    setPosition(randomPos);
    const newHand = dealHand();
    setHand(newHand);
    setStage('pre-flop');
    setChatLogs([
      { sender: 'ai', message: `You're in ${randomPos} with ${newHand.playerCards.join(', ')}. What will you do?` }
    ]);
  };

  useEffect(startNewHand, []);

  const formatCombo = combo => {
    if (!combo || combo.length < 2) return '';
    const r1 = combo[0], r2 = combo[1];
    if (r1 === r2) return `${r1}h${r2}d`;
    const suited = combo[2] === 's';
    return `${r1}h${r2}${suited ? 'h' : 'd'}`;
  };

  const processAction = async action => {
    if (stage === 'showdown') return;

    const userLog = { sender: 'user', message: `I choose to ${action}` };
    const baseLogs = [...chatLogs, userLog];

    // Fold: end immediately
    if (action === 'fold') {
      setStage('showdown');
      setChatLogs(baseLogs);
      setLoading(true);
      const foldSummary = await sendToAI(
        'Please evaluate the fold decision: was folding optimal here, and why?',
        baseLogs
      );
      setLoading(false);
      setChatLogs(prev => [...prev, { sender: 'ai', message: foldSummary }]);
      return;
    }

    // Call/Raise: deal next street
    const { cards: newCards, stage: nextStage } = revealNextCard(hand, stage);
    const nextBoard = [...hand.board, ...newCards];
    setHand(prev => ({ ...prev, board: nextBoard }));
    setStage(nextStage);

    // Equity calculation
    let oppCombo = '';
    const posRanges = rangesByPosition[position];
    if (Array.isArray(posRanges)) oppCombo = posRanges[0] || '';
    else if (posRanges && typeof posRanges === 'object') {
      const key = Object.keys(posRanges)[0];
      if (Array.isArray(posRanges[key])) oppCombo = posRanges[key][0] || '';
    }
    const heroStr = hand.playerCards.join('');
    const oppStr = formatCombo(oppCombo);
    const boardStr = nextBoard.join('');
    const equityVal = calculateEquity(heroStr, oppStr, boardStr);
    const displayEquity = typeof equityVal === 'number' ? equityVal.toFixed(2) + '%' : null;

    // Handle flop/turn
    if (nextStage === 'flop' || nextStage === 'turn') {
      const boardDisplay = nextBoard.join(', ');
      const stageName = nextStage.charAt(0).toUpperCase() + nextStage.slice(1);
      const boardMsg = `${stageName} dealt: ${boardDisplay}. What will you do?`;
      const equityMsg = displayEquity ? `After the ${nextStage}, your equity is ${displayEquity}.` : null;
      setChatLogs(
        equityMsg
          ? [...baseLogs, { sender: 'ai', message: boardMsg }, { sender: 'ai', message: equityMsg }]
          : [...baseLogs, { sender: 'ai', message: boardMsg }]
      );
      return;
    }

    // Handle river
    if (nextStage === 'river') {
      const boardDisplay = nextBoard.join(', ');
      const boardMsg = `River dealt: ${boardDisplay}. What will you do?`;
      setChatLogs([...baseLogs, { sender: 'ai', message: boardMsg }]);
      return;
    }

    // Showdown summary
    if (nextStage === 'showdown') {
      setStage('showdown');
      setChatLogs(baseLogs);
      setLoading(true);
      const summary = await sendToAI(
        'Please summarize the hand that just ended, commenting on the player decisions and outcome.',
        baseLogs
      );
      setLoading(false);
      setChatLogs(prev => [...prev, { sender: 'ai', message: summary }]);
      return;
    }

    // Default
    setChatLogs(baseLogs);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">AI Coaching</h1>
      <div className="flex gap-8">
        {/* Table & Controls */}
        <div className="flex-1">
          <div className="relative w-full h-[400px]">
            <TableDisplay
              className="absolute inset-0"
              activePositions={activePositions}
              buttonPosition="BTN"
              heroPosition={position}
              playerHands={{ [position]: hand.playerCards }}
              stackedSeats={stackedSeats}
            />
            {/* Centered board cards */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-2">
              {hand.board.map(card => (
                <CardImage key={card} card={card} size={48} />
              ))}
            </div>
          </div>
          {/* Action buttons & Next Hand */}
          <div className="mt-6 flex justify-center space-x-4">
            {stage !== 'showdown' && ['fold', 'call', 'raise'].map(a => (
              <button
                key={a}
                onClick={() => processAction(a)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
            <button
              onClick={startNewHand}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Next Hand
            </button>
          </div>
        </div>

        {/* Chat */}
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
