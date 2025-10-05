import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AsteroidProvider } from './contexts/asteroidcontext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AsteroidProvider>
    <App />
  </AsteroidProvider>
);