import React, { useState, useRef } from 'react';
import { useTheme, APP_THEMES, AppThemeId } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { storage } from '../utils/storage';
import { ThemeMode, AudioQuality } from '../api/types';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Keyboard,
  ShieldCheck,
  Check,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { InstallPromptModal } from '../components/pwa/InstallPromptModal';

export const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    appTheme,
    setAppTheme,
    syncAccent,
    setSyncAccent
  } = useTheme();

  const { clearRecentlyPlayed, clearFavorites, refreshLibrary } = useLibrary();
  const { isInstalled, hasNativePrompt, promptInstall } = usePWAInstall();

  const [quality, setQualityState] = useState<AudioQuality>(() => storage.getAudioQuality());
  const [autoplay, setAutoplayState] = useState<boolean>(() => storage.getAutoplay());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Destructive Confirmation Modal state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const installed = await promptInstall();
      if (!installed) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const handleQualityChange = (q: AudioQuality) => {
    setQualityState(q);
    storage.setAudioQuality(q);
  };

  const handleAutoplayToggle = () => {
    const nextVal = !autoplay;
    setAutoplayState(nextVal);
    storage.setAutoplay(nextVal);
  };

  const handleExportData = () => {
    const dataStr = storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sonora-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('Data exported successfully!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importAllData(content);
      if (success) {
        refreshLibrary();
        showNotice('Data restored successfully!');
      } else {
        alert('Failed to parse backup file. Please ensure it is a valid JSON export.');
      }
    };
    reader.readAsText(file);
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Settings & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your Sonora streaming experience, visual theme, PWA installation, and offline storage.
        </p>
      </div>

      {copiedNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* PWA Installation Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-950/60 via-indigo-950/40 to-slate-900/60 border border-brand-500/30 p-4 sm:p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-black border border-slate-700/60 overflow-hidden flex items-center justify-center text-white shadow-md shrink-0">
              <img src="/logo.png" alt="Sonora Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Progressive Web App (PWA)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isInstalled
                  ? '✅ Sonora is currently running as an installed standalone app.'
                  : 'Install Sonora on your phone, tablet, or PC for fast launch & offline music.'}
              </p>
            </div>
          </div>

          {!isInstalled ? (
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-600/30 active:scale-95 transition-all shrink-0"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Install Sonora App</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0 self-start sm:self-auto">
              <Check className="w-4 h-4" />
              <span>Installed</span>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. PLAYER APPEARANCE & APP THEME (From User Screenshot)                   */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Player appearance & App theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose the visual style for the player and entire app UI.
            </p>
          </div>
        </div>

        {/* Sync Accent Toggle Box */}
        <div
          onClick={() => setSyncAccent(!syncAccent)}
          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer select-none hover:border-brand-500/50 transition-colors"
        >
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Sync accent colour with theme
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automatically update accent colors to complement the chosen player theme.
            </p>
          </div>
          <input
            type="checkbox"
            checked={syncAccent}
            onChange={(e) => setSyncAccent(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600 shrink-0 cursor-pointer"
          />
        </div>

        {/* 3-Column Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {APP_THEMES.map((t) => {
            const isSelected = appTheme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setAppTheme(t.id)}
                className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/15 ring-1 ring-brand-500'
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top 3-stripe Color Palette Preview Bar */}
                <div className="relative w-full h-8 rounded-lg overflow-hidden flex shadow-inner mb-3">
                  <div className="flex-1 h-full" style={{ backgroundColor: t.swatches[0] }} />
                  <div className="flex-1 h-full flex items-center justify-center" style={{ backgroundColor: t.swatches[1] }}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <div className="flex-1 h-full" style={{ backgroundColor: t.swatches[2] }} />
                </div>

                {/* Theme Title & Icon */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{t.icon}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {t.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Base Light/Dark Mode Section */}
      <section className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Base Color Mode
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Switch between dark mode, light mode, or follow your system default.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
            { id: 'light' as ThemeMode, label: 'Light', icon: Sun },
            { id: 'system' as ThemeMode, label: 'System', icon: Laptop },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Audio & Playback Section */}
      <section className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Playback & Audio Quality
        </h3>

        {/* Quality Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Streaming Audio Bitrate
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High bitrate provides crystal-clear 320kbps fidelity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['96kbps', '160kbps', '320kbps'] as AudioQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  quality === q
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Autoplay Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Autoplay Similar Music
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keep the music going seamlessly when the current queue reaches the end.
            </p>
          </div>
          <button
            onClick={handleAutoplayToggle}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
              autoplay ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle Autoplay"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoplay ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Keyboard Shortcuts Reference */}
      <section className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Desktop Keyboard Shortcuts
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            { key: 'Space', desc: 'Play / Pause audio' },
            { key: 'Arrow Left / Right', desc: 'Seek back / forward 5s' },
            { key: 'M', desc: 'Mute / Unmute volume' },
            { key: 'L', desc: 'Like / Save current song' },
            { key: 'J / K', desc: 'Previous / Next track' },
          ].map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
            >
              <span className="text-slate-600 dark:text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      {/* Data & Backup Management */}
      <section className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          Data & Local Storage
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All your favorites, custom playlists, and preferences are stored 100% locally on this device in your browser's LocalStorage. No account or database is required.
        </p>

        {/* Backup & Restore */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {/* Clear Data Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Clear Local Data
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setConfirmAction({
                  title: 'Clear Search History',
                  description: 'Are you sure you want to clear your recent search query history?',
                  onConfirm: () => {
                    storage.clearSearchHistory();
                    showNotice('Search history cleared.');
                  }
                })
              }
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors"
            >
              Clear Search History
            </button>

            <button
              onClick={() =>
                setConfirmAction({
                  title: 'Clear Recently Played',
                  description: 'Are you sure you want to clear all recently played tracks history?',
                  onConfirm: () => {
                    clearRecentlyPlayed();
                    showNotice('Listening history cleared.');
                  }
                })
              }
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors"
            >
              Clear Recently Played
            </button>

            <button
              onClick={() =>
                setConfirmAction({
                  title: 'Clear Favorites',
                  description: 'Are you sure you want to remove all saved liked songs? This action cannot be undone unless you have a backup.',
                  onConfirm: () => {
                    clearFavorites();
                    showNotice('Favorites cleared.');
                  }
                })
              }
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-xs font-medium text-slate-600 dark:text-slate-400 transition-colors"
            >
              Clear Favorites
            </button>

            <button
              onClick={() =>
                setConfirmAction({
                  title: 'Reset All Sonora Data',
                  description: 'WARNING: This will permanently wipe all local playlists, favorites, history, and settings from this browser.',
                  onConfirm: () => {
                    storage.clearAllData();
                    window.location.reload();
                  }
                })
              }
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-colors"
            >
              Reset All App Data
            </button>
          </div>
        </div>
      </section>

      {/* App Info Footer */}
      <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-500/5 to-indigo-500/5 border border-brand-500/10 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-500 shrink-0" />
          <span>Sonora v1.0.0 • Free Progressive Web App</span>
        </div>
        <span className="font-semibold text-brand-500">PWA Ready</span>
      </section>

      {/* PWA Install Modal */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Destructive Action Modal */}
      {confirmAction && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          title={confirmAction.title}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                {confirmAction.description}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
