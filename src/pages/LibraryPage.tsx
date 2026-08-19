import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { SongRow } from '../components/cards/SongRow';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { Track } from '../api/types';
import {
  Heart,
  ListMusic,
  Clock,
  Play,
  Shuffle,
  Plus,
  Trash2,
  Music2
} from 'lucide-react';

type LibraryTab = 'playlists' | 'liked' | 'recent';

export const LibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab: LibraryTab =
    rawTab === 'recent' || rawTab === 'history'
      ? 'recent'
      : rawTab === 'liked'
      ? 'liked'
      : 'playlists';

  const [activeTab, setActiveTab] = useState<LibraryTab>(initialTab);
  const {
    favorites,
    playlists,
    recentlyPlayed,
    createPlaylist,
    deletePlaylist,
    clearRecentlyPlayed,
    clearFavorites
  } = useLibrary();
  const { playTrack } = useAudioPlayer();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'recent' || tabParam === 'history') {
      setActiveTab('recent');
    } else if (tabParam === 'liked') {
      setActiveTab('liked');
    } else if (tabParam === 'playlists') {
      setActiveTab('playlists');
    }
  }, [searchParams]);

  const handleTabChange = (tab: LibraryTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createPlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setIsCreateModalOpen(false);
  };

  const handlePlayLiked = (shuffle: boolean = false) => {
    if (favorites.length === 0) return;
    const startIndex = shuffle ? Math.floor(Math.random() * favorites.length) : 0;
    playTrack(favorites[startIndex], favorites, startIndex);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Your Library
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your personal playlists, saved favorites, and listening history.
          </p>
        </div>

        {activeTab === 'playlists' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Playlist</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => handleTabChange('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'playlists'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>My Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('liked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'liked'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Songs ({favorites.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'recent'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recently Played ({recentlyPlayed.length})</span>
        </button>
      </div>

      {/* Tab Content: Playlists */}
      {activeTab === 'playlists' && (
        <div>
          {playlists.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title="Create your first playlist"
              description="Group your favorite tracks together into custom playlists."
              actionText="Create Playlist"
              onAction={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <Link to={`/playlist/${pl.id}`} className="block">
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-gradient-to-tr from-brand-900 to-indigo-950 flex items-center justify-center">
                      {pl.tracks.length > 0 && pl.artwork ? (
                        <img
                          src={pl.artwork}
                          alt={pl.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Music2 className="w-12 h-12 text-brand-400/60" />
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                      {pl.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {pl.description || `${pl.tracks.length} tracks`}
                    </p>
                  </Link>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      {pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}
                    </span>
                    <button
                      onClick={() => deletePlaylist(pl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Liked Songs */}
      {activeTab === 'liked' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-700 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 fill-white" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold">Liked Songs</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {favorites.length} saved {favorites.length === 1 ? 'track' : 'tracks'}
                </p>
              </div>
            </div>

            {favorites.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlayLiked(false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                  <span>Play All</span>
                </button>
                <button
                  onClick={() => handlePlayLiked(true)}
                  className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                  title="Shuffle liked songs"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {favorites.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No liked songs yet"
              description="Heart songs while browsing to build your personal favorite collection."
            />
          ) : (
            <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60">
              {favorites.map((track, i) => (
                <SongRow
                  key={`fav-${track.id}-${i}`}
                  track={track}
                  index={i + 1}
                  queueContext={favorites}
                  onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Recently Played */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Your last {recentlyPlayed.length} played tracks
            </span>
            {recentlyPlayed.length > 0 && (
              <button
                onClick={clearRecentlyPlayed}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {recentlyPlayed.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No listening history"
              description="Songs you listen to will show up here so you can easily replay them."
            />
          ) : (
            <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60">
              {recentlyPlayed.map((track, i) => (
                <SongRow
                  key={`recent-${track.id}-${i}`}
                  track={track}
                  index={i + 1}
                  queueContext={recentlyPlayed}
                  onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Playlist"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Playlist Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Late Night Vibes"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add an optional description..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
            >
              Create Playlist
            </button>
          </div>
        </form>
      </Modal>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
