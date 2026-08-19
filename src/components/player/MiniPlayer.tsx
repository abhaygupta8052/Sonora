import React, { useState } from 'react';
import { Play, Pause, SkipForward, Heart, Moon } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { Visualizer } from './Visualizer';
import { SleepTimerModal, formatSecondsToTimer } from './SleepTimerModal';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    next,
    setIsFullPlayerOpen,
    isSleepTimerActive,
    sleepTimerRemaining
  } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useLibrary();

  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div
        onClick={() => setIsFullPlayerOpen(true)}
        className="md:hidden fixed bottom-[4.25rem] left-2.5 right-2.5 z-30 rounded-2xl bg-white/95 dark:bg-dark-card/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden cursor-pointer select-none transition-all duration-300 active:scale-[0.98]"
      >
        {/* Top progress indicator bar */}
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-pink-500 transition-all duration-200 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-2.5 gap-2.5">
          {/* Artwork + Title & Artist */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-900 shadow-md shrink-0 ring-1 ring-black/10 dark:ring-white/15">
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                  <Visualizer isPlaying={isPlaying} barCount={3} className="scale-75" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p title={currentTrack.title} className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                  {currentTrack.title}
                </p>
                {isSleepTimerActive && sleepTimerRemaining !== null && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[9px] font-mono font-bold text-purple-700 dark:text-purple-300 flex items-center gap-0.5">
                    <Moon className="w-2.5 h-2.5 fill-purple-500 text-purple-500 dark:fill-purple-400 dark:text-purple-400" />
                    {formatSecondsToTimer(sleepTimerRemaining)}
                  </span>
                )}
              </div>
              <p title={currentTrack.artist} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Quick Touch Controls */}
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Quick Sleep Timer Mobile Button */}
            <button
              onClick={() => setIsSleepModalOpen(true)}
              className={`p-2 transition-colors active:scale-90 ${
                isSleepTimerActive
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
              title="Sleep Timer + Fade Out"
              aria-label="Set Sleep Timer"
            >
              <Moon className={`w-4 h-4 ${isSleepTimerActive ? 'fill-purple-600 dark:fill-purple-400 animate-pulse' : ''}`} />
            </button>

            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors active:scale-90"
              aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 active:scale-90 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-white" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-90"
              aria-label="Next song"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
      />
    </>
  );
};
