import React from 'react';
import { Play, Pause, SkipForward, Heart } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useLibrary } from '../../context/LibraryContext';

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
      className="md:hidden fixed bottom-16 left-2 right-2 z-30 rounded-2xl bg-white/90 dark:bg-[#161F33]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl overflow-hidden cursor-pointer select-none transition-all active:scale-[0.99]"
    >
      {/* Top progress indicator */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-brand-500 transition-all duration-150 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-2.5 gap-3">
        {/* Artwork + Title/Artist */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-900 shadow shrink-0">
            <img
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleFavorite(currentTrack)}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Next song"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
