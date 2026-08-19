import React from 'react';
import { Link } from 'react-router-dom';
import { Album } from '../../api/types';
import { Disc3 } from 'lucide-react';

interface AlbumCardProps {
  album: Album;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  return (
    <Link
      to={`/album/${album.id}`}
      className="group flex flex-col p-3 rounded-2xl bg-white/40 dark:bg-dark-card/40 hover:bg-white dark:hover:bg-dark-card border border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-900 shadow-md">
        <img
          src={album.artwork}
          alt={album.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/80">
          <Disc3 className="w-3.5 h-3.5" />
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-500 transition-colors">
        {album.title}
      </h4>

      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
        {album.artist} • {album.releaseYear || 'Album'}
      </p>
    </Link>
  );
};
