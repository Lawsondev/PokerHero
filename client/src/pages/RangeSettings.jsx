// src/pages/RangeSettings.jsx
import React, { useState, useMemo, useEffect } from 'react';
import RangeHeatmap from '../components/RangeHeatmap';
import { positionOptions } from '../data/ranges';
import { useRanges } from '../contexts/RangeContext';
import { expandAllRanges } from '../utils/rangeParser';
import { rangesByPosition } from '../data/ranges';
export default function RangeSettings() {
  const { full, ranges, createRange, updateRange, deleteRange } = useRanges();

const allCombos = useMemo(() => {
    const u = new Set(Object.values(full).flat());
    return Array.from(u);
  }, [full]);

  // Build a list of all named ranges, with defaults first
  const rangeNames = useMemo(() => {
    const allNames = Object.keys(ranges);
    // defaults in order:
    const defaults = positionOptions.filter((p) => allNames.includes(p));
    // custom ones afterwards:
    const customs = allNames.filter((n) => !positionOptions.includes(n));
    return [...defaults, ...customs];
  }, [ranges]);

  // Which range is currently being edited
  const [selectedName, setSelectedName] = useState(rangeNames[0] || '');

  // If selectedName ever goes missing (e.g. after delete), pick the first
  useEffect(() => {
    if (!rangeNames.includes(selectedName) && rangeNames.length > 0) {
      setSelectedName(rangeNames[0]);
    }
  }, [rangeNames, selectedName]);

  const currentSet = ranges[selectedName] || new Set();
  const count = currentSet.size;

  // Toggle one combo in/out
  const handleToggleCombo = (combo) => {
    const next = new Set(currentSet);
    next.has(combo) ? next.delete(combo) : next.add(combo);
    updateRange(selectedName, next);
  };

  // Confirm save (actual persistence via context)
  const handleSave = () => {
    alert(`Saved ${count} combos for "${selectedName}"`);
  };

  // Reset back to the default for this range
  const handleReset = () => {
    const defaults = full[selectedName] || [];
    updateRange(selectedName, new Set(defaults));
  };

  // Create a new custom range
  const handleCreate = () => {
    const name = prompt('Enter a name for your new custom range:');
    if (!name) return;
    if (ranges[name]) {
      alert('That name is already in use.');
      return;
    }
    // Seed from UTG by default (you can choose another)
    const seed = full['UTG'] || [];
    createRange(name, new Set(seed));
    setSelectedName(name);
  };

  // Delete a custom range (not defaults)
  const handleDelete = () => {
    if (full[selectedName]) {
      alert('Cannot delete a default range.');
      return;
    }
    if (window.confirm(`Delete custom range "${selectedName}"?`)) {
      deleteRange(selectedName);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Range Settings</h1>

      {/* Range selector + actions */}
      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium">
          Range:
          <select
            className="ml-2 p-2 border rounded"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          >
            {rangeNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleCreate}
        >
          + New Range
        </button>

        {/* only show Delete for custom ranges */}
        {!full[selectedName] && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handleDelete}
          >
            Delete
          </button>
        )}

        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handleSave}
        >
          Save Range
        </button>

        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          onClick={handleReset}
        >
          Reset to Default
        </button>
      </div>

      {/* Summary */}
      <p className="mb-4">
        {count} combos selected for <strong>{selectedName}</strong>
      </p>

      {/* Editable heatmap */}
      <RangeHeatmap
        combos={full[selectedName] || allCombos}
        selected={currentSet}
        onToggle={handleToggleCombo}
      />
    </div>
  );
}
