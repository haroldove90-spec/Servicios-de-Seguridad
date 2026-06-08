import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety wrapper for cross-origin or sandboxed iframe environments
if (typeof window !== 'undefined') {
  const originalConfirm = window.confirm;
  window.confirm = function (message?: string) {
    try {
      // In some environments, calling confirm directly might throw or block
      return originalConfirm.call(window, message);
    } catch (e) {
      console.warn("window.confirm was blocked by sandbox, defaulting to true", e);
      return true;
    }
  };

  const originalAlert = window.alert;
  window.alert = function (message?: any) {
    try {
      originalAlert.call(window, message);
    } catch (e) {
      console.warn("window.alert was blocked by sandbox:", message, e);
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
