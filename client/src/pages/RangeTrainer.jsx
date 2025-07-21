// src/pages/RangeTrainer.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useRanges } from '../contexts/RangeContext';
import TableDisplay from '../components/TableDisplay';
import RangeHeatmap from '../components/RangeHeatmap';
import { positionOptions } from '../data/ranges';
import { dealCombo } from '../utils/rangeUtils';

export default function RangeTrainer() {
  const { full: fullRanges, ranges } = useRanges();

  const ALL_COMBOS = useMemo(() => {
    const R = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const combos = [];
    for (let i = 0; i < R.length; i++) {
      for (let j = 0; j < R.length; j++) {
        if (i === j) combos.push(R[i] + R[j]);
        else if (j < i) combos.push(R[i] + R[j] + 'o');
        else combos.push(R[i] + R[j] + 's');
      }
    }
    return combos;
  }, []);

  const [players, setPlayers] = useState(6);
  const [scenario, setScenario] = useState(null);
  const [stackedSeats, setStackedSeats] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [answered, setAnswered] = useState(false);

  const generateScenario = () => {
    const newPlayers = Math.floor(Math.random() * 5) + 2;
    const activePositions = positionOptions.slice(0, newPlayers);
    const heroPos = activePositions[Math.floor(Math.random() * newPlayers)];
    const buttonPos = 'BTN';

    const combo = ALL_COMBOS[Math.floor(Math.random() * ALL_COMBOS.length)];
    const [c1, c2] = dealCombo(combo);

    const heroSet = ranges[heroPos] || new Set(fullRanges[heroPos]);
    const correctResponse = heroSet.has(combo) ? 'raise' : 'fold';

    return {
      players: newPlayers,
      activePositions,
      heroPosition: heroPos,
      buttonPosition: buttonPos,
      heroCards: [c1, c2],
      combo,
      correctResponse,
    };
  };

  useEffect(() => {
    const first = generateScenario();
    setScenario(first);
    setPlayers(first.players);
    setStackedSeats(
      first.activePositions.filter((p) => p !== first.heroPosition)
    );
  }, []);

  const handleNextHand = () => {
    setFeedback('');
    setAnswered(false);
    const next = generateScenario();
    setScenario(next);
    setPlayers(next.players);
    setStackedSeats(
      next.activePositions.filter((p) => p !== next.heroPosition)
    );
  };

  const handleAnswer = (action) => {
    if (!scenario || answered) return;
    const correct = action === scenario.correctResponse;
    setFeedback(
      correct
        ? '✅ Correct!'
        : `❌ Wrong — correct is ${scenario.correctResponse}`
    );
    if (action === 'call' || action === 'raise') {
      setStackedSeats((prev) =>
        prev.includes(scenario.heroPosition)
          ? prev
          : [...prev, scenario.heroPosition]
      );
    }
    setAnswered(true);
  };

  const heroSet = scenario
    ? ranges[scenario.heroPosition] ||
      new Set(fullRanges[scenario.heroPosition])
    : new Set();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Range Memorizer Trainer</h1>
      <p className="mb-6 text-gray-700 leading-relaxed">
        Train your memory by deciding between Folding, Calling, and Raising. The
        answers are pulled from the range tables set in the Range Settings Tab.
      </p>

      {/* Controls */}
      <div className="flex gap-6 mb-6 items-center">
        <div>
          <label className="block font-medium">Hero Position</label>
          <select
            className="mt-1 p-2 border rounded"
            value={scenario?.heroPosition || 'BTN'}
            onChange={() => {}}
            disabled
          >
            <option>{scenario?.heroPosition}</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Players In</label>
          <select
            className="mt-1 p-2 border rounded"
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value))}
            disabled={answered}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleNextHand}
          disabled={false}
        >
          Next Hand
        </button>
      </div>

      {scenario && (
        <TableDisplay
          activePositions={scenario.activePositions}
          buttonPosition={scenario.buttonPosition}
          heroPosition={scenario.heroPosition}
          playerHands={{ [scenario.heroPosition]: scenario.heroCards }}
          stackedSeats={stackedSeats}
        />
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        {['fold', 'call', 'raise'].map((action) => (
          <button
            key={action}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => handleAnswer(action)}
            disabled={answered}
          >
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && <div className="mt-4 text-lg font-medium">{feedback}</div>}

      {/* Debug info 
      {scenario && (
        <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
          <strong>DEBUG:</strong>
          <p>User Position: <code>{scenario.heroPosition}</code></p>
          <p>Dealt Hand: <code>{scenario.combo}</code></p>
          <p>Correct Answer: <code>{scenario.correctResponse}</code></p>
          <p>Range Size: <code>{heroSet.size}</code> combos</p>
          <p>In Range? {heroSet.has(scenario.combo) ? '✅ yes' : '❌ no'}</p>
        </div>
      )}
	  */}
      {/* Range Chart */}
      {feedback && scenario && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Your Range</h2>
          <RangeHeatmap
            combos={fullRanges[scenario.heroPosition]}
            selected={heroSet}
            onToggle={() => {}}
            highlight={scenario.combo}
          />
        </div>
      )}
    </div>
  );
}
