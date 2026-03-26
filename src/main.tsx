import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { RadiobiologyProvider } from './context/RadiobiologyContext';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('SW registered:', reg);
        
        // Check for updates on registration
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available; please refresh.
                  console.log('New content is available; please refresh.');
                  window.dispatchEvent(new CustomEvent('sw-update-available'));
                } else {
                  // Content is cached for offline use.
                  console.log('Content is cached for offline use.');
                }
              }
            };
          }
        };
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
