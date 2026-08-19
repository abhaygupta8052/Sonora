import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Track } from '../api/types';
import { musicApi } from '../api/musicApi';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { formatDuration } from '../utils/formatters';
import {
  Heart,
  Share2,
  Plus,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Music2,
  Volume2,
  VolumeX,
  Disc3,
  Sparkles,
  Maximize2,
  ExternalLink,
  Flame,
  Radio
} from 'lucide-react';

interface ReelCategory {
  id: string;
  name: string;
  query: string;
  icon: string;
}

const REEL_CATEGORIES: ReelCategory[] = [
  { id: 'trending', name: '🔥 Trending Hits', query: 'Hindi Hits Top 2024', icon: '🔥' },
  { id: 'bollywood', name: '🎬 Bollywood', query: 'Bollywood Chartbusters', icon: '🎬' },
  { id: 'bhojpuri', name: '⚡ Bhojpuri Super', query: 'Bhojpuri Superhits Pawan Singh', icon: '⚡' },
  { id: 'punjabi', name: '🏎️ Punjabi Swag', query: 'Punjabi Hits AP Dhillon Sidhu', icon: '🏎️' },
  { id: 'haryanvi', name: '🚜 Haryanvi', query: 'Haryanvi Hits 2024', icon: '🚜' },
  { id: 'rap', name: '🎤 Desi Hip-Hop', query: 'Desi Hip Hop Divine King', icon: '🎤' },
  { id: 'romantic', name: '❤️ Romantic', query: 'Hindi Romantic Arijit Singh', icon: '❤️' },
];

export const ReelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useLibrary();

  const [activeCategory, setActiveCategory] = useState<string>('trending');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load tracks when category changes
  useEffect(() => {
    let mounted = true;
    const cat = REEL_CATEGORIES.find(c => c.id === activeCategory) || REEL_CATEGORIES[0];

    const loadCategoryTracks = async () => {
      setIsLoading(true);
      try {
        const fetched = await musicApi.getTrending(cat.query);
        if (mounted) {
          setTracks(fetched);
          setCurrentIndex(0);
          if (fetched.length > 0) {
            // Auto play the first track in reels mode
            playTrack(fetched[0], fetched, 0);
          }
        }
      } catch (err) {
        console.error('Failed to load reels tracks', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadCategoryTracks();
    return () => { mounted = false; };
  }, [activeCategory, playTrack]);

  // Handle scroll snap detection via IntersectionObserver
  useEffect(() => {
    if (tracks.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index) && index !== currentIndex && tracks[index]) {
              setCurrentIndex(index);
              playTrack(tracks[index], tracks, index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [tracks, currentIndex, playTrack]);

  // Keyboard navigation (ArrowUp, ArrowDown, Space, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      } else if (e.key === 'm') {
        e.preventDefault();
        setIsMuted(m => !m);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, tracks]);

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= tracks.length) return;
    const targetEl = itemRefs.current[index];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleShare = async (track: Track) => {
    const shareData = {
      title: `${track.title} on Sonora`,
      text: `Listen to "${track.title}" by ${track.artist} on Sonora Music!`,
      url: window.location.origin + `/search?q=${encodeURIComponent(track.title)}`
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismissed share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setShareToast('Link copied to clipboard!');
        setTimeout(() => setShareToast(null), 2500);
      } catch {
        setShareToast('Share URL copied!');
        setTimeout(() => setShareToast(null), 2500);
      }
    }
  };

  return (
    <div className="relative -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 h-[calc(100vh-7rem)] md:h-[calc(100vh-6rem)] flex flex-col items-center justify-center overflow-hidden select-none bg-black">
      {/* Toast Notification */}
      {shareToast && (
        <div className="absolute top-20 z-50 px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-bold shadow-2xl shadow-brand-500/50 animate-bounce">
          {shareToast}
        </div>
      )}

      {/* Floating Top Category Bar */}
      <div className="absolute top-3 left-0 right-0 z-30 flex items-center justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto scrollbar-none max-w-full">
          {REEL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-brand-600 to-pink-500 text-white shadow-lg scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Up / Down Controls Floating on Right */}
      <div className="hidden lg:flex flex-col gap-2 absolute right-6 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={() => scrollToIndex(currentIndex - 1)}
          disabled={currentIndex <= 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-30 disabled:cursor-not-allowed text-white backdrop-blur-md transition-all active:scale-95 shadow-xl border border-white/10"
          title="Previous Reel (Up Arrow)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollToIndex(currentIndex + 1)}
          disabled={currentIndex >= tracks.length - 1}
          className="p-3 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-30 disabled:cursor-not-allowed text-white backdrop-blur-md transition-all active:scale-95 shadow-xl border border-white/10"
          title="Next Reel (Down Arrow)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Reel Feed Scroll Container */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-4 text-white">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center animate-pulse">
            <Radio className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-white/70 animate-pulse">Loading Music Reels...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center text-white space-y-3">
          <p className="text-base font-bold">No reels found in this category.</p>
          <button
            onClick={() => setActiveCategory('trending')}
            className="px-5 py-2 rounded-full bg-brand-600 text-white text-xs font-bold"
          >
            Go to Trending
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full h-full max-w-md sm:max-w-lg md:max-w-xl snap-y snap-mandatory overflow-y-scroll scrollbar-none"
        >
          {tracks.map((track, index) => {
            const isCurrent = currentIndex === index;
            const isFav = isFavorite(track.id);

            return (
              <div
                key={`${track.id}-${index}`}
                ref={(el) => (itemRefs.current[index] = el)}
                data-index={index}
                className="w-full h-full snap-start snap-always relative flex flex-col justify-between p-5 sm:p-7 overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border border-white/10 bg-slate-950 my-0 sm:my-2 shadow-2xl"
              >
                {/* Background Dynamic Blurred Artwork */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div
                    className={`absolute inset-0 scale-125 blur-3xl opacity-40 transition-transform duration-1000 ${
                      isCurrent && isPlaying ? 'scale-150 animate-pulse-slow' : 'scale-110'
                    }`}
                    style={{
                      backgroundImage: `url(${track.artwork})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
                </div>

                {/* Top Item Bar */}
                <div className="relative z-10 pt-12 sm:pt-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" style={{ animationDuration: '8s' }} />
                    <span>Sonora Vibe Reel #{index + 1}</span>
                  </div>

                  <button
                    onClick={() => setIsMuted(m => !m)}
                    className="p-2 rounded-full bg-black/40 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Center Spinning Disc & Artwork Card */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center">
                  <div
                    onClick={() => {
                      if (isCurrent) {
                        togglePlayPause();
                      } else {
                        scrollToIndex(index);
                      }
                    }}
                    className="group relative cursor-pointer"
                  >
                    {/* Glowing Aura */}
                    <div
                      className={`absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-600 via-pink-600 to-indigo-600 opacity-40 blur-2xl transition-all duration-700 ${
                        isCurrent && isPlaying ? 'opacity-70 scale-105' : 'opacity-20'
                      }`}
                    />

                    {/* Main Artwork Card */}
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-slate-900">
                      <img
                        src={track.artwork}
                        alt={track.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${
                          isCurrent && isPlaying ? 'scale-105' : 'scale-100'
                        }`}
                      />

                      {/* Center Play/Pause Overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-4 rounded-full bg-white/90 text-slate-950 shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
                          {isCurrent && isPlaying ? (
                            <Pause className="w-8 h-8 fill-slate-950" />
                          ) : (
                            <Play className="w-8 h-8 fill-slate-950 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spinning Vinyl Badge */}
                    <div
                      className={`absolute -bottom-4 -right-4 w-14 h-14 rounded-full bg-slate-950 ring-2 ring-white/30 shadow-2xl flex items-center justify-center ${
                        isCurrent && isPlaying ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '4s' }}
                    >
                      <Disc3 className="w-8 h-8 text-brand-400" />
                    </div>
                  </div>
                </div>

                {/* Bottom Content & Right Action Buttons */}
                <div className="relative z-10 flex items-end justify-between gap-4 pb-4">
                  {/* Left: Track & Artist Details */}
                  <div className="flex-1 min-w-0 space-y-2 text-white">
                    {/* Artist Pill */}
                    <div
                      onClick={() => navigate(`/artist/${encodeURIComponent(track.artist)}`)}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 cursor-pointer hover:bg-white/25 transition-all text-xs font-bold"
                    >
                      <div className="w-4 h-4 rounded-full bg-brand-500 overflow-hidden shrink-0">
                        <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate">{track.artist}</span>
                      <ExternalLink className="w-3 h-3 text-white/60 shrink-0" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight line-clamp-2 drop-shadow-md">
                      {track.title}
                    </h2>

                    {/* Album / Meta */}
                    <p className="text-xs text-white/70 truncate flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{track.album || 'Single'}</span>
                      {track.releaseYear && <span>• {track.releaseYear}</span>}
                      {track.duration > 0 && <span>• {formatDuration(track.duration)}</span>}
                    </p>
                  </div>

                  {/* Right Reel Action Column */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    {/* Like / Favorite */}
                    <button
                      onClick={() => toggleFavorite(track)}
                      className="flex flex-col items-center gap-1 text-white group"
                    >
                      <div
                        className={`p-3 rounded-full backdrop-blur-xl border border-white/20 transition-all active:scale-75 ${
                          isFav
                            ? 'bg-rose-500/30 text-rose-500 border-rose-500/50 scale-110 shadow-lg shadow-rose-500/30'
                            : 'bg-black/40 text-white hover:bg-white/20'
                        }`}
                      >
                        <Heart className={`w-6 h-6 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </div>
                      <span className="text-[10px] font-bold">{isFav ? 'Liked' : 'Like'}</span>
                    </button>

                    {/* Add to Playlist */}
                    <button
                      onClick={() => setSelectedTrackForPlaylist(track)}
                      className="flex flex-col items-center gap-1 text-white group"
                      title="Add to Playlist"
                    >
                      <div className="p-3 rounded-full bg-black/40 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white transition-all active:scale-95">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold">Save</span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => handleShare(track)}
                      className="flex flex-col items-center gap-1 text-white group"
                      title="Share Reel"
                    >
                      <div className="p-3 rounded-full bg-black/40 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white transition-all active:scale-95">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold">Share</span>
                    </button>

                    {/* Full Player Shortcut */}
                    <button
                      onClick={() => {
                        playTrack(track, tracks, index);
                      }}
                      className="flex flex-col items-center gap-1 text-white group"
                      title="Play Full Song"
                    >
                      <div className="p-3 rounded-full bg-brand-600 hover:bg-brand-500 backdrop-blur-xl text-white shadow-lg shadow-brand-500/30 transition-all active:scale-95">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                      <span className="text-[10px] font-bold">Play</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar line along bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  {isCurrent && (
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${isPlaying ? '100%' : '0%'}` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
