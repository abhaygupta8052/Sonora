import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import { Track } from '../../api/types';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { DropdownMenu } from '../common/DropdownMenu';
import { safeString } from '../../api/musicApi';

interface SongCardProps {
  track: Track;
  queueContext?: Track[];
  onOpenPlaylistModal?: (track: Track) => void;
  aspectRatio?: 'square' | 'video';
}

export const SongCard: React.FC<SongCardProps> = ({
  track,
  queueContext,
  onOpenPlaylistModal,
  aspectRatio = 'square',
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();
  const [imgLoaded, setImgLoaded] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isCurrentPlaying = isCurrent && isPlaying;

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, queueContext);
    }
  };

  const titleStr = safeString(track.title) || 'Untitled Song';
  const artistStr = safeString(track.artist) || 'Unknown Artist';
  const artistIdStr = safeString(track.artistId);

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col p-2.5 sm:p-3 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden snap-center w-[155px] sm:w-auto shrink-0 sm:shrink ${
        isCurrent
          ? 'bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/40 shadow-lg shadow-brand-500/10'
          : 'bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-dark-border/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Artwork Container */}
      <div
        className={`relative w-full rounded-xl overflow-hidden mb-2 sm:mb-3 bg-slate-800 shrink-0 ${
          aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'
        }`}
      >
        <img
          src={track.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'}
          alt={titleStr}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } group-hover:scale-105`}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Hover / Playing Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
            isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110 active:scale-95">
            {isCurrentPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Title & Artist & Dropdown */}
      <div className="flex items-start justify-between gap-1 min-w-0">
        <div className="min-w-0 flex-1">
          <h4
            title={titleStr}
            className={`text-xs sm:text-sm font-bold truncate ${
              isCurrent
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'
            }`}
          >
            {titleStr}
          </h4>
          <p
            title={artistStr}
            className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 truncate"
          >
            {artistIdStr ? (
              <Link
                to={`/artist/${encodeURIComponent(artistIdStr || artistStr)}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-slate-700 dark:hover:text-slate-300"
              >
                {artistStr}
              </Link>
            ) : (
              artistStr
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
