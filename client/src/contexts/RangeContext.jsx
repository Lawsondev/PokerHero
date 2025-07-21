// src/contexts/RangeContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from 'react';
import { positionOptions, rangesByPosition } from '../data/ranges';
import { expandAllRanges } from '../utils/rangeParser';

const RangeContext = createContext();

export function RangeProvider({ children }) {
  const full = useMemo(() => {
    const expanded = expandAllRanges(rangesByPosition);
    console.log('Full defaults loaded:', expanded);
    return expanded;
  }, []);

  const [ranges, setRanges] = useState(null); // ← start as null

  // Populate ranges after `full` is available
  useEffect(() => {
    if (!full || Object.keys(full).length === 0) return;

    const saved = JSON.parse(localStorage.getItem('customRanges') || '{}');
    const merged = {};

    // Merge defaults and saved
    Object.keys(full).forEach((pos) => {
      const defaults = Array.isArray(full[pos]) ? full[pos] : [];
      const savedCombos = Array.isArray(saved[pos]) ? saved[pos] : [];
      merged[pos] = new Set([...defaults, ...savedCombos]);
    });

    // Custom named ranges
    Object.keys(saved).forEach((name) => {
      if (!merged[name]) {
        merged[name] = new Set(saved[name]);
      }
    });

    console.log('Merged initial ranges:', merged);
    setRanges(merged);
  }, [full]);

  // Save to localStorage when ranges change
  useEffect(() => {
    if (!ranges) return;
    const toSave = Object.fromEntries(
      Object.entries(ranges).map(([name, set]) => [name, Array.from(set)])
    );
    localStorage.setItem('customRanges', JSON.stringify(toSave));
  }, [ranges]);

  // Updaters
  const updateRange = (name, comboSet) => {
    setRanges((prev) => ({
      ...prev,
      [name]: new Set(comboSet),
    }));
  };

  const createRange = (name, comboSet) => {
    setRanges((prev) => ({
      ...prev,
      [name]: new Set(comboSet),
    }));
  };

  const deleteRange = (name) => {
    setRanges((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // Prevent children from rendering until everything is ready
  if (!ranges) return null;

  return (
    <RangeContext.Provider
      value={{
        positionOptions,
        full,
        ranges,
        updateRange,
        createRange,
        deleteRange,
      }}
    >
      {children}
    </RangeContext.Provider>
  );
}

export function useRanges() {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error('useRanges must be used within a RangeProvider');
  return ctx;
}
