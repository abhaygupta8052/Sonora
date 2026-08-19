import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, ListPlus, Play, Heart, Check, Share2 } from 'lucide-react';
import { Track } from '../../api/types';
import { useLibrary } from '../../context/LibraryContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

interface DropdownMenuProps {
  track: Track;
  onOpenPlaylistModal?: (track: Track) => void;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  track,
  onOpenPlaylistModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite } = useLibrary();
  const { addToQueue, playNext } = useAudioPlayer();
  const isFav = isFavorite(track.id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `Listen to "${track.title}" by ${track.artist} on Sonora!`,
          url: window.location.href
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(`${track.title} - ${track.artist}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
        aria-label="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-1 w-48 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl py-1.5 z-40 animate-scale-up"
        >
          <button
            onClick={() => {
              playNext(track);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <Play className="w-3.5 h-3.5 text-brand-500" />
            Play Next
          </button>

          <button
            onClick={() => {
              addToQueue(track);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
            Add to Queue
          </button>

          {onOpenPlaylistModal && (
            <button
              onClick={() => {
                onOpenPlaylistModal(track);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
            >
              <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
              Add to Playlist...
            </button>
          )}

          <button
            onClick={() => {
              toggleFavorite(track);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
            {isFav ? 'Remove Favorite' : 'Save to Favorites'}
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          <button
            onClick={handleShare}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            {copied ? 'Copied to Clipboard!' : 'Share Song'}
          </button>
        </div>
      )}
    </div>
  );
};
