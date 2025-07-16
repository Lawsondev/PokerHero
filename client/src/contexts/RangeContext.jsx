// src/contexts/RangeContext.jsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { positionOptions, rangesByPosition } from '../data/ranges';
import { expandAllRanges } from '../utils/rangeParser';

const RangeContext = createContext();

export function RangeProvider({ children }) {
  // 1) Expand all built-in defaults
  const full = useMemo(() => {
  const expanded = expandAllRanges(rangesByPosition);
  console.log('FULL RANGES LOADED:', expanded); // ← add this
  return expanded;
}, []);

  // 2) Initialize merged ranges from localStorage and defaults
  const [ranges, setRanges] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('customRanges') || '{}');
    const merged = {};

    // Merge default ranges with saved ranges
    Object.keys(full).forEach(pos => {
      const defaultCombos = Array.isArray(full[pos]) ? full[pos] : [];
      const savedCombos = Array.isArray(saved[pos]) ? saved[pos] : [];
      merged[pos] = new Set([...defaultCombos, ...savedCombos]);
    });

    // Include any fully custom named ranges
    Object.keys(saved).forEach(name => {
      if (!merged[name]) {
        merged[name] = new Set(saved[name]);
      }
    });
	console.log('FINAL MERGED RANGES:', merged);
    return merged;
  });

  // 3) Save to localStorage when ranges change
  useEffect(() => {
    const toSave = Object.fromEntries(
      Object.entries(ranges).map(([name, comboSet]) => [name, Array.from(comboSet)])
    );
    localStorage.setItem('customRanges', JSON.stringify(toSave));
  }, [ranges]);

  // 4) Helpers
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
