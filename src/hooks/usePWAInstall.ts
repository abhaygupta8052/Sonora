import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Helper to grab whatever was captured early in main.tsx
function getEarlyPrompt(): BeforeInstallPromptEvent | null {
  return (window as any).__pwa_deferred_prompt ?? null;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => getEarlyPrompt() // Seed from early capture
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    return !!(window as any).__pwa_is_installed ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [installCount, setInstallCount] = useState<number>(() => storage.getPWAInstallCount());

  useEffect(() => {
    // Device detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Sync installed state from standalone display mode
    const standaloneMq = window.matchMedia('(display-mode: standalone)');
    const handleStandalone = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    standaloneMq.addEventListener('change', handleStandalone);

    // Listen for late-firing beforeinstallprompt (e.g. after navigation)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwa_deferred_prompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Also listen for the custom event dispatched by main.tsx early capture
    const handlePromptReady = () => {
      const p = getEarlyPrompt();
      if (p) setDeferredPrompt(p);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).__pwa_deferred_prompt = null;
      const newCount = storage.incrementPWAInstallCount();
      setInstallCount(newCount);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    // On mount, try to read any early-captured prompt
    const early = getEarlyPrompt();
    if (early && !deferredPrompt) {
      setDeferredPrompt(early);
    }

    return () => {
      standaloneMq.removeEventListener('change', handleStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    // Always try to pull the freshest deferred prompt from window
    const prompt = deferredPrompt ?? getEarlyPrompt();

    if (prompt) {
      try {
        await prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as any).__pwa_deferred_prompt = null;
          return true;
        }
      } catch (err) {
        console.error('Error prompting PWA install:', err);
      }
    } else {
      // Fallback: open browser install guide as external hint
      console.info('No deferred prompt available. User must install via browser address bar.');
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: !isInstalled,
    isInstalled,
    isIOS,
    isAndroid,
    hasNativePrompt: !!(deferredPrompt ?? getEarlyPrompt()),
    promptInstall,
    installCount
  };
}
