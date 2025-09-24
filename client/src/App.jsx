// src/App.jsx
import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import EquityCalculator from './pages/EquityCalculator';
import RangeTrainer from './pages/RangeTrainer';
import AICoaching from './pages/AICoaching';
import RangeSettings from './pages/RangeSettings';
import { RangeProvider } from './contexts/RangeContext';

export default function App() {
  return (
    <div
      className="min-h-screen bg-repeat"
      style={{ backgroundImage: "url('/casino.jpg')" }}
    >
      {/* App container */}
      <div className="min-h-screen font-sans text-gray-800 bg-white max-w-screen-lg w-full mx-auto shadow-lg">
        {/* === Navigation Bar (mobile-friendly) === */}
        <nav
          className="bg-white/95 backdrop-blur shadow-md sticky top-0 z-30"
          role="navigation"
        >
          <div className="max-w-screen-lg mx-auto px-3 sm:px-4">
            {/* horizontal scroll on small screens; no wrap */}
            <ul className="flex items-center gap-2 sm:gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
              {/* 
              <li>
                <NavLink
                  to="/equity"
                  end
                  className={({ isActive }) =>
                    (isActive
                      ? 'inline-block px-3 py-3 text-blue-600 border-b-2 border-blue-600'
                      : 'inline-block px-3 py-3 text-gray-600 hover:text-blue-600')
                  }
                >
                  Equity Calculator
                </NavLink>
              </li>
              */}
              <li>
                <NavLink
                  to="/ai-coaching"
                  className={({ isActive }) =>
                    (isActive
                      ? 'inline-block px-3 py-3 text-blue-600 border-b-2 border-blue-600'
                      : 'inline-block px-3 py-3 text-gray-600 hover:text-blue-600')
                  }
                >
                  AI Coaching
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/trainer"
                  className={({ isActive }) =>
                    (isActive
                      ? 'inline-block px-3 py-3 text-blue-600 border-b-2 border-blue-600'
                      : 'inline-block px-3 py-3 text-gray-600 hover:text-blue-600')
                  }
                >
                  Pre-Flop Range Trainer
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    (isActive
                      ? 'inline-block px-3 py-3 text-blue-600 border-b-2 border-blue-600'
                      : 'inline-block px-3 py-3 text-gray-600 hover:text-blue-600')
                  }
                >
                  Range Settings
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* === Page Content === */}
        <main className="px-3 sm:px-4 py-4 sm:py-6">
          {/* If you intended to wrap routes with RangeProvider, uncomment below and move Routes inside */}
          {/* <RangeProvider> */}
          <Routes>
            <Route index element={<AICoaching />} />
            {/* <Route path="/equity" element={<EquityCalculator />} /> */}
            <Route path="/trainer" element={<RangeTrainer />} />
            <Route path="/ai-coaching" element={<AICoaching />} />
            <Route path="/settings" element={<RangeSettings />} />
          </Routes>
          {/* </RangeProvider> */}
        </main>
      </div>
    </div>
  );
}
