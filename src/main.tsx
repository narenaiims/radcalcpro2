import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from '@/App';
import { RadiobiologyProvider } from '@/src/context/RadiobiologyContext';
import '@/src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RadiobiologyProvider>
      <App />
      <Analytics />
    </RadiobiologyProvider>
  </React.StrictMode>
);
