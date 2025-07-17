// src/pages/EquityCalculator.jsx
import React, { useState, useEffect } from 'react';
import { useRanges } from '../contexts/RangeContext';
import { calculateEquity } from '../utils/equityCalc';
import { positionOptions } from '../data/ranges';
import { dealCombo } from '../utils/rangeUtils';
import RangeHeatmap from '../components/RangeHeatmap';
import CardImage from '../components/CardImage';

export default function EquityCalculator() {
  // ——— Ranges & persistence ———
  const { full, ranges, updateRange } = useRanges();
  const rangeNames = Object.keys(ranges);

  // ——— UI state ———
  const [showHeatmaps, setShowHeatmaps]       = useState(false);
  const [heroRangeKey, setHeroRangeKey]       = useState(rangeNames[0] || '');
  const [heroPosition, setHeroPosition]       = useState('BTN');
  const [villainPosition, setVillainPosition] = useState('BB');

  const [heroHand, setHeroHand] = useState('');
  const [oppHand, setOppHand]   = useState('');
  const [board, setBoard]       = useState('');

  const [errors, setErrors]         = useState({ heroHand:'', oppHand:'', board:'', duplicates:'' });
  const [isValid, setIsValid]       = useState(false);
  const [equity, setEquity]         = useState(null);
  const [iterations, setIterations] = useState(1000);

  // ——— Validation ———
  const validateInputs = (h,o,b) => {
    const rx = /^[2-9TJQKA][cdhs]$/i;
    const parse = str => str.trim().split(/\s+/).filter(Boolean);
    const hc = parse(h), oc = parse(o), bc = parse(b);
    let errs = { heroHand:'', oppHand:'', board:'', duplicates:'' }, ok = true;

    if (hc.length!==2 || !hc.every(c=>rx.test(c))) {
      errs.heroHand = 'Hero hand must be exactly 2 valid cards'; ok = false;
    }
    if (oc.length!==2 || !oc.every(c=>rx.test(c))) {
      errs.oppHand = 'Opponent hand must be exactly 2 valid cards'; ok = false;
    }
    if (![0,3,4,5].includes(bc.length) || !bc.every(c=>rx.test(c))) {
      errs.board = 'Board must have 0, 3, 4, or 5 valid cards'; ok = false;
    }
    const all = [...hc, ...oc, ...bc].map(c=>c.toUpperCase());
    if (new Set(all).size !== all.length) {
      errs.duplicates = 'Duplicate cards detected'; ok = false;
    }

    setErrors(errs);
    setIsValid(ok);
  };

  // ——— Equity calculation ———
  const handleCalculate = () => {
    const fmtCard = cs =>
      cs.trim().length===2
        ? cs[0].toUpperCase()+cs[1].toLowerCase()
        : cs.trim().toUpperCase();
    const fmtHand = str =>
      str.trim().split(/\s+/).map(fmtCard).join('');

    const h = fmtHand(heroHand),
          o = fmtHand(oppHand),
          b = fmtHand(board);

    try {
      setEquity(calculateEquity(h, o, b, iterations));
    } catch {
      setEquity('Error');
    }
  };

  useEffect(() => {
    if (isValid) handleCalculate();
  }, [heroHand, oppHand, board, isValid, iterations]);

  // ——— Deck builder for board draws ———
  const buildDeck = (exclude=[]) => {
    const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
    const suits = ['h','d','c','s'], deck = [];
    for (let r of ranks) for (let s of suits) deck.push(r+s);
    return deck.filter(c => !exclude.includes(c));
  };
  const dealRandomFlop = () => {
    const excl = [...heroHand.split(' '), ...oppHand.split(' '), ...board.split(' ')].filter(Boolean);
    const deck = buildDeck(excl).sort(()=>0.5-Math.random());
    const flop = deck.slice(0,3).join(' ');
    setBoard(flop);
    validateInputs(heroHand, oppHand, flop);
  };
  const dealRandomTurn = () => {
    const flop = board.split(' ').slice(0,3).filter(Boolean);
    if (flop.length<3) return;
    const excl = [...heroHand.split(' '), ...oppHand.split(' '), ...flop];
    const deck = buildDeck(excl).sort(()=>0.5-Math.random());
    const turn = deck[0], nb = [...flop,turn].join(' ');
    setBoard(nb);
    validateInputs(heroHand, oppHand, nb);
  };
  const dealRandomRiver = () => {
    const ct = board.split(' ').slice(0,4).filter(Boolean);
    if (ct.length<4) return;
    const excl = [...heroHand.split(' '), ...oppHand.split(' '), ...ct];
    const deck = buildDeck(excl).sort(()=>0.5-Math.random());
    const river = deck[0], nb = [...ct,river].join(' ');
    setBoard(nb);
    validateInputs(heroHand, oppHand, nb);
  };

  // ——— Random hero hand (no overlap) ———
  const genHeroHand = () => {
    const pool = Array.from(ranges[heroRangeKey]);
    const exclude = new Set([ ...oppHand.split(' '), ...board.split(' ') ].filter(Boolean));
    let combo, c1, c2;
    do {
      combo = pool[Math.floor(Math.random()*pool.length)];
      [c1, c2] = dealCombo(combo);
    } while (exclude.has(c1) || exclude.has(c2));
    const hand = `${c1} ${c2}`;
    setHeroHand(hand);
    validateInputs(hand, oppHand, board);
  };

  // ——— Random villain hand (no overlap) ———
  const genVillainHand = () => {
    const pool = Array.from(ranges[villainPosition]);
    const exclude = new Set([ ...heroHand.split(' '), ...board.split(' ') ].filter(Boolean));
    let combo, c1, c2;
    do {
      combo = pool[Math.floor(Math.random()*pool.length)];
      [c1, c2] = dealCombo(combo);
    } while (exclude.has(c1) || exclude.has(c2));
    const hand = `${c1} ${c2}`;
    setOppHand(hand);
    validateInputs(heroHand, hand, board);
  };

  return (
    <div className="p-8 max-w-screen-lg mx-auto font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Interactive Poker Equity Tool</h1>
      <p className="mb-6 text-gray-700 leading-relaxed">
        This tool lets you calculate the equity of one hand versus another in real-time.
        Enter hole cards for both players and optionally fill out the board; the tool will
        simulate many outcomes and return a percentage equity.
      </p>

      {/* Toggle Range Heatmaps */}
      <div className="mb-6">
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onClick={() => setShowHeatmaps(!showHeatmaps)}
        >
          {showHeatmaps ? 'Hide Ranges' : 'Show Ranges'}
        </button>
      </div>

      {/* Hero Range Preset */}
      <label className="block mb-2 font-medium">
        Hero Range Preset:
        <select
          className="ml-2 p-2 border rounded"
          value={heroRangeKey}
          onChange={e => setHeroRangeKey(e.target.value)}
        >
          {rangeNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>

      {/* Position selectors */}
      <div className="flex space-x-4 mb-6">
        <div>
          <label className="block font-semibold">Hero Position</label>
          <select
            className="mt-1 p-2 border rounded"
            value={heroPosition}
            onChange={e => setHeroPosition(e.target.value)}
          >
            {positionOptions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold">Villain Position</label>
          <select
            className="mt-1 p-2 border rounded"
            value={villainPosition}
            onChange={e => setVillainPosition(e.target.value)}
          >
            {positionOptions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Range heatmaps */}
      {showHeatmaps && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Hero Range</h2>
            <RangeHeatmap
              combos={full[heroRangeKey]}
              selected={ranges[heroRangeKey]}
              onToggle={combo => {
                const next = new Set(ranges[heroRangeKey]);
                next.has(combo) ? next.delete(combo) : next.add(combo);
                updateRange(heroRangeKey, next);
              }}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Villain Range</h2>
            <RangeHeatmap
              combos={full[villainPosition]}
              selected={ranges[villainPosition]}
              onToggle={() => {}}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          onClick={genHeroHand}
        >
          Generate Random Hero Hand
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={genVillainHand}
        >
          Generate Random Villain Hand
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          onClick={dealRandomFlop}
        >
          Generate Flop
        </button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={dealRandomTurn}
        >
          Deal Turn
        </button>
        <button
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          onClick={dealRandomRiver}
        >
          Deal River
        </button>
      </div>

      {/* Hand & board inputs */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block font-semibold">Hero's Hand</label>
          {heroHand && (
            <div className="mt-2">
              {heroHand.trim().split(/\s+/).map(card => (
                <CardImage key={card} card={card} />
              ))}
            </div>
          )}
          <input
            type="text"
            className="mt-1 w-full p-2 border rounded"
            placeholder="Ah Kh"
            value={heroHand}
            onChange={e => {
              setHeroHand(e.target.value);
              validateInputs(e.target.value, oppHand, board);
            }}
          />
          {errors.heroHand && <p className="text-red-600 mt-1">{errors.heroHand}</p>}
        </div>
        <div>
          <label className="block font-semibold">Opponent's Hand</label>
          {oppHand && (
            <div className="mt-2">
              {oppHand.trim().split(/\s+/).map(card => (
                <CardImage key={card} card={card} />
              ))}
            </div>
          )}
          <input
            type="text"
            className="mt-1 w-full p-2 border rounded"
            placeholder="Qs Jh"
            value={oppHand}
            onChange={e => {
              setOppHand(e.target.value);
              validateInputs(heroHand, e.target.value, board);
            }}
          />
          {errors.oppHand && <p className="text-red-600 mt-1">{errors.oppHand}</p>}
        </div>
        <div>
          {board && (
            <div className="mt-2">
              <span className="font-semibold">Board:</span>{' '}
              {board.trim().split(/\s+/).map(card => (
                <CardImage key={card} card={card} />
              ))}
            </div>
          )}
          <label className="block font-semibold">Board Cards</label>
          <input
            type="text"
            className="mt-1 w-full p-2 border rounded"
            placeholder="As Kd 2c"
            value={board}
            onChange={e => {
              setBoard(e.target.value);
              validateInputs(heroHand, oppHand, e.target.value);
            }}
          />
          {(errors.board || errors.duplicates) && (
            <p className="text-red-600 mt-1">{errors.board || errors.duplicates}</p>
          )}
        </div>
      </div>

      {/* Equity result */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block font-semibold">Iterations</label>
          <input
            type="number"
            className="mt-1 w-full p-2 border rounded"
            min={100}
            step={100}
            value={iterations}
            onChange={e => setIterations(Number(e.target.value))}
          />
        </div>
        <button
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          onClick={handleCalculate}
          disabled={!isValid}
        >
          Calculate Equity
        </button>
        {equity !== null && (
          <p className="mt-4 text-xl">
            Hero's Equity: <strong>{equity}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
