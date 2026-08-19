import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Flame, Search, Library, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/trending', label: 'Trending', icon: Flame },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/library', label: 'Library', icon: Library },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-[#0E1524]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 px-2 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 w-14 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
