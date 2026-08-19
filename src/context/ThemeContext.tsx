import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../api/types';
import { storage } from '../utils/storage';

export type AppThemeId =
  | 'classic'
  | 'neumorphic'
  | 'vibrant'
  | 'minimal'
  | 'glass-pro'
  | 'cherry-blossom'
  | 'sunset-shades'
  | 'arc-studio'
  | 'cosmic-aurora'
  | 'midnight-ember'
  | 'emerald-gold';

export interface AppThemeConfig {
  id: AppThemeId;
  name: string;
  description: string;
  icon: string;
  swatches: [string, string, string];
  isLight?: boolean;
  accentRgb: string;
  accentHoverRgb: string;
  bgDarkRgb: string;
  surfaceDarkRgb: string;
  cardDarkRgb: string;
  cardHoverRgb: string;
  borderDarkRgb: string;
}

export const APP_THEMES: AppThemeConfig[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Dark glassmorphism with dynamic artwork backdrop',
    icon: '🎵',
    swatches: ['#1e1b4b', '#7c3aed', '#0f172a'],
    accentRgb: '139 92 246',
    accentHoverRgb: '124 58 237',
    bgDarkRgb: '9 13 22',
    surfaceDarkRgb: '14 20 36',
    cardDarkRgb: '22 31 51',
    cardHoverRgb: '30 43 69',
    borderDarkRgb: '35 47 72'
  },
  {
    id: 'neumorphic',
    name: 'Neumorphic',
    description: 'Light soft-shadow style with circular artwork',
    icon: '☁️',
    swatches: ['#e5dfd3', '#b8a88f', '#f2efe9'],
    isLight: true,
    accentRgb: '163 147 122',
    accentHoverRgb: '140 124 101',
    bgDarkRgb: '237 232 223',
    surfaceDarkRgb: '229 223 211',
    cardDarkRgb: '245 242 235',
    cardHoverRgb: '236 230 220',
    borderDarkRgb: '216 206 191'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold purple gradient with high-contrast controls',
    icon: '✨',
    swatches: ['#3b0764', '#a855f7', '#8b5cf6'],
    accentRgb: '168 85 247',
    accentHoverRgb: '147 51 234',
    bgDarkRgb: '15 5 29',
    surfaceDarkRgb: '23 8 46',
    cardDarkRgb: '34 13 64',
    cardHoverRgb: '48 19 92',
    borderDarkRgb: '67 25 122'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean dark design with full-width lyrics & crisp hero art',
    icon: '🔲',
    swatches: ['#0f172a', '#3b82f6', '#1e293b'],
    accentRgb: '59 130 246',
    accentHoverRgb: '37 99 235',
    bgDarkRgb: '11 17 32',
    surfaceDarkRgb: '15 23 42',
    cardDarkRgb: '22 34 56',
    cardHoverRgb: '30 47 77',
    borderDarkRgb: '36 54 86'
  },
  {
    id: 'glass-pro',
    name: 'Glass Pro',
    description: 'Liquid glass throughout, over a drifting aurora backdrop',
    icon: '💎',
    swatches: ['#082f49', '#0ea5e9', '#0369a1'],
    accentRgb: '14 165 233',
    accentHoverRgb: '2 132 199',
    bgDarkRgb: '4 23 38',
    surfaceDarkRgb: '8 37 61',
    cardDarkRgb: '13 52 84',
    cardHoverRgb: '19 70 111',
    borderDarkRgb: '26 86 133'
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Deep crimson & rose bloom with soft blush glows',
    icon: '🌸',
    swatches: ['#4c0519', '#be123c', '#f43f5e'],
    accentRgb: '244 63 94',
    accentHoverRgb: '225 29 72',
    bgDarkRgb: '23 4 11',
    surfaceDarkRgb: '36 7 19',
    cardDarkRgb: '54 12 29',
    cardHoverRgb: '77 19 43',
    borderDarkRgb: '99 25 56'
  },
  {
    id: 'sunset-shades',
    name: 'Sunset Shades',
    description: 'Warm gold, apricot & coral sunset gradient',
    icon: '🌅',
    swatches: ['#451a03', '#c2410c', '#f97316'],
    accentRgb: '249 115 22',
    accentHoverRgb: '234 88 12',
    bgDarkRgb: '23 8 2',
    surfaceDarkRgb: '36 13 4',
    cardDarkRgb: '56 22 8',
    cardHoverRgb: '79 33 13',
    borderDarkRgb: '105 45 19'
  },
  {
    id: 'arc-studio',
    name: 'Arc Studio',
    description: 'Curved arch art frame with emerald teal & cyan glow',
    icon: '🌀',
    swatches: ['#022c22', '#0f766e', '#06b6d4'],
    accentRgb: '6 182 212',
    accentHoverRgb: '8 145 178',
    bgDarkRgb: '2 24 20',
    surfaceDarkRgb: '4 36 30',
    cardDarkRgb: '9 56 48',
    cardHoverRgb: '14 79 68',
    borderDarkRgb: '20 105 91'
  },
  {
    id: 'cosmic-aurora',
    name: 'Cosmic Aurora',
    description: 'Floating orb artwork with midnight indigo & violet aurora',
    icon: '🌌',
    swatches: ['#0b0f19', '#3730a3', '#818cf8'],
    accentRgb: '129 140 248',
    accentHoverRgb: '99 102 241',
    bgDarkRgb: '7 9 20',
    surfaceDarkRgb: '13 17 36',
    cardDarkRgb: '21 27 56',
    cardHoverRgb: '30 39 79',
    borderDarkRgb: '42 54 107'
  },
  {
    id: 'midnight-ember',
    name: 'Midnight Ember',
    description: 'Deep navy palette with a coral ember accent (ColorHunt)',
    icon: '🔥',
    swatches: ['#18181b', '#52525b', '#a1a1aa'],
    accentRgb: '249 115 22',
    accentHoverRgb: '234 88 12',
    bgDarkRgb: '9 9 11',
    surfaceDarkRgb: '18 18 21',
    cardDarkRgb: '28 28 33',
    cardHoverRgb: '39 39 46',
    borderDarkRgb: '56 56 66'
  },
  {
    id: 'emerald-gold',
    name: 'Emerald Gold',
    description: 'Dark forest green with royal gold highlights (ColorHunt)',
    icon: '🌿',
    swatches: ['#14532d', '#65a30d', '#eab308'],
    accentRgb: '234 179 8',
    accentHoverRgb: '202 138 4',
    bgDarkRgb: '4 20 10',
    surfaceDarkRgb: '8 33 18',
    cardDarkRgb: '14 51 29',
    cardHoverRgb: '21 71 42',
    borderDarkRgb: '30 97 57'
  }
];

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: ThemeMode) => void;
  appTheme: AppThemeId;
  setAppTheme: (themeId: AppThemeId) => void;
  syncAccent: boolean;
  setSyncAccent: (sync: boolean) => void;
  currentThemeConfig: AppThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => storage.getTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [appTheme, setAppThemeState] = useState<AppThemeId>(() => (storage.getAppTheme() as AppThemeId) || 'classic');
  const [syncAccent, setSyncAccentState] = useState<boolean>(() => storage.getSyncAccent());

  const currentThemeConfig = APP_THEMES.find((t) => t.id === appTheme) || APP_THEMES[0];

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    storage.setTheme(newTheme);
  };

  const setAppTheme = (themeId: AppThemeId) => {
    setAppThemeState(themeId);
    storage.setAppTheme(themeId);
  };

  const setSyncAccent = (enabled: boolean) => {
    setSyncAccentState(enabled);
    storage.setSyncAccent(enabled);
  };

  // Base theme mode — dynamically compute dark vs light based on user setting / OS preference
  useEffect(() => {
    const root = document.documentElement;

    let isDark = true;
    if (theme === 'light') {
      isDark = false;
    } else if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'system') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = !currentThemeConfig.isLight;
    }

    setResolvedTheme(isDark ? 'dark' : 'light');

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Also listen to system media query changes if on system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const dark = e.matches;
        setResolvedTheme(dark ? 'dark' : 'light');
        if (dark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, currentThemeConfig]);

  // Apply visual AppTheme CSS variables, document background, and root classes
  useEffect(() => {
    const root = document.documentElement;

    // Set theme class on root
    APP_THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${appTheme}`);

    // Inject RGB channel variables for Tailwind alpha-value resolution
    root.style.setProperty('--theme-bg-dark-rgb', currentThemeConfig.bgDarkRgb);
    root.style.setProperty('--theme-surface-dark-rgb', currentThemeConfig.surfaceDarkRgb);
    root.style.setProperty('--theme-card-dark-rgb', currentThemeConfig.cardDarkRgb);
    root.style.setProperty('--theme-card-hover-rgb', currentThemeConfig.cardHoverRgb);
    root.style.setProperty('--theme-border-dark-rgb', currentThemeConfig.borderDarkRgb);

    if (syncAccent) {
      root.style.setProperty('--theme-accent-rgb', currentThemeConfig.accentRgb);
      root.style.setProperty('--theme-accent-hover-rgb', currentThemeConfig.accentHoverRgb);
    } else {
      root.style.setProperty('--theme-accent-rgb', '139 92 246');
      root.style.setProperty('--theme-accent-hover-rgb', '124 58 237');
    }

    if (document.body) {
      const isDark = resolvedTheme === 'dark';
      if (isDark) {
        document.body.style.backgroundColor = `rgb(${currentThemeConfig.bgDarkRgb})`;
      } else {
        document.body.style.backgroundColor = currentThemeConfig.isLight ? `rgb(${currentThemeConfig.bgDarkRgb})` : '#f8fafc';
      }
    }
  }, [appTheme, syncAccent, currentThemeConfig, resolvedTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        appTheme,
        setAppTheme,
        syncAccent,
        setSyncAccent,
        currentThemeConfig
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
