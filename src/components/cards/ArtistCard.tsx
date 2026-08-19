import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Artist } from '../../api/types';
import { formatNumber } from '../../utils/formatters';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // High-res fallback avatar from curated images or UI avatars
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    artist.name
  )}&background=7c3aed&color=fff&size=200&bold=true`;

  const src = imgError || !artist.image ? fallback : artist.image;

  return (
    <Link
      to={`/artist/${encodeURIComponent(artist.id)}`}
      className="group flex flex-col items-center text-center p-2.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-dark-card/60 hover:bg-white dark:hover:bg-dark-card border border-slate-200/80 dark:border-dark-border/60 hover:border-brand-500/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden shrink-0 snap-start w-28 sm:w-auto"
    >
      {/* Avatar Container */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2.5 shrink-0 max-w-full aspect-square">
        <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700/80 group-hover:ring-brand-500 transition-all duration-300 bg-slate-800">
          <img
            src={src}
            alt={artist.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 ${
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
          />
        </div>
      </div>

      {/* Artist Name */}
      <h4
        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate w-full group-hover:text-brand-500 transition-colors"
        title={artist.name}
      >
        {artist.name}
      </h4>

      {/* Monthly Listeners */}
      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate w-full">
        {artist.monthlyListeners
          ? `${artist.monthlyListeners} listeners`
          : artist.followerCount
          ? `${formatNumber(artist.followerCount)} fans`
          : 'Artist'}
      </p>
    </Link>
  );
};
