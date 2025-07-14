// src/components/RangeHeatmap.jsx

import React from 'react';
import PropTypes from 'prop-types';

// Descending rank order for grid rows and columns
const DESC_RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];

/**
 * Interactive RangeHeatmap component: visualizes a 13×13 grid and allows
 * toggling **any** combo in/out of the range by clicking cells.
 *
 * Props:
 *   combos: string[]            - [NOT USED for gating anymore]
 *   selected: Set<string>       - the currently “on” combos
 *   onToggle: (combo: string)   - callback when a cell is clicked
 */
export default function RangeHeatmap({
  // we keep combos prop so you can pass it, but we no longer gate clicks on it
  combos = [],
  selected = new Set(),
  onToggle,
}) {
  return (
    <table style={{ borderCollapse: 'collapse', margin: '1em 0' }}>
      <thead>
        <tr>
          <th></th>
          {DESC_RANKS.map(r => (
            <th
              key={r}
              style={{
                width: 32,
                height: 32,
                textAlign: 'center',
                fontSize: '0.75rem',
              }}
            >
              {r}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {DESC_RANKS.map((rowRank, i) => (
          <tr key={rowRank}>
            <th
              style={{
                width: 32,
                height: 32,
                textAlign: 'right',
                paddingRight: 4,
                fontSize: '0.75rem',
              }}
            >
              {rowRank}
            </th>
            {DESC_RANKS.map((colRank, j) => {
              let label;
              if (i === j) label = `${rowRank}${colRank}`;    // pocket pair
              else if (j < i) label = `${rowRank}${colRank}o`; // offsuit
              else label = `${rowRank}${colRank}s`;            // suited

              const included = selected.has(label);
              const backgroundColor = included ? '#3b82f6' : '#e5e7eb';
              const color = included ? '#fff' : '#000';

              return (
                <td
                  key={colRank}
                  title={label}
                  onClick={() => onToggle(label)}
                  style={{
                    width: 32,
                    height: 32,
                    border: '1px solid #333',
                    backgroundColor,
                    color,
                    textAlign: 'center',
                    fontSize: '0.6rem',
                    lineHeight: '32px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {label}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

RangeHeatmap.propTypes = {
  combos:    PropTypes.arrayOf(PropTypes.string),
  selected:  PropTypes.instanceOf(Set).isRequired,
  onToggle:  PropTypes.func.isRequired,
};
