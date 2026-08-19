import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  Flame,
  Search,
  Library,
  Settings,
  Heart,
  Plus,
  Music2,
  Sparkles,
  Radio,
  Download
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Modal } from '../common/Modal';

interface SidebarProps {
  onOpenInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenInstallModal }) => {
  const { playlists, favorites, createPlaylist } = useLibrary();
  const { isInstalled } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createPlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/trending', label: 'Trending', icon: Flame },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/library', label: 'Your Library', icon: Library },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-dark-surface border-r border-dark-border/80 p-5 shrink-0 select-none h-screen sticky top-0 transition-colors duration-300">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-6 group">
          <div className="w-10 h-10 rounded-2xl bg-black border border-slate-700/60 overflow-hidden flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
            <img src="/logo.png" alt="Sonora Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
              Sonora
            </h1>
            <span className="text-[10px] font-semibold text-brand-500 block -mt-0.5">
              Powered by Abhay Gupta
            </span>
          </div>
        </Link>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-slate-200 dark:bg-slate-800 my-5" />

        {/* Quick Library Links */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Playlists
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-brand-600 transition-colors"
              title="Create new playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Liked Songs Shortcut */}
          <NavLink
            to="/library?tab=liked"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">Liked Songs</p>
              <p className="text-[11px] text-slate-400">{favorites.length} songs</p>
            </div>
          </NavLink>

          {/* User Playlists */}
          <div className="space-y-1">
            {playlists.map((pl) => (
              <NavLink
                key={pl.id}
                to={`/playlist/${pl.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors truncate ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <Music2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{pl.title}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Footer: Install PWA button & Unlimited Free badge */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {!isInstalled && onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-600/25 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>Install Sonora App</span>
            </button>
          )}

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-brand-500/10 to-pink-500/10 border border-brand-500/20">
            <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">100% Free & Unlimited</p>
              <p className="text-[10px] text-brand-500 font-medium">Powered by Abhay Gupta</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Create Playlist Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Playlist"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Playlist Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chill Vibes, Workout Jams"
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
              placeholder="Give your playlist a mood description..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
    </>
  );
};
