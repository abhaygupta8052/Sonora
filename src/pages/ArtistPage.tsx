import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { musicApi } from '../api/musicApi';
import { Artist, Track } from '../api/types';
import { SongRow } from '../components/cards/SongRow';
import { AlbumCard } from '../components/cards/AlbumCard';
import { SongRowSkeleton } from '../components/common/Skeleton';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatNumber } from '../utils/formatters';
import { Play, Shuffle, CheckCircle, Users } from 'lucide-react';

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchArtist = async () => {
      setIsLoading(true);
      try {
        const data = await musicApi.getArtistDetails(id);
        if (mounted) {
          setArtist(data);
        }
      } catch (err) {
        console.error('Failed to fetch artist', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchArtist();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SongRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Artist Not Found
        </h3>
        <Link to="/" className="text-sm text-brand-500 hover:underline mt-2 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const handlePlayAll = (shuffle: boolean = false) => {
    if (artist.topTracks.length === 0) return;
    const startIndex = shuffle ? Math.floor(Math.random() * artist.topTracks.length) : 0;
    playTrack(artist.topTracks[startIndex], artist.topTracks, startIndex);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Artist Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-brand-600/20 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10 shrink-0">
            <img
              src={artist.image}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified Artist</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {artist.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-400" />
                {artist.followerCount ? `${formatNumber(artist.followerCount)} followers` : `${artist.monthlyListeners || '1.2M'} monthly listeners`}
              </span>
              {artist.genres && artist.genres.length > 0 && (
                <span>• {artist.genres.slice(0, 3).join(', ')}</span>
              )}
            </div>

            {artist.bio && (
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
                {artist.bio}
              </p>
            )}

            {/* Play Controls */}
            {artist.topTracks.length > 0 && (
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={() => handlePlayAll(false)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  <span>Play</span>
                </button>
                <button
                  onClick={() => handlePlayAll(true)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  title="Shuffle artist tracks"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Tracks */}
      {artist.topTracks.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Popular Songs
          </h3>
          <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60">
            {artist.topTracks.map((track, i) => (
              <SongRow
                key={`artist-track-${track.id}-${i}`}
                track={track}
                index={i + 1}
                queueContext={artist.topTracks}
                onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discography / Albums */}
      {artist.albums && artist.albums.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Albums & Discography
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artist.albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
