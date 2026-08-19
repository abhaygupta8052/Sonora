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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-dark-card/95 backdrop-blur-2xl border-t border-dark-border/80 px-3 flex items-center justify-around select-none transition-colors duration-300 shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 w-14 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-brand-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1.5 w-5 h-1 rounded-full bg-brand-500 shadow-sm shadow-brand-500/50 animate-fade-in" />
                )}
                <Icon className="w-5 h-5 transition-transform" />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
