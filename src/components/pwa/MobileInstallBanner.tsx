import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { storage } from '../../utils/storage';
import { Download, X, Sparkles } from 'lucide-react';

interface MobileInstallBannerProps {
  onOpenModal: () => void;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstalled, isMobile, hasNativePrompt, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile, when not installed and not recently dismissed
    if (isMobile && !isInstalled && !storage.isPWABannerDismissed()) {
      // Show with a brief delay for a natural app experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isMobile, isInstalled]);

  if (!isVisible || isInstalled) return null;

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const installed = await promptInstall();
      if (installed) {
        setIsVisible(false);
        return;
      }
    }
    onOpenModal();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    storage.dismissPWABanner();
  };

  return (
    <div className="md:hidden fixed bottom-[4.25rem] left-3 right-3 z-35 animate-slide-up select-none">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-brand-950/90 to-slate-900/95 backdrop-blur-xl border border-brand-500/30 p-3 shadow-2xl shadow-black/60 flex items-center justify-between gap-3 ring-1 ring-white/10">
        {/* Ambient glow accent */}
        <div className="absolute -left-4 -top-4 w-16 h-16 bg-brand-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Left: App Logo & Text */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative w-10 h-10 rounded-xl bg-black border border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
            <img src="/logo.png" alt="Sonora" className="w-full h-full object-contain p-1" />
            <div className="absolute inset-0 bg-brand-500/10" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-extrabold text-white tracking-tight truncate">
                Install Sonora App
              </h4>
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-300 text-[9px] font-bold shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                <span>PWA</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate mt-0.5">
              Lock-screen playback & offline streaming
            </p>
          </div>
        </div>

        {/* Right: Install Action & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span>Install</span>
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
