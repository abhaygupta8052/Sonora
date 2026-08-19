import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '../../api/types';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useLibrary } from '../../context/LibraryContext';
import { formatDuration } from '../../utils/formatters';
import { DropdownMenu } from '../common/DropdownMenu';
import { Link } from 'react-router-dom';

interface SongRowProps {
  track: Track;
  index?: number;
  queueContext?: Track[];
  onOpenPlaylistModal?: (track: Track) => void;
  showAlbum?: boolean;
}

export const SongRow: React.FC<SongRowProps> = ({
  track,
  index,
  queueContext,
  onOpenPlaylistModal,
  showAlbum = true
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useLibrary();

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentPlaying = isCurrent && isPlaying;
  const isFav = isFavorite(track.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, queueContext, index !== undefined ? index - 1 : undefined);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group flex items-center justify-between gap-3 p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer select-none ${
        isCurrent
          ? 'bg-brand-500/10 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
          : 'hover:bg-slate-100 dark:hover:bg-dark-cardHover text-slate-700 dark:text-slate-200'
      }`}
    >
      {/* Left section: Index + Thumbnail + Title/Artist */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Index or Play icon */}
        {index !== undefined && (
          <div className="w-6 text-center text-xs font-semibold text-slate-400 shrink-0 flex items-center justify-center">
            {isCurrentPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-0.5 h-2 bg-brand-500 rounded-full animate-equalizer" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-3.5 bg-brand-500 rounded-full animate-equalizer" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2 bg-brand-500 rounded-full animate-equalizer" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <span className="group-hover:hidden">{index}</span>
            )}
            <Play className={`w-3.5 h-3.5 text-brand-500 fill-brand-500 hidden ${!isCurrentPlaying ? 'group-hover:block' : ''}`} />
          </div>
        )}

        {/* Artwork */}
        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-900 shadow-sm">
          <img
            src={track.artwork}
            alt={track.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isCurrentPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1 pr-2">
          <p
            title={track.title}
            className={`text-sm font-semibold truncate ${
              isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors'
            }`}
          >
            {track.title}
          </p>
          <p title={track.artist} className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {track.artistId ? (
              <Link
                to={`/artist/${track.artistId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
              >
                {track.artist}
              </Link>
            ) : (
              track.artist
            )}
          </p>
        </div>
      </div>

      {/* Center section: Album (Hidden on small mobile) */}
      {showAlbum && track.album && (
        <div className="hidden md:block w-1/4 truncate text-xs text-slate-400">
          {track.albumId ? (
            <Link
              to={`/album/${track.albumId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-slate-300"
            >
              {track.album}
            </Link>
          ) : (
            track.album
          )}
        </div>
      )}

      {/* Right section: Like + Duration + More Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            isFav
              ? 'text-rose-500'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100'
          }`}
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
        </button>

        <span className="text-xs font-medium text-slate-400 w-10 text-right">
          {formatDuration(track.duration)}
        </span>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu track={track} onOpenPlaylistModal={onOpenPlaylistModal} />
        </div>
      </div>
    </div>
  );
};
