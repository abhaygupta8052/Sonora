import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  Flame,
  Search,
  Library,
  Heart,
  Settings,
  Download,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface SidebarProps {
  onOpenInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenInstallModal }) => {
  const { isInstallable, isInstalled, hasNativePrompt, promptInstall } = usePWAInstall();

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const installed = await promptInstall();
      if (!installed && onOpenInstallModal) {
        onOpenInstallModal();
      }
    } else if (onOpenInstallModal) {
      onOpenInstallModal();
    }
  };

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/trending', label: 'Trending', icon: Flame },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/library', label: 'Library', icon: Library },
    { to: '/library?tab=favorites', label: 'Favorites', icon: Heart },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-dark-surface border-r border-slate-200/80 dark:border-dark-border/80 p-5 shrink-0 select-none h-screen sticky top-0 transition-colors duration-300">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-6 group">
          <div className="w-10 h-10 rounded-2xl bg-black border border-slate-700/60 overflow-hidden flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
            <img src="/logo.png" alt="Sonora Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-600 via-indigo-500 to-pink-500 dark:from-brand-400 dark:via-indigo-300 dark:to-pink-400 bg-clip-text text-transparent leading-none">
              Sonora
            </h1>
            <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 tracking-wide mt-1">
              Powered by Abhay Gupta
            </p>
          </div>
        </Link>

        {/* Main Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom PWA Install Banner */}
        <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-dark-border/80">
          {!isInstalled ? (
            <button
              onClick={handleInstallClick}
              disabled={!isInstallable && !onOpenInstallModal}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-purple-500/10 hover:from-brand-500/20 hover:to-purple-500/20 border border-brand-500/20 hover:border-brand-500/40 text-brand-600 dark:text-brand-400 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Install Sonora</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Desktop & Offline App</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <div>
                <p className="text-xs font-bold">App Installed</p>
                <p className="text-[10px] opacity-80">Running as desktop app</p>
              </div>
            </div>
          )}

          {/* Abhay Gupta Credit Badge */}
          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Made with ❤️ by <span className="font-semibold text-brand-600 dark:text-brand-400">Abhay Gupta</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
