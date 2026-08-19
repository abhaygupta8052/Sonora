import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Share,
  PlusSquare,
  Radio,
  Sparkles,
  Laptop,
  Smartphone,
  Check,
  Globe
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

  const handleInstallClick = async () => {
    const installed = await promptInstall();
    if (installed) {
      setInstalledSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install Sonora Music">
      <div className="flex flex-col items-center text-center space-y-4 max-w-full">
        {/* App Logo */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 shrink-0">
          <Radio className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Install Sonora App
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Enjoy full-screen music playback, lockscreen controls, and fast offline access on your device.
          </p>
        </div>

        {installedSuccess ? (
          <div className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 text-xs font-bold">
            <Check className="w-4 h-4 shrink-0" />
            <span>Sonora installed successfully!</span>
          </div>
        ) : (
          <div className="w-full space-y-3 pt-1">
            {/* 1-Click Install Button */}
            <button
              onClick={handleInstallClick}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all ${
                hasNativePrompt
                  ? 'bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-400 hover:to-brand-500 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-600/30'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{hasNativePrompt ? '⚡ Install Now (1-Click)' : 'Prompt Install Dialog'}</span>
            </button>
            {!hasNativePrompt && (
              <p className="text-[11px] text-amber-500/90 text-center px-2">
                💡 If the button above does nothing, look for the <strong>install icon (⊕)</strong> in your browser's address bar instead.
              </p>
            )}

            {/* Platform Guides */}
            <div className="w-full text-left space-y-2.5 pt-2">
              {/* iPhone / iPad */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
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

              {/* Chrome / Edge / Desktop / Android */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Globe className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>Chrome / Edge / Android / Desktop:</span>
                </div>
                <div className="space-y-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                  <p>• Click the <strong>Install icon (⊕ / 💻)</strong> in your browser's address bar.</p>
                  <p>• Or open the browser menu (<strong>⋮</strong>) &gt; select <strong>"Install Sonora"</strong>.</p>
                </div>
              </div>
            </div>

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
