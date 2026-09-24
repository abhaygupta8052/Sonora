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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [browserType, setBrowserType] = useState<
    'safari' | 'chrome' | 'samsung' | 'firefox' | 'edge' | 'other'
  >('other');
  const [installCount, setInstallCount] = useState<number>(() => storage.getPWAInstallCount());

  useEffect(() => {
    // Device & Browser detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileDevice =
      isIosDevice ||
      isAndroidDevice ||
      /mobile|touch|tablet/.test(userAgent);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);

    if (/samsungbrowser/.test(userAgent)) {
      setBrowserType('samsung');
    } else if (/edg|edga|edgios/.test(userAgent)) {
      setBrowserType('edge');
    } else if (/firefox|fxios/.test(userAgent)) {
      setBrowserType('firefox');
    } else if (/crios|chrome/.test(userAgent) && !/chromium/.test(userAgent)) {
      setBrowserType('chrome');
    } else if (isIosDevice && /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent)) {
      setBrowserType('safari');
    } else {
      setBrowserType('other');
    }

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
  }, [deferredPrompt]);

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
          const newCount = storage.incrementPWAInstallCount();
          setInstallCount(newCount);
          return true;
        }
      } catch (err) {
        console.error('Error prompting PWA install:', err);
      }
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: !isInstalled,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    browserType,
    hasNativePrompt: !!(deferredPrompt ?? getEarlyPrompt()),
    promptInstall,
    installCount
  };
}
