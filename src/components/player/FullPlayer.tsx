import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListPlus,
  Volume2
} from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { formatDuration } from '../../utils/formatters';
import { AddToPlaylistModal } from '../common/AddToPlaylistModal';

export const FullPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isShuffled,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    togglePlayPause,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    volume,
    setVolume,
    queue,
    queueIndex,
    playTrack
  } = useAudioPlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [activeTab, setActiveTab] = useState<'player' | 'queue'>('player');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  // Lock background scroll when full player is open to prevent unnecessary scrollbars
  useEffect(() => {
    if (isFullPlayerOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isFullPlayerOpen]);

  if (!isFullPlayerOpen || !currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#090D16] text-white overflow-hidden animate-slide-up select-none">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-25 scale-125 transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${currentTrack.artwork})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-3 sm:py-4 shrink-0">
        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2 -ml-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close full player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Tab Selector */}
        <div className="flex items-center p-1 rounded-full bg-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'player'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Now Playing
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>

        <button
          onClick={() => setIsPlaylistModalOpen(true)}
          className="p-2 -mr-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Add to playlist"
        >
          <ListPlus className="w-5 h-5" />
        </button>
      </header>

      {/* Content Body */}
      {activeTab === 'player' ? (
        <main className="relative z-10 flex-1 flex flex-col justify-between px-6 py-2 sm:py-4 max-w-md mx-auto w-full overflow-hidden">
          {/* Artwork — scales dynamically with screen height so no scrolling is ever needed */}
          <div className="flex-1 flex items-center justify-center my-auto min-h-0 py-2">
            <div className="relative aspect-square max-h-[38vh] sm:max-h-[45vh] w-auto rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/15 bg-slate-900">
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-100' : 'scale-95 opacity-90'
                }`}
              />
            </div>
          </div>

          {/* Bottom Controls Group */}
          <div className="space-y-3 sm:space-y-4 shrink-0 pb-3 sm:pb-5">
            {/* Track Info & Like Button */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-400 truncate mt-0.5">
                  {currentTrack.artist} {currentTrack.album && `• ${currentTrack.album}`}
                </p>
              </div>
              <button
                onClick={() => toggleFavorite(currentTrack)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
              >
                <Heart
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
                  }`}
                />
              </button>
            </div>

            {/* Scrubber Progress Bar */}
            <div>
              <div className="relative flex items-center group py-1.5">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                  aria-label="Seek progress"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-0.5 tabular-nums">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-full transition-colors ${
                  isShuffled
                    ? 'text-brand-400 bg-brand-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
              >
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={previous}
                className="p-2 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Previous track"
              >
                <SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-xl shadow-brand-600/50 active:scale-95 transition-all shrink-0"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
                ) : (
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={next}
                className="p-2 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Next track"
              >
                <SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-2 rounded-full transition-colors ${
                  repeatMode !== 'off'
                    ? 'text-brand-400 bg-brand-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label={`Repeat mode: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>

            {/* Volume Mini-Slider */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 backdrop-blur-sm">
              <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500"
                aria-label="Volume"
              />
            </div>
          </div>
        </main>
      ) : (
        /* Queue Tab — clean scroll without chunky scrollbar */
        <main className="relative z-10 flex-1 overflow-y-auto px-5 py-4 max-w-md mx-auto w-full space-y-2.5 scrollbar-none">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Playing Next ({queue.length - (queueIndex + 1)} tracks)
            </h3>
          </div>

          {queue.map((track, i) => {
            const isPlayingThis = i === queueIndex;
            return (
              <div
                key={`${track.id}-${i}`}
                onClick={() => playTrack(track, queue, i)}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer select-none transition-colors ${
                  isPlayingThis
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <img
                  src={track.artwork}
                  alt={track.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{track.title}</p>
                  <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                </div>
                {isPlayingThis && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500 text-white">
                    Playing
                  </span>
                )}
              </div>
            );
          })}
        </main>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={currentTrack}
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />
    </div>
  );
};
