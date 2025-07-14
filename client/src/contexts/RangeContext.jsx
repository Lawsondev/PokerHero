// src/contexts/RangeContext.jsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { positionOptions, rangesByPosition } from '../data/ranges';
import { expandAllRanges } from '../utils/rangeParser';

const RangeContext = createContext();

export function RangeProvider({ children }) {
  // 1) Expand all the built-in shorthand defaults
  const full = useMemo(() => expandAllRanges(rangesByPosition), []);

  // 2) Initialize from localStorage + defaults
  const [ranges, setRanges] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('customRanges') || '{}');
    const init = {};

    // a) load each default position
    positionOptions.forEach(pos => {
      const def = Array.isArray(full[pos]) ? full[pos] : [];
      const cust = Array.isArray(saved[pos]) ? saved[pos] : def;
      init[pos] = new Set(cust);
    });

    // b) load any extra saved keys (custom ranges)
    Object.keys(saved).forEach(name => {
      if (!positionOptions.includes(name)) {
        const arr = Array.isArray(saved[name]) ? saved[name] : [];
        init[name] = new Set(arr);
      }
    });

    return init;
  });

  // 3) Persist whenever `ranges` changes
  useEffect(() => {
    const toSave = Object.fromEntries(
      Object.entries(ranges).map(([name, comboSet]) => [
        name,
        Array.from(comboSet),
      ])
    );
    localStorage.setItem('customRanges', JSON.stringify(toSave));
  }, [ranges]);

  // 4) Updaters
  const updateRange = (name, comboSet) => {
    setRanges(prev => ({
      ...prev,
      [name]: new Set(comboSet),
    }));
  };
  const createRange = (name, comboSet) => {
    setRanges(prev => ({
      ...prev,
      [name]: new Set(comboSet),
    }));
  };
  const deleteRange = (name) => {
    setRanges(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  return (
    <RangeContext.Provider value={{ positionOptions, full, ranges, updateRange, createRange, deleteRange }}>
      {children}
    </RangeContext.Provider>
  );
}

export function useRanges() {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error('useRanges must be used within a RangeProvider');
  return ctx;
}
