import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Share,
  PlusSquare,
  Sparkles,
  Monitor,
  Smartphone,
  Check,
  Globe,
  RefreshCw,
  Chrome,
  ArrowUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    isIOS,
    isAndroid,
    isMobile,
    browserType,
    hasNativePrompt,
    promptInstall,
    isInstalled,
    installCount
  } = usePWAInstall();

  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else if (isAndroid || isMobile) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, [isIOS, isAndroid, isMobile]);

  const handleInstallClick = async () => {
    const installed = await promptInstall();
    if (installed) {
      setInstalledSuccess(true);
      setTimeout(() => onClose(), 1500);
    }
  };

  const handleRecheck = () => {
    setCheckCount(c => c + 1);
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install Sonora App">
      <div className="flex flex-col items-center text-center space-y-4 max-w-full">
        {/* App Logo & Header */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-black border border-slate-700/80 overflow-hidden flex items-center justify-center text-white shadow-xl shadow-brand-500/25 shrink-0">
            <img src="/logo.png" alt="Sonora Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Sonora Progressive Web App
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Enjoy full-screen music playback, lock-screen controls, background streaming, and offline access.
          </p>
        </div>

        {installedSuccess || isInstalled ? (
          <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
            <span className="text-sm">Sonora is installed on this device!</span>
            <span className="text-[11px] font-normal text-emerald-600/80 dark:text-emerald-400/80">
              You can now launch Sonora directly from your home screen or app drawer.
            </span>
          </div>
        ) : (
          <div className="w-full space-y-3 pt-1">
            {/* ── Native 1-Click Install Button (When available) ──────────────── */}
            {hasNativePrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-brand-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 shrink-0 animate-bounce" />
                <span>⚡ 1-Click Install App</span>
              </button>
            )}

            {/* Platform Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'desktop'
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
              </button>
            </div>

            {/* Tab 1: Android Instructions */}
            {activeTab === 'android' && (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-3 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-brand-500" />
                    <span>Android (Chrome, Samsung Internet, Edge)</span>
                  </div>
                  {hasNativePrompt && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                      Prompt Ready
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {/* Step 1 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 dark:text-brand-400 font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-snug">
                      Tap the browser menu icon (<strong>⋮</strong> or <strong>☰</strong>) in the top-right or bottom bar.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 dark:text-brand-400 font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-snug">
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 dark:text-brand-400 font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-snug">
                      Confirm by tapping <strong>"Install"</strong>. Sonora will appear on your home screen!
                    </p>
                  </div>
                </div>

                {/* Try Native Install / Retry Button */}
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Try Install Button</span>
                  </button>
                  <button
                    onClick={handleRecheck}
                    title="Re-check prompt"
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkCount > 0 ? 'text-brand-400 animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: iOS Safari Instructions */}
            {activeTab === 'ios' && (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-4 h-4 text-brand-500" />
                  <span>Safari (iPhone & iPad)</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {/* Step 1 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 dark:text-brand-400 font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="leading-snug flex items-center gap-1.5 flex-wrap">
                      <span>Tap the <strong>Share</strong> button</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-brand-500 text-[11px] font-bold">
                        <Share className="w-3 h-3" /> Share
                      </span>
                      <span>at the bottom of Safari.</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 dark:text-brand-400 font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="leading-snug flex items-center gap-1.5 flex-wrap">
                      <span>Scroll down and select</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-brand-500 text-[11px] font-bold">
                        <PlusSquare className="w-3 h-3" /> Add to Home Screen
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 dark:text-brand-400 font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-snug">
                      Tap <strong>"Add"</strong> in the top right corner. Sonora will launch as a standalone app!
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-amber-500/90 text-center pt-1">
                  💡 Note: iOS requires Safari for the "Add to Home Screen" feature.
                </p>
              </div>
            )}

            {/* Tab 3: Desktop Instructions */}
            {activeTab === 'desktop' && (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-3 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Monitor className="w-4 h-4 text-brand-500" />
                  <span>Desktop Chrome, Edge & Brave</span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <ArrowUp className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5 rotate-45" />
                    <span>
                      <strong>Method 1:</strong> Look for the <strong>install icon (⊕ or 💻)</strong> on the right side of your address bar and click <strong>"Install"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Chrome className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Method 2:</strong> Click browser menu (<strong>⋮</strong>) → <strong>"Save and share"</strong> → <strong>"Install page as app"</strong>.
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Try Install Prompt</span>
                  </button>
                </div>
              </div>
            )}

            {/* Features footer */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                <span>100% Free PWA</span>
              </span>
              <span>•</span>
              <span>No App Store needed</span>
              <span>•</span>
              <span>Works offline</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
