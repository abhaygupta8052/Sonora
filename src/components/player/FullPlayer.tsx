import React, { useState } from 'react';
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
  ListMusic,
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

  if (!isFullPlayerOpen || !currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#090D16] text-white overflow-hidden animate-slide-up">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-25 scale-125 transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${currentTrack.artwork})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
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
        <main className="relative z-10 flex-1 flex flex-col justify-between px-6 py-4 max-w-md mx-auto w-full">
          {/* Artwork */}
          <div className="relative aspect-square w-full max-w-[320px] mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 my-auto">
            <img
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-100' : 'scale-95 opacity-90'
              }`}
            />
          </div>

          {/* Track Info & Like Button */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-medium text-slate-400 truncate mt-1">
                {currentTrack.artist} {currentTrack.album && `• ${currentTrack.album}`}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
            >
              <Heart
                className={`w-6 h-6 ${
                  isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
                }`}
              />
            </button>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="mt-6">
            <div className="relative flex items-center group py-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                aria-label="Seek progress"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium mt-1">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between mt-6 px-2">
            <button
              onClick={toggleShuffle}
              className={`p-2.5 rounded-full transition-colors ${
                isShuffled
                  ? 'text-brand-400 bg-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={previous}
              className="p-3 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Previous track"
            >
              <SkipBack className="w-7 h-7" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-xl shadow-brand-600/50 active:scale-95 transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-white" />
              ) : (
                <Play className="w-8 h-8 fill-white ml-1" />
              )}
            </button>

            <button
              onClick={next}
              className="p-3 rounded-full text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Next track"
            >
              <SkipForward className="w-7 h-7" />
            </button>

            <button
              onClick={cycleRepeatMode}
              className={`p-2.5 rounded-full transition-colors ${
                repeatMode !== 'off'
                  ? 'text-brand-400 bg-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label={`Repeat mode: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Volume Mini-Slider */}
          <div className="flex items-center gap-3 mt-6 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-sm">
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
        </main>
      ) : (
        /* Queue Tab */
        <main className="relative z-10 flex-1 overflow-y-auto px-6 py-4 max-w-md mx-auto w-full space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-300">
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
