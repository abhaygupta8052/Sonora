import React from 'react';
import { Link } from 'react-router-dom';
import { Playlist } from '../../api/types';
import { Play } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const { playTrack } = useAudioPlayer();

  const handlePlayDirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (playlist.tracks && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className="group relative flex flex-col p-3 rounded-2xl bg-white/80 dark:bg-dark-card/60 hover:bg-white dark:hover:bg-dark-card border border-slate-200/80 dark:border-dark-border/60 hover:border-brand-500/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 select-none"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-900 shadow-md">
        <img
          src={playlist.artwork}
          alt={playlist.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Quick Play Button */}
        {playlist.tracks && playlist.tracks.length > 0 && (
          <button
            onClick={handlePlayDirect}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/40 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 active:scale-95"
            aria-label="Play Playlist"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}
      </div>

      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {playlist.title}
      </h4>

      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
        {playlist.description || `${playlist.trackCount || playlist.tracks?.length || 0} songs`}
      </p>
    </Link>
  );
};
