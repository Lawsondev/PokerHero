import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { positionOptions, rangesByPosition } from '../data/ranges';
import { expandAllRanges } from '../utils/rangeParser';

const RangeContext = createContext();

export function RangeProvider({ children }) {
  const full = useMemo(() => {
    const expanded = expandAllRanges(rangesByPosition);
    return expanded;
  }, []);

const [ranges, setRanges] = useState(() => {
  const saved = JSON.parse(localStorage.getItem('customRanges') || '{}');
  const merged = {};

  positionOptions.forEach(pos => {
    const defaultShorthand = Array.isArray(rangesByPosition[pos]) ? rangesByPosition[pos] : [];
    const expandedMap = expandAllRanges({ [pos]: defaultShorthand });
    const defaultExpanded = Array.isArray(expandedMap[pos]) ? expandedMap[pos] : [];

    const savedCombos = Array.isArray(saved[pos]) ? saved[pos] : [];

    merged[pos] = new Set([...defaultExpanded, ...savedCombos]);
  });

  // Include any fully custom saved ranges
  Object.keys(saved).forEach(name => {
    if (!merged[name]) {
      merged[name] = new Set(Array.isArray(saved[name]) ? saved[name] : []);
    }
  });

  return merged;
});

  useEffect(() => {
    const toSave = Object.fromEntries(
      Object.entries(ranges).map(([name, comboSet]) => [name, Array.from(comboSet)])
    );
    localStorage.setItem('customRanges', JSON.stringify(toSave));
  }, [ranges]);

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
      <>
        {children}

        {/* TEMPORARY DEBUG UI FOR DEPLOYED VERSION */}
        <div style={{ padding: '1em', backgroundColor: '#fefce8', color: '#92400e', fontSize: '0.75rem' }}>
          <strong>DEBUG:</strong><br />
          UTG Range Size: {Array.from(ranges.UTG || []).length} combos<br />
          CO Range Size: {Array.from(ranges.CO || []).length} combos<br />
          BTN Range Size: {Array.from(ranges.BTN || []).length} combos<br />
        </div>
      </>
    </RangeContext.Provider>
  );
}

export function useRanges() {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error('useRanges must be used within a RangeProvider');
  return ctx;
}
