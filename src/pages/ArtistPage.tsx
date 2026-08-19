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
  CheckCircle,
  Users,
  Music,
  Mic2,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

const GENRE_GRADIENT: Record<string, string> = {
  Bollywood:  'from-rose-700 to-orange-800',
  Bhojpuri:   'from-amber-600 to-orange-800',
  Punjabi:    'from-purple-700 to-indigo-900',
  'Hip-Hop':  'from-cyan-700 to-blue-900',
  Romantic:   'from-rose-600 to-pink-800',
  Classical:  'from-amber-700 to-yellow-900',
  'R&B':      'from-violet-600 to-fuchsia-900',
  default:    'from-brand-800 to-indigo-950',
};

function getGradient(genres?: string[]): string {
  if (!genres || genres.length === 0) return GENRE_GRADIENT.default;
  for (const g of genres) {
    if (GENRE_GRADIENT[g]) return GENRE_GRADIENT[g];
  }
  return GENRE_GRADIENT.default;
}

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setIsLoading(true);
    setShowAll(false);

    const fetchArtist = async () => {
      try {
        // Fetch artist details + all songs by this artist name from API
        const [details, songs] = await Promise.all([
          musicApi.getArtistDetails(decodeURIComponent(id)),
          musicApi.search(decodeURIComponent(id)).then(r => r.tracks).catch(() => [] as Track[]),
        ]);

        if (mounted && details) {
          // Merge: API-fetched songs are richer than static topTracks
          const mergedTracks = songs.length > 0 ? songs : details.topTracks;
          setArtist({ ...details, topTracks: mergedTracks });
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

  const gradient = getGradient(artist?.genres);
  const visibleTracks = showAll ? (artist?.topTracks ?? []) : (artist?.topTracks ?? []).slice(0, 10);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <SongRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-20 space-y-4">
        <Mic2 className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Artist Not Found</h3>
        <p className="text-sm text-slate-500">We couldn't find this artist. Try searching below.</p>
        <Link to="/search" className="inline-block mt-2 px-5 py-2 rounded-full bg-brand-600 text-white text-sm font-bold hover:bg-brand-500 transition-colors">
          Search Artists
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero Header ────────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} text-white border border-white/10 shadow-2xl`}>
        {/* Background artwork blur */}
        {artist.image && (
          <div
            className="absolute inset-0 opacity-20 scale-110 blur-2xl"
            style={{ backgroundImage: `url(${artist.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="relative z-10 p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Artist Avatar */}
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 shrink-0 bg-slate-800">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&size=400&background=7c3aed&color=fff&bold=true`;
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white/90 text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Artist</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight drop-shadow-lg">
                {artist.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {artist.monthlyListeners
                    ? `${artist.monthlyListeners} monthly listeners`
                    : artist.followerCount
                    ? `${formatNumber(artist.followerCount)} followers`
                    : 'Artist'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Music className="w-4 h-4" />
                  {artist.topTracks.length} songs loaded
                </span>
                {artist.genres && artist.genres.length > 0 && (
                  <div className="flex gap-1.5">
                    {artist.genres.slice(0, 3).map(g => (
                      <span key={g} className="px-2 py-0.5 rounded-full bg-white/15 text-white/80 text-xs font-medium">{g}</span>
                    ))}
                  </div>
                )}
              </div>

              {artist.bio && (
                <p className="text-sm text-white/60 line-clamp-2 max-w-lg">{artist.bio}</p>
              )}

              {/* Controls */}
              <div className="pt-3 flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={() => handlePlayAll(false)}
                  disabled={artist.topTracks.length === 0}
                  className="flex items-center gap-2 px-7 py-3 rounded-full bg-white text-slate-900 font-bold text-sm shadow-xl hover:bg-brand-50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
                  Play All
                </button>
                <button
                  onClick={() => handlePlayAll(true)}
                  title="Shuffle play"
                  className="p-3 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-colors border border-white/20"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Songs List ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-brand-500" />
            All Songs by {artist.name}
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-500 font-bold">
              {artist.topTracks.length}
            </span>
          </h3>
        </div>

        {artist.topTracks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No songs found for this artist.</div>
        ) : (
          <>
            <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60">
              {visibleTracks.map((track, i) => (
                <SongRow
                  key={`artist-track-${track.id}-${i}`}
                  track={track}
                  index={i + 1}
                  queueContext={artist.topTracks}
                  onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
                />
              ))}
            </div>

            {artist.topTracks.length > 10 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-all"
              >
                {showAll
                  ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                  : <><ChevronDown className="w-4 h-4" /> Show All {artist.topTracks.length} Songs</>
                }
              </button>
            )}
          </>
        )}
      </section>

      {/* ── Related Search Link ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => navigate(`/search?q=${encodeURIComponent(artist.name)}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-brand-500/40 text-brand-500 dark:text-brand-400 text-sm font-bold hover:bg-brand-500/10 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Search more songs by {artist.name}
        </button>
      </div>

      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
