import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/* Global styles */
import './index.css';
import './App.css';   // ensure theme + UI styles are included

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
