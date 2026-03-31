import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { RadiobiologyProvider } from './context/RadiobiologyContext';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('SW registered:', reg);
      })
      .catch(err => console.log('SW registration failed:', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RadiobiologyProvider>
      <App />
    </RadiobiologyProvider>
  </React.StrictMode>
);
