// src/index.js
import './index.css'; // ← make sure this file lives at src/index.css and contains:
// @tailwind base;
// @tailwind components;
// @tailwind utilities;

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { RangeProvider } from './contexts/RangeContext.jsx';

const container = document.getElementById('root');
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <RangeProvider>
        <App />
      </RangeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
