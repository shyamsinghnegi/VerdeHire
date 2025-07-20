import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // Corrected to .jsx for consistency, assuming it's a JSX file
import './index.css'; // Your global styles

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
