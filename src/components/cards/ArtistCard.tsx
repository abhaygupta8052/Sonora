import React from 'react';
import { Link } from 'react-router-dom';
import { Artist } from '../../api/types';
import { formatNumber } from '../../utils/formatters';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-dark-card/40 hover:bg-white dark:hover:bg-dark-card border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-3 bg-slate-800 ring-4 ring-slate-100 dark:ring-slate-800/80 group-hover:ring-brand-500/50 transition-all duration-300">
        <img
          src={artist.image}
          alt={artist.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate w-full group-hover:text-brand-500 transition-colors">
        {artist.name}
      </h4>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {artist.monthlyListeners
          ? `${artist.monthlyListeners} listeners`
          : artist.followerCount
          ? `${formatNumber(artist.followerCount)} fans`
          : 'Artist'}
      </p>
    </Link>
  );
};
