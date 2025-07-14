// src/App.jsx
import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import EquityCalculator from './pages/EquityCalculator';
import RangeTrainer from './pages/RangeTrainer';
import RangeSettings from './pages/RangeSettings';
import { RangeProvider } from './contexts/RangeContext';
export default function App() {
  return (
    <div className="min-h-screen font-sans text-gray-800">
      {/* === Navigation Bar === */}
      <nav className="bg-white shadow-md">
        <div className="max-w-screen-lg mx-auto px-4">
          <ul className="flex space-x-4">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? 'inline-block py-4 text-blue-600 border-b-2 border-blue-600'
                    : 'inline-block py-4 text-gray-600 hover:text-blue-600'
                }
              >
                Equity Calculator
              </NavLink>
            </li>
            <li>
              <NavLink to="/trainer" /*…*/
			  className={({ isActive }) =>
                  isActive
                    ? 'inline-block py-4 text-blue-600 border-b-2 border-blue-600'
                    : 'inline-block py-4 text-gray-600 hover:text-blue-600'
                }>
                Range Trainer
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  isActive
                    ? 'inline-block py-4 text-blue-600 border-b-2 border-blue-600'
                    : 'inline-block py-4 text-gray-600 hover:text-blue-600'
                }
              >
                Range Settings
              </NavLink>
            </li>
			
          </ul>
        </div>
      </nav>

      {/* === Page Content === */}
      <main className="max-w-screen-lg mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<EquityCalculator />} />
          <Route path="/trainer" element={<RangeTrainer />} />
		  <Route path="/settings" element={<RangeSettings />} />
        </Routes>
      </main>
    </div>
  );
}