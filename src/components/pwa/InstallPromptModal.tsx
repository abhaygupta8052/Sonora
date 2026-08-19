import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Share,
  PlusSquare,
  Radio,
  Sparkles,
  Monitor,
  Smartphone,
  Check,
  Globe,
  RefreshCw,
  Chrome,
  ArrowUp
} from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isIOS, isAndroid, hasNativePrompt, promptInstall, isInstalled } = usePWAInstall();
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const mobile = /android|iphone|ipad|ipod|mobile/.test(ua);
    setIsDesktop(!mobile);
  }, []);

  const handleInstallClick = async () => {
    const installed = await promptInstall();
    if (installed) {
      setInstalledSuccess(true);
      setTimeout(() => onClose(), 1200);
    }
  };

  // Re-check if prompt is now available
  const handleRecheck = () => {
    setCheckCount(c => c + 1);
    // Trigger a re-render of the parent hook by dispatching the check event
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install Sonora Music">
      <div className="flex flex-col items-center text-center space-y-4 max-w-full">
        {/* App Logo */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-black border border-slate-700/60 overflow-hidden flex items-center justify-center text-white shadow-xl shadow-brand-500/25 shrink-0">
          <img src="/logo.png" alt="Sonora Logo" className="w-full h-full object-contain p-1.5" />
        </div>

        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Install Sonora App
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Full-screen playback, lock-screen controls, and offline access — right on your device.
          </p>
        </div>

        {installedSuccess ? (
          <div className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 text-xs font-bold">
            <Check className="w-4 h-4 shrink-0" />
            <span>Sonora installed successfully!</span>
          </div>
        ) : (
          <div className="w-full space-y-3 pt-1">

            {/* ── Native prompt available ─────────────────────── */}
            {hasNativePrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-400 hover:to-brand-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>⚡ Install Now (1-Click)</span>
              </button>
            )}

            {/* ── Desktop: no native prompt yet ──────────────── */}
            {isDesktop && !hasNativePrompt && (
              <div className="w-full space-y-3">
                {/* Address bar install guide */}
                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-400">
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span>Desktop Chrome / Edge — 2 ways to install:</span>
                  </div>
                  {/* Method 1: Address bar icon */}
                  <div className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    <ArrowUp className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5 rotate-45" />
                    <span>
                      <strong>Method 1:</strong> Look for the{' '}
                      <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-brand-400">⊕</code>{' '}
                      or{' '}
                      <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-brand-400">💻</code>{' '}
                      <strong>install icon</strong> at the right end of the address bar → click it → select <strong>"Install"</strong>.
                    </span>
                  </div>
                  {/* Method 2: Browser menu */}
                  <div className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    <Chrome className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Method 2:</strong> Open browser menu (<strong>⋮</strong>) → click{' '}
                      <strong>"Save and share"</strong> → <strong>"Install page as app"</strong>.
                    </span>
                  </div>
                </div>

                {/* Try button + re-check */}
                <div className="flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Try Install Button</span>
                  </button>
                  <button
                    onClick={handleRecheck}
                    title="Re-check if install prompt is ready"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${checkCount > 0 ? 'text-brand-400' : ''}`} />
                    <span className="hidden sm:inline">Re-check</span>
                  </button>
                </div>

                <p className="text-[10px] text-amber-500/80 text-center px-1">
                  💡 Chrome requires a few seconds of page engagement before showing the install prompt. If the address bar icon isn't visible yet, wait a moment and try again.
                </p>
              </div>
            )}

            {/* ── iOS Safari guide ────────────────────────────── */}
            {(isIOS || (!isDesktop && !isAndroid)) && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>iOS Safari (iPhone / iPad):</span>
                </div>
                <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Share className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span>1. Tap the <strong>Share</strong> button in Safari.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlusSquare className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span>2. Tap <strong>"Add to Home Screen"</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Android Chrome guide (when no native prompt yet) ── */}
            {isAndroid && !hasNativePrompt && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Globe className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>Android Chrome:</span>
                </div>
                <div className="space-y-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                  <p>• Tap menu (<strong>⋮</strong>) → <strong>"Add to Home screen"</strong>.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 pt-1">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Free PWA • Works across all platforms</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
