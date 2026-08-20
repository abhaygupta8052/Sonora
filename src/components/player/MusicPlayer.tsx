import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { formatDuration } from '../../utils/formatters';
import { VolumeSlider } from './VolumeSlider';
import { MiniPlayer } from './MiniPlayer';
import { FullPlayer } from './FullPlayer';
import { QueueDrawer } from './QueueDrawer';
import { Visualizer } from './Visualizer';
import { useMediaSession } from '../../hooks/useMediaSession';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSwipe } from '../../hooks/useSwipe';
import { Link } from 'react-router-dom';

export const MusicPlayer: React.FC = () => {
  // Activate media session and keyboard shortcuts
  useMediaSession();
  useKeyboardShortcuts();

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isShuffled,
    playbackError,
    togglePlayPause,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    setIsFullPlayerOpen
  } = useAudioPlayer();

  const { isFavorite, toggleFavorite } = useLibrary();

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);

  // Swipe support for touch-capable laptops / tablets on the desktop bar
  const { handlers: desktopSwipe } = useSwipe({
    onSwipeLeft: next,
    onSwipeRight: previous,
    threshold: 60,
  });

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  return (
    <>
      {/* Mobile Mini Player & Full Player (visible on screen < 768px) */}
      <MiniPlayer />
      <FullPlayer />
      <QueueDrawer />

      {/* Desktop Persistent Bottom Bar (visible on md: and above) */}
      <aside className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl border-t border-slate-200 dark:border-dark-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-colors duration-300">
        {playbackError && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-rose-500">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{playbackError}</span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Track Info & Artwork */}
          <div className="flex items-center gap-3 w-1/3 min-w-[220px] max-w-[360px]">
            <div
              onClick={() => setIsFullPlayerOpen(true)}
              className="relative w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl overflow-hidden bg-slate-900 shadow-md group cursor-pointer shrink-0"
              title="Open full player view"
            >
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover shrink-0"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h4
                  title={currentTrack.title}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-brand-500 transition-colors"
                  onClick={() => setIsFullPlayerOpen(true)}
                >
                  {currentTrack.title}
                </h4>
                <Visualizer isPlaying={isPlaying} barCount={3} className="shrink-0" />
              </div>

              <p title={currentTrack.artist} className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {currentTrack.artistId ? (
                  <Link
                    to={`/artist/${encodeURIComponent(currentTrack.artistId)}`}
                    className="hover:underline hover:text-brand-500"
                  >
                    {currentTrack.artist}
                  </Link>
                ) : (
                  currentTrack.artist
                )}
              </p>
            </div>

            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
              aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex flex-col items-center max-w-lg w-full flex-1 px-2 touch-pan-y" {...desktopSwipe}>
            {/* Playback Controls */}
            <div className="flex items-center gap-4 mb-1.5">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg transition-colors ${
                  isShuffled
                    ? 'text-brand-500 bg-brand-500/10'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={previous}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-brand-500 active:scale-95 transition-all"
                title="Previous (J)"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 active:scale-95 transition-all shrink-0"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={next}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-brand-500 active:scale-95 transition-all"
                title="Next (K)"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-1.5 rounded-lg transition-colors ${
                  repeatMode !== 'off'
                    ? 'text-brand-500 bg-brand-500/10'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Progress / Scrubber Bar */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-400 w-9 text-right tabular-nums">
                {formatDuration(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center group py-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-brand-500 group-hover:h-1.5 transition-all"
                  aria-label="Track progress"
                />
              </div>

              <span className="text-[11px] font-medium text-slate-400 w-9 tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Right: Actions & Volume */}
          <div className="flex items-center justify-end gap-3 w-1/4 min-w-[180px] max-w-[300px]">
            <button
              onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
              className={`p-2 rounded-xl transition-colors ${
                isQueueDrawerOpen
                  ? 'bg-brand-500/20 text-brand-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Playback queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <VolumeSlider />
          </div>
        </div>
      </aside>
    </>
  );
};
