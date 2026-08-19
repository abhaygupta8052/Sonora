import React from 'react';
import { Link } from 'react-router-dom';
import { Album } from '../../api/types';
import { Disc3 } from 'lucide-react';
import { safeString } from '../../api/musicApi';

interface AlbumCardProps {
  album: Album;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const titleStr = safeString(album.title) || 'Album';
  const artistStr = safeString(album.artist) || 'Various Artists';
  const idStr = safeString(album.id);

  return (
    <Link
      to={`/album/${encodeURIComponent(idStr)}`}
      className="group flex flex-col p-3 rounded-2xl bg-white/80 dark:bg-dark-card/60 hover:bg-white dark:hover:bg-dark-card border border-slate-200/80 dark:border-dark-border/60 hover:border-brand-500/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-900 shadow-md">
        <img
          src={album.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600'}
          alt={titleStr}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/80">
          <Disc3 className="w-3.5 h-3.5" />
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-500 transition-colors">
        {titleStr}
      </h4>

      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
        {artistStr} • {safeString(album.releaseYear) || 'Album'}
      </p>
    </Link>
  );
};
