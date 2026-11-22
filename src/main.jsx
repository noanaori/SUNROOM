import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import './styles/global.css';
import './styles/components.css';

/* Tempel aplikasi utama ke elemen root DOM pakai getElementById */
const rootElement = document.getElementById('root');

createRoot(rootElement).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
