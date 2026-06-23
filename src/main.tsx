import './lib/storage-polyfill';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  console.error(
    "Initialization Error: Target container '#root' was not found in the DOM. " +
    "Please check your index.html file."
  );
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
