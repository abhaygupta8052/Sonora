import React, { useState } from 'react';
import { Modal } from './Modal';
import { Track } from '../../api/types';
import { useLibrary } from '../../context/LibraryContext';
import { Plus, Check, Music } from 'lucide-react';

interface AddToPlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  isOpen,
  onClose
}) => {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibrary();
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState<Record<string, boolean>>({});

  if (!track) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    addTrackToPlaylist(playlistId, track);
    setAddedPlaylists(prev => ({ ...prev, [playlistId]: true }));
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newPl = createPlaylist(newTitle.trim());
    addTrackToPlaylist(newPl.id, track);
    setNewTitle('');
    setIsCreating(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Playlist">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 mb-5">
        <img
          src={track.artwork}
          alt={track.title}
          className="w-12 h-12 rounded-lg object-cover shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
            {track.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {track.artist}
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {playlists.length === 0 && !isCreating ? (
          <p className="text-xs text-center text-slate-500 py-4">
            You don't have any playlists yet.
          </p>
        ) : (
          playlists.map((pl) => {
            const hasSong = pl.tracks.some(t => t.id === track.id) || addedPlaylists[pl.id];
            return (
              <button
                key={pl.id}
                onClick={() => !hasSong && handleAddToPlaylist(pl.id)}
                disabled={hasSong}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left ${
                  hasSong
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{pl.title}</p>
                    <p className="text-xs text-slate-400">{pl.trackCount} songs</p>
                  </div>
                </div>
                {hasSong && <Check className="w-4 h-4 shrink-0 text-emerald-500" />}
              </button>
            );
          })
        )}
      </div>

      {/* New Playlist input or trigger */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand-500 focus:outline-none text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold"
            >
              Create
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 text-brand-600 dark:text-brand-400 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </button>
        )}
      </div>
    </Modal>
  );
};
