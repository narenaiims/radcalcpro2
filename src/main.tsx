import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { RadiobiologyProvider } from './context/RadiobiologyContext';
import './index.css';

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
