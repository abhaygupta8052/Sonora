import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Artist } from '../../api/types';
import { formatNumber } from '../../utils/formatters';
import { useArtistImage } from '../../hooks/useArtistImage';
import { Mic2 } from 'lucide-react';

interface ArtistCardProps {
  artist: Artist;
}

// Initials SVG fallback
function initialsPlaceholder(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=300&background=6d28d9&color=ffffff&bold=true&format=svg&length=2`;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Lazily fetch or use direct real artist image
  const realImage = useArtistImage(
    artist.name,
    artist.image,
    initialsPlaceholder(artist.name)
  );

  const src = imgError || !realImage ? initialsPlaceholder(artist.name) : realImage;

  return (
    <Link
      to={`/artist/${encodeURIComponent(artist.id)}`}
      className="group flex flex-col items-center text-center p-2.5 sm:p-4 rounded-2xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 hover:border-brand-500/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden shrink-0 snap-start w-28 sm:w-auto"
    >
      {/* Avatar Container — sized to fit card container with no horizontal overflow */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2.5 shrink-0 max-w-full aspect-square">
        {/* Subtle glow ring on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-300 scale-105" />

        {/* Circular photo container */}
        <div className="relative w-full h-full rounded-full overflow-hidden ring-2 ring-slate-200/80 dark:ring-slate-700/80 group-hover:ring-brand-500 transition-all duration-300 bg-slate-800">
          {/* Loading mic icon */}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <Mic2 className="w-5 h-5 text-slate-500 animate-pulse" />
            </div>
          )}

          {/* Real Artist Photo */}
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
