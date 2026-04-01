import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { RadiobiologyProvider } from './context/RadiobiologyContext';
import './index.css';

// Unregister existing service workers to resolve MIME type issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
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
