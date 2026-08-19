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
  swatches: [string, string, string]; // [bg/base, primary/accent, highlight]
  isLight?: boolean;
  accent: string;
  accentHover: string;
  accentGlow: string;
  bgDark: string;
  cardDark: string;
  borderDark: string;
}

export const APP_THEMES: AppThemeConfig[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Dark glassmorphism with dynamic artwork backdrop',
    icon: '🎵',
    swatches: ['#1e1b4b', '#7c3aed', '#0f172a'],
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    accentGlow: 'rgba(124, 58, 237, 0.35)',
    bgDark: '#090D16',
    cardDark: '#161F33',
    borderDark: 'rgba(124, 58, 237, 0.25)'
  },
  {
    id: 'neumorphic',
    name: 'Neumorphic',
    description: 'Light soft-shadow style with circular artwork',
    icon: '☁️',
    swatches: ['#e5dfd3', '#b8a88f', '#f2efe9'],
    isLight: true,
    accent: '#b8a88f',
    accentHover: '#a3937a',
    accentGlow: 'rgba(184, 168, 143, 0.35)',
    bgDark: '#ede8df',
    cardDark: '#f5f2eb',
    borderDark: 'rgba(184, 168, 143, 0.3)'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold purple gradient with high-contrast controls',
    icon: '✨',
    swatches: ['#3b0764', '#a855f7', '#8b5cf6'],
    accent: '#a855f7',
    accentHover: '#9333ea',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    bgDark: '#0f051d',
    cardDark: '#1f0a38',
    borderDark: 'rgba(168, 85, 247, 0.3)'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean dark design with full-width lyrics & crisp hero art',
    icon: '🔲',
    swatches: ['#0f172a', '#3b82f6', '#1e293b'],
    accent: '#3b82f6',
    accentHover: '#2563eb',
    accentGlow: 'rgba(59, 130, 246, 0.35)',
    bgDark: '#0b1120',
    cardDark: '#131c31',
    borderDark: 'rgba(59, 130, 246, 0.25)'
  },
  {
    id: 'glass-pro',
    name: 'Glass Pro',
    description: 'Liquid glass throughout, over a drifting aurora backdrop',
    icon: '💎',
    swatches: ['#082f49', '#0ea5e9', '#0369a1'],
    accent: '#0ea5e9',
    accentHover: '#0284c7',
    accentGlow: 'rgba(14, 165, 233, 0.4)',
    bgDark: '#041726',
    cardDark: '#0c253d',
    borderDark: 'rgba(14, 165, 233, 0.3)'
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Deep crimson & rose bloom with soft blush glows',
    icon: '🌸',
    swatches: ['#4c0519', '#be123c', '#f43f5e'],
    accent: '#f43f5e',
    accentHover: '#e11d48',
    accentGlow: 'rgba(244, 63, 94, 0.4)',
    bgDark: '#16030a',
    cardDark: '#290915',
    borderDark: 'rgba(244, 63, 94, 0.3)'
  },
  {
    id: 'sunset-shades',
    name: 'Sunset Shades',
    description: 'Warm gold, apricot & coral sunset gradient',
    icon: '🌅',
    swatches: ['#451a03', '#c2410c', '#f97316'],
    accent: '#f97316',
    accentHover: '#ea580c',
    accentGlow: 'rgba(249, 115, 22, 0.4)',
    bgDark: '#170802',
    cardDark: '#2b1206',
    borderDark: 'rgba(249, 115, 22, 0.3)'
  },
  {
    id: 'arc-studio',
    name: 'Arc Studio',
    description: 'Curved arch art frame with emerald teal & cyan glow',
    icon: '🌀',
    swatches: ['#022c22', '#0f766e', '#06b6d4'],
    accent: '#06b6d4',
    accentHover: '#0891b2',
    accentGlow: 'rgba(6, 182, 212, 0.4)',
    bgDark: '#021814',
    cardDark: '#062822',
    borderDark: 'rgba(6, 182, 212, 0.3)'
  },
  {
    id: 'cosmic-aurora',
    name: 'Cosmic Aurora',
    description: 'Floating orb artwork with midnight indigo & violet aurora',
    icon: '🌌',
    swatches: ['#0b0f19', '#3730a3', '#818cf8'],
    accent: '#818cf8',
    accentHover: '#6366f1',
    accentGlow: 'rgba(129, 140, 248, 0.4)',
    bgDark: '#060812',
    cardDark: '#101426',
    borderDark: 'rgba(129, 140, 248, 0.3)'
  },
  {
    id: 'midnight-ember',
    name: 'Midnight Ember',
    description: 'Deep navy palette with a coral ember accent (ColorHunt)',
    icon: '🔥',
    swatches: ['#18181b', '#52525b', '#a1a1aa'],
    accent: '#f97316',
    accentHover: '#ea580c',
    accentGlow: 'rgba(249, 115, 22, 0.4)',
    bgDark: '#09090b',
    cardDark: '#18181b',
    borderDark: 'rgba(249, 115, 22, 0.3)'
  },
  {
    id: 'emerald-gold',
    name: 'Emerald Gold',
    description: 'Dark forest green with royal gold highlights (ColorHunt)',
    icon: '🌿',
    swatches: ['#14532d', '#65a30d', '#eab308'],
    accent: '#eab308',
    accentHover: '#ca8a04',
    accentGlow: 'rgba(234, 179, 8, 0.4)',
    bgDark: '#05150b',
    cardDark: '#0d2817',
    borderDark: 'rgba(234, 179, 8, 0.3)'
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

  // Apply base dark/light theme mode
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = theme === 'dark';
      if (theme === 'system') {
        isDark = mediaQuery.matches;
      }

      setResolvedTheme(isDark ? 'dark' : 'light');

      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply visual AppTheme CSS variables and root classes
  useEffect(() => {
    const root = document.documentElement;

    // Remove old theme classes
    APP_THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${appTheme}`);

    if (syncAccent) {
      root.style.setProperty('--theme-accent', currentThemeConfig.accent);
      root.style.setProperty('--theme-accent-hover', currentThemeConfig.accentHover);
      root.style.setProperty('--theme-accent-glow', currentThemeConfig.accentGlow);
      root.style.setProperty('--theme-bg-dark', currentThemeConfig.bgDark);
      root.style.setProperty('--theme-card-dark', currentThemeConfig.cardDark);
      root.style.setProperty('--theme-border-dark', currentThemeConfig.borderDark);
    } else {
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-accent-hover');
      root.style.removeProperty('--theme-accent-glow');
      root.style.removeProperty('--theme-bg-dark');
      root.style.removeProperty('--theme-card-dark');
      root.style.removeProperty('--theme-border-dark');
    }
  }, [appTheme, syncAccent, currentThemeConfig]);

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
