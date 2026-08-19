import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Search,
  Download,
} from 'lucide-react';

interface TopbarProps {
  onOpenInstallModal?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenInstallModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isInstallable, isInstalled } = usePWAInstall();

  const isSearchPage = location.pathname === '/search';

  const handleThemeToggle = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'system') return Laptop;
    return resolvedTheme === 'dark' ? Moon : Sun;
  };

  const ThemeIcon = getThemeIcon();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-dark-bg/95 backdrop-blur-xl border-b border-dark-border/80 transition-colors duration-300">
      {/* Left: Navigation Buttons & Mobile Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <Link to="/" className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black border border-slate-700/60 overflow-hidden flex items-center justify-center shadow-md shrink-0">
            <img src="/logo.png" alt="Sonora Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
              Sonora
            </span>
            <span className="text-[9px] font-semibold text-brand-500 block -mt-0.5">
              Powered by Abhay Gupta
            </span>
          </div>
        </Link>

        {/* History Nav */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-dark-card hover:bg-slate-800 text-slate-300 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-full bg-dark-card hover:bg-slate-800 text-slate-300 transition-colors"
            aria-label="Go forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar Shortcut (Desktop only when not on search page) */}
        {!isSearchPage && (
          <div className="hidden lg:block w-72 ml-4">
            <button
              onClick={() => navigate('/search')}
              className="w-full flex items-center gap-2.5 px-4 py-2 rounded-full bg-dark-card hover:bg-slate-800 border border-dark-border text-xs font-medium text-slate-400 transition-all text-left"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search songs, artists...</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Install PWA + Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Install PWA Prompt Button */}
        {isInstallable && !isInstalled && onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-600/25 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* Theme Mode Toggle Button */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-full bg-dark-card hover:bg-slate-800 border border-dark-border/80 text-slate-300 transition-colors"
          title={`Current: ${theme} mode. Click to switch.`}
          aria-label="Toggle theme"
        >
          <ThemeIcon className="w-4 h-4 text-brand-400" />
        </button>
      </div>
    </header>
  );
};
