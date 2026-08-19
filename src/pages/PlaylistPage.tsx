import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { musicApi } from '../api/musicApi';
import { Playlist, Track } from '../api/types';
import { useLibrary } from '../context/LibraryContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { SongRow } from '../components/cards/SongRow';
import { SongRowSkeleton } from '../components/common/Skeleton';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { Modal } from '../components/common/Modal';
import {
  Play,
  Shuffle,
  Music2,
  Edit2,
  Trash2,
  Clock,
  Share2,
  Check
} from 'lucide-react';
import { formatDuration } from '../utils/formatters';

export const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, updatePlaylist, deletePlaylist, removeTrackFromPlaylist } = useLibrary();
  const { playTrack } = useAudioPlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if it's a local user playlist
  const localPlaylist = playlists.find((p) => p.id === id);

  useEffect(() => {
    if (!id) return;

    if (localPlaylist) {
      setPlaylist(localPlaylist);
      setEditTitle(localPlaylist.title);
      setEditDesc(localPlaylist.description || '');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const fetchSystemPlaylist = async () => {
      setIsLoading(true);
      try {
        const data = await musicApi.getPlaylistDetails(id);
        if (mounted) {
          setPlaylist(data);
        }
      } catch (err) {
        console.error('Failed to load playlist', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchSystemPlaylist();
    return () => {
      mounted = false;
    };
  }, [id, localPlaylist]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-60 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SongRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Playlist Not Found
        </h3>
        <Link to="/library" className="text-sm text-brand-500 hover:underline mt-2 inline-block">
          Go to Library
        </Link>
      </div>
    );
  }

  const isCustom = playlist.isCustom || !!localPlaylist;
  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayPlaylist = (shuffle: boolean = false) => {
    if (playlist.tracks.length === 0) return;
    const startIndex = shuffle ? Math.floor(Math.random() * playlist.tracks.length) : 0;
    playTrack(playlist.tracks[startIndex], playlist.tracks, startIndex);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !id) return;
    updatePlaylist(id, { title: editTitle.trim(), description: editDesc.trim() });
    setIsEditModalOpen(false);
  };

  const handleDeletePlaylist = () => {
    if (!id) return;
    if (window.confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      deletePlaylist(id);
      navigate('/library');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Playlist Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-brand-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-slate-800">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 shrink-0 bg-slate-800 flex items-center justify-center">
          {playlist.tracks.length > 0 && playlist.artwork ? (
            <img
              src={playlist.artwork}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music2 className="w-16 h-16 text-brand-400" />
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider">
            <span>{isCustom ? 'Custom Playlist' : 'Curated Playlist'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight truncate">
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
            <span>{playlist.tracks.length} songs</span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(totalDuration)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {playlist.tracks.length > 0 && (
              <>
                <button
                  onClick={() => handlePlayPlaylist(false)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  <span>Play</span>
                </button>
                <button
                  onClick={() => handlePlayPlaylist(true)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  title="Shuffle playlist"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </>
            )}

            {isCustom && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  title="Edit playlist details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeletePlaylist}
                  className="p-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 backdrop-blur-md transition-colors"
                  title="Delete playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              title="Share playlist link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Songs */}
      {playlist.tracks.length === 0 ? (
        <div className="text-center py-12 bg-white/40 dark:bg-dark-card/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6">
          <Music2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            This playlist is empty
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Browse trending music or search for your favorite tracks and tap "Add to Playlist" to populate this collection.
          </p>
          <Link
            to="/search"
            className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500"
          >
            Find Songs
          </Link>
        </div>
      ) : (
        <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60">
          {playlist.tracks.map((track, i) => (
            <div key={`pl-track-${track.id}-${i}`} className="relative group/row">
              <SongRow
                track={track}
                index={i + 1}
                queueContext={playlist.tracks}
                onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
              />
              {isCustom && id && (
                <button
                  onClick={() => removeTrackFromPlaylist(id, track.id)}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  title="Remove from this playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Playlist Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Playlist"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Playlist Title
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!editTitle.trim()}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-brand-600/30"
            >
              Save Changes
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
