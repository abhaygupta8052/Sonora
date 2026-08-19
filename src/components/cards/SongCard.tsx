import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '../../api/types';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { DropdownMenu } from '../common/DropdownMenu';
import { Link } from 'react-router-dom';

interface SongCardProps {
  track: Track;
  queueContext?: Track[];
  onOpenPlaylistModal?: (track: Track) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  track,
  queueContext,
  onOpenPlaylistModal
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useLibrary();

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const isFav = isFavorite(track.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, queueContext);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative flex flex-col p-2.5 sm:p-3 rounded-2xl transition-all duration-300 cursor-pointer select-none shrink-0 snap-start w-36 sm:w-auto ${
        isCurrent
          ? 'bg-brand-500/15 border border-brand-500/40 shadow-lg shadow-brand-500/15'
          : 'bg-white/80 dark:bg-dark-card/70 hover:bg-white dark:hover:bg-dark-card border border-slate-200/80 dark:border-dark-border/60 hover:border-brand-500/40 hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
        <img
          src={track.artwork}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite Quick Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
            isFav
              ? 'bg-rose-500/20 text-rose-500 opacity-100'
              : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:text-white hover:scale-110'
          }`}
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Play / Pause Floating Button */}
        <div
          className={`absolute bottom-3 right-3 transition-all duration-300 ${
            isCurrent
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          <button
            onClick={handlePlayClick}
            className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/40 active:scale-95 transition-transform"
            aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Active Equalizer Overlay when playing */}
        {isCurrentPlaying && (
          <div className="absolute bottom-3 left-3 flex items-end gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md">
            <span className="w-1 h-3 bg-brand-400 rounded-full animate-equalizer" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-brand-400 rounded-full animate-equalizer" style={{ animationDelay: '200ms' }} />
            <span className="w-1 h-2 bg-brand-400 rounded-full animate-equalizer" style={{ animationDelay: '400ms' }} />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-start justify-between gap-1.5 min-w-0 mt-1">
        <div className="min-w-0 flex-1">
          <h4
            title={track.title}
            className={`font-bold text-xs sm:text-sm line-clamp-2 leading-tight min-h-[2.4rem] transition-colors ${
              isCurrent
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'
            }`}
          >
            {track.title}
          </h4>
          <p
            title={track.artist}
            className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 truncate"
          >
            {track.artistId ? (
              <Link
                to={`/artist/${track.artistId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-slate-700 dark:hover:text-slate-300"
              >
                {track.artist}
              </Link>
            ) : (
              track.artist
            )}
          </p>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
          <DropdownMenu track={track} onOpenPlaylistModal={onOpenPlaylistModal} />
        </div>
      </div>
    </div>
  );
};
