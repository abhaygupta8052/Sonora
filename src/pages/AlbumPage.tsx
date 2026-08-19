import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { musicApi } from '../api/musicApi';
import { Album, Track } from '../api/types';
import { SongRow } from '../components/cards/SongRow';
import { SongRowSkeleton } from '../components/common/Skeleton';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { formatDuration } from '../utils/formatters';
import { Play, Shuffle, Disc3, Clock } from 'lucide-react';

export const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchAlbum = async () => {
      setIsLoading(true);
      try {
        const data = await musicApi.getAlbumDetails(id);
        if (mounted) {
          setAlbum(data);
        }
      } catch (err) {
        console.error('Failed to fetch album', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchAlbum();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-60 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SongRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Album Not Found
        </h3>
        <Link to="/" className="text-sm text-brand-500 hover:underline mt-2 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const totalDuration = album.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayAlbum = (shuffle: boolean = false) => {
    if (album.tracks.length === 0) return;
    const startIndex = shuffle ? Math.floor(Math.random() * album.tracks.length) : 0;
    playTrack(album.tracks[startIndex], album.tracks, startIndex);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Album Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-brand-950 text-white shadow-2xl border border-slate-800">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 shrink-0">
          <img
            src={album.artwork}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Disc3 className="w-3.5 h-3.5" />
            <span>Album</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight truncate">
            {album.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300">
            {album.artistId ? (
              <Link
                to={`/artist/${album.artistId}`}
                className="font-bold text-white hover:underline"
              >
                {album.artist}
              </Link>
            ) : (
              <span className="font-bold text-white">{album.artist}</span>
            )}
            {album.releaseYear && <span> • {album.releaseYear}</span>}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
            <span>{album.tracks.length} songs</span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(totalDuration)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          {album.tracks.length > 0 && (
            <div className="pt-3 flex items-center justify-center sm:justify-start gap-3">
              <button
                onClick={() => handlePlayAlbum(false)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>Play Album</span>
              </button>
              <button
                onClick={() => handlePlayAlbum(true)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                title="Shuffle Album"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60">
        {album.tracks.map((track, i) => (
          <SongRow
            key={`album-track-${track.id}-${i}`}
            track={track}
            index={i + 1}
            queueContext={album.tracks}
            showAlbum={false}
            onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
          />
        ))}
      </div>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
