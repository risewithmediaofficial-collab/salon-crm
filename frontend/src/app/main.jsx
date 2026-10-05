import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../styles/index.css';

// Globally lock mouse wheel on number input fields to prevent accidental value change while scrolling
if (typeof window !== 'undefined') {
  document.addEventListener(
    'wheel',
    () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    },
    { passive: true }
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
