import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800/80 rounded-md ${className}`}
    />
  );
};

export const SongCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-2xl bg-white/40 dark:bg-dark-card/40 border border-slate-200/50 dark:border-slate-800/50">
      <Skeleton className="w-full aspect-square rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};

export const SongRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl">
      <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
};

export const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl">
      <Skeleton className="w-32 h-32 rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
};
