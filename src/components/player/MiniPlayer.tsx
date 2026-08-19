import React from 'react';
import { Play, Pause, SkipForward, Heart } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { Visualizer } from './Visualizer';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    next,
    setIsFullPlayerOpen
  } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useLibrary();

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={() => setIsFullPlayerOpen(true)}
      className="md:hidden fixed bottom-[4.25rem] left-2.5 right-2.5 z-30 rounded-2xl bg-white/95 dark:bg-dark-card/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] overflow-hidden cursor-pointer select-none transition-all duration-300 active:scale-[0.98]"
    >
      {/* Top progress indicator bar */}
      <div className="w-full h-1 bg-slate-200/60 dark:bg-slate-800/80 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-pink-500 transition-all duration-200 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-2.5 gap-3">
        {/* Artwork + Title & Artist */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shadow-md shrink-0 ring-1 ring-white/10">
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
            <p title={currentTrack.title} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {currentTrack.title}
            </p>
            <p title={currentTrack.artist} className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Quick Touch Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleFavorite(currentTrack)}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors active:scale-90"
            aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 active:scale-90 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors active:scale-90"
            aria-label="Next song"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
