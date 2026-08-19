import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { musicApi } from '../api/musicApi';
import { Artist, Track } from '../api/types';
import { SongRow } from '../components/cards/SongRow';
import { SongRowSkeleton } from '../components/common/Skeleton';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatNumber } from '../utils/formatters';
import {
  Play,
  Shuffle,
  Music,
  Mic2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';

const GENRE_GRADIENT: Record<string, string> = {
  Bollywood: 'from-rose-700 via-orange-800 to-red-900',
  Bhojpuri: 'from-amber-600 via-orange-700 to-red-800',
  Punjabi: 'from-purple-700 via-indigo-800 to-blue-900',
  'Hip-Hop': 'from-cyan-700 via-blue-800 to-indigo-900',
  Romantic: 'from-rose-600 via-pink-700 to-red-800',
  Classical: 'from-amber-700 via-yellow-800 to-orange-900',
  'R&B': 'from-violet-600 via-fuchsia-700 to-purple-900',
  default: 'from-brand-800 via-indigo-900 to-slate-950',
};

function getGradient(genres?: string[]): string {
  if (!genres || genres.length === 0) return GENRE_GRADIENT.default;
  for (const g of genres) {
    if (GENRE_GRADIENT[g]) return GENRE_GRADIENT[g];
  }
  return GENRE_GRADIENT.default;
}

// Reliable avatar fallback using DiceBear (always works, no hotlink blocks)
function getAvatarUrl(name: string) {
  const seed = encodeURIComponent(name.replace(/\s+/g, '-').toLowerCase());
  return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=7c3aed,6d28d9,4c1d95&backgroundType=gradientLinear`;
}

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setIsLoading(true);
    setShowAll(false);
    setImgError(false);

    const fetchArtist = async () => {
      try {
        const data = await musicApi.getArtistDetails(decodeURIComponent(id));
        if (mounted && data) {
          setArtist(data);
        }
      } catch (err) {
        console.error('Failed to fetch artist', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchArtist();
    return () => { mounted = false; };
  }, [id]);

  const handlePlayAll = (shuffle = false) => {
    if (!artist || artist.topTracks.length === 0) return;
    const idx = shuffle ? Math.floor(Math.random() * artist.topTracks.length) : 0;
    playTrack(artist.topTracks[idx], artist.topTracks, idx);
  };

  const handleLoadMore = async () => {
    if (!artist) return;
    setLoadingMore(true);
    try {
      const more = await musicApi.getArtistSongs(artist.name);
      if (more.length > 0) {
        setArtist(prev => prev ? { ...prev, topTracks: more } : prev);
        setShowAll(true);
      }
    } catch (e) {
      console.warn('Load more failed', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const gradient = getGradient(artist?.genres);
  const displayTracks = showAll
    ? (artist?.topTracks ?? [])
    : (artist?.topTracks ?? []).slice(0, 10);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Hero skeleton */}
        <div className="rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse overflow-hidden">
          <div className="p-4 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-end">
            <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-2xl bg-slate-300 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-full w-24 mx-auto sm:mx-0" />
              <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-full w-48 mx-auto sm:mx-0" />
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-full w-36 mx-auto sm:mx-0" />
              <div className="flex gap-3 justify-center sm:justify-start pt-2">
                <div className="h-10 w-28 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <div className="h-10 w-10 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        {/* Song row skeletons */}
        <div className="space-y-2 bg-white dark:bg-dark-card rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
          {Array.from({ length: 6 }).map((_, i) => <SongRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-20 space-y-4">
        <Mic2 className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Artist Not Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          We couldn't find this artist. Try a different name.
        </p>
        <Link
          to="/search"
          className="inline-block mt-2 px-5 py-2 rounded-full bg-brand-600 text-white text-sm font-bold hover:bg-brand-500 transition-colors"
        >
          Go to Search
        </Link>
      </div>
    );
  }

  const avatarSrc = imgError || !artist.image
    ? getAvatarUrl(artist.name)
    : artist.image;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Hero Card ─────────────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-2xl`}>
        {/* Blur backdrop */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 scale-110 blur-3xl opacity-25"
            style={{
              backgroundImage: `url(${avatarSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-end">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl ring-2 sm:ring-4 ring-white/20 shrink-0 bg-slate-800">
              <img
                src={avatarSrc}
                alt={artist.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left pb-1">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Artist</p>

              <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-xl break-words">
                {artist.name}
              </h1>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-white/70">
                <span>
                  {artist.monthlyListeners
                    ? `${artist.monthlyListeners} listeners`
                    : artist.followerCount
                    ? `${formatNumber(artist.followerCount)} followers`
                    : ''}
                </span>
                {artist.genres && artist.genres.length > 0 && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>{artist.genres.slice(0, 2).join(', ')}</span>
                  </>
                )}
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" />
                  {artist.topTracks.length} songs
                </span>
              </div>

              {artist.bio && (
                <p className="text-xs sm:text-sm text-white/50 line-clamp-2 max-w-lg">
                  {artist.bio}
                </p>
              )}

              {/* Play controls */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                <button
                  onClick={() => handlePlayAll(false)}
                  disabled={artist.topTracks.length === 0}
                  className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-white text-slate-900 font-bold text-sm shadow-xl hover:bg-brand-50 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
                  <span>Play All</span>
                </button>
                <button
                  onClick={() => handlePlayAll(true)}
                  title="Shuffle play"
                  className="p-2.5 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors border border-white/20"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Songs Section ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-brand-500 shrink-0" />
            <span>Songs</span>
            {artist.topTracks.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-500 font-bold">
                {artist.topTracks.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate(`/search?q=${encodeURIComponent(artist.name)}`)}
            className="flex items-center gap-1 text-xs font-bold text-brand-500 dark:text-brand-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search more</span>
          </button>
        </div>

        {artist.topTracks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-800">
            <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No songs found for this artist.</p>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-3 px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Searching…' : 'Try Again'}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white/60 dark:bg-dark-card/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
              <div className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                {displayTracks.map((track, i) => (
                  <SongRow
                    key={`${track.id}-${i}`}
                    track={track}
                    index={i + 1}
                    queueContext={artist.topTracks}
                    onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
                  />
                ))}
              </div>
            </div>

            {/* Show more / Show all controls */}
            <div className="flex gap-2">
              {artist.topTracks.length > 10 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-all"
                >
                  {showAll
                    ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                    : <><ChevronDown className="w-4 h-4" /> Show All {artist.topTracks.length} Songs</>
                  }
                </button>
              )}
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 text-brand-600 dark:text-brand-400 text-sm font-medium transition-all disabled:opacity-50"
              >
                {loadingMore
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                  : <><Music className="w-4 h-4" /> Load More Songs</>
                }
              </button>
            </div>
          </>
        )}
      </section>

      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
