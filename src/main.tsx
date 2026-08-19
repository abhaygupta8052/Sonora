import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LibraryProvider } from './context/LibraryContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// ── CRITICAL: Capture beforeinstallprompt BEFORE React renders ──────────────
// The browser fires this event very early — often before useEffect runs.
// We store the deferred prompt in a module-level variable and expose it on
// `window.__pwa_deferred_prompt` so our hook can always retrieve it.
(function capturePWAPromptEarly() {
  const handler = (e: Event) => {
    e.preventDefault();
    (window as any).__pwa_deferred_prompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  };
  window.addEventListener('beforeinstallprompt', handler);
  window.addEventListener('appinstalled', () => {
    (window as any).__pwa_deferred_prompt = null;
    (window as any).__pwa_is_installed = true;
  });
})();

// Automatically register service worker for PWA support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New Sonora update available.');
  },
  onOfflineReady() {
    console.log('Sonora is ready to work offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LibraryProvider>
          <AudioPlayerProvider>
            <App />
          </AudioPlayerProvider>
        </LibraryProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
