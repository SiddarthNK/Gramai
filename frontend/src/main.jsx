import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Sora, sans-serif',
            fontSize: '13px',
            borderRadius: '10px',
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
          },
          success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#E53E3E', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
