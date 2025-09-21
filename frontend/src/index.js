// src/index.js
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import the CSS
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);