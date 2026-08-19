import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LibraryProvider } from './context/LibraryContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

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
