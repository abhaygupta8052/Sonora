import { Track, Playlist, ThemeMode, AudioQuality, RepeatMode } from '../api/types';

const STORAGE_KEYS = {
  FAVORITES: 'sonora_favorites_v1',
  PLAYLISTS: 'sonora_custom_playlists_v1',
  RECENTLY_PLAYED: 'sonora_recently_played_v1',
  SEARCH_HISTORY: 'sonora_search_history_v1',
  THEME: 'sonora_theme_preference_v1',
  APP_THEME: 'sonora_app_theme_v1',
  SYNC_ACCENT: 'sonora_sync_accent_v1',
  VOLUME: 'sonora_player_volume_v1',
  AUDIO_QUALITY: 'sonora_audio_quality_v1',
  AUTOPLAY: 'sonora_autoplay_v1',
  LAST_PLAYED_TRACK: 'sonora_last_track_v1',
  PLAYER_STATE: 'sonora_playback_state_v1',
  PWA_INSTALL_COUNT: 'sonora_pwa_install_count_v1'
} as const;

export interface SavedPlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  queueIndex: number;
  currentTime: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  savedAt: number;
}

const MAX_RECENT_TRACKS = 100;
const MAX_SEARCH_HISTORY = 25;

export const storage = {
  // Favorites
  getFavorites(): Track[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setFavorites(tracks: Track[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(tracks));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  },

  isFavorite(trackId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(t => t.id === trackId);
  },

  toggleFavorite(track: Track): boolean {
    const favorites = this.getFavorites();
    const index = favorites.findIndex(t => t.id === track.id);
    let isNowFavorite = false;

    if (index >= 0) {
      favorites.splice(index, 1);
      isNowFavorite = false;
    } else {
      favorites.unshift(track);
      isNowFavorite = true;
    }

    this.setFavorites(favorites);
    return isNowFavorite;
  },

  // Playlists
  getPlaylists(): Playlist[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setPlaylists(playlists: Playlist[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.error('Failed to save playlists to localStorage', e);
    }
  },

  createPlaylist(title: string, description: string = ''): Playlist {
    const playlists = this.getPlaylists();
    const newPlaylist: Playlist = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'My Playlist',
      description: description.trim(),
      artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      trackCount: 0,
      tracks: [],
      isCustom: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    playlists.unshift(newPlaylist);
    this.setPlaylists(playlists);
    return newPlaylist;
  },

  updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex(p => p.id === id);
    if (index === -1) return null;

    playlists[index] = {
      ...playlists[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.setPlaylists(playlists);
    return playlists[index];
  },

  deletePlaylist(id: string): void {
    const playlists = this.getPlaylists().filter(p => p.id !== id);
    this.setPlaylists(playlists);
  },

  addTrackToPlaylist(playlistId: string, track: Track): boolean {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    // Check if already in playlist
    if (!playlist.tracks.some(t => t.id === track.id)) {
      playlist.tracks.push(track);
      playlist.trackCount = playlist.tracks.length;
      if (playlist.tracks.length === 1 && track.artwork) {
        playlist.artwork = track.artwork;
      }
      playlist.updatedAt = Date.now();
      this.setPlaylists(playlists);
      return true;
    }
    return false;
  },

  removeTrackFromPlaylist(playlistId: string, trackId: string): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    playlist.trackCount = playlist.tracks.length;
    playlist.updatedAt = Date.now();
    this.setPlaylists(playlists);
  },

  // Recently Played
  getRecentlyPlayed(): Track[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRecentlyPlayed(track: Track): void {
    try {
      let recent = this.getRecentlyPlayed();
      recent = recent.filter(t => t.id !== track.id);
      recent.unshift(track);
      if (recent.length > MAX_RECENT_TRACKS) {
        recent = recent.slice(0, MAX_RECENT_TRACKS);
      }
      localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to save recently played', e);
    }
  },

  clearRecentlyPlayed(): void {
    localStorage.removeItem(STORAGE_KEYS.RECENTLY_PLAYED);
  },

  // Search History
  getSearchHistory(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSearchHistory(query: string): void {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      let history = this.getSearchHistory().filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      history.unshift(trimmed);
      if (history.length > MAX_SEARCH_HISTORY) {
        history = history.slice(0, MAX_SEARCH_HISTORY);
      }
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  },

  removeSearchHistoryItem(query: string): void {
    const history = this.getSearchHistory().filter(q => q !== query);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  },

  clearSearchHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },

  // Settings & Preferences
  getTheme(): ThemeMode {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'dark';
  },

  setTheme(theme: ThemeMode): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getAppTheme(): string {
    return localStorage.getItem(STORAGE_KEYS.APP_THEME) || 'classic';
  },

  setAppTheme(theme: string): void {
    localStorage.setItem(STORAGE_KEYS.APP_THEME, theme);
  },

  getSyncAccent(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.SYNC_ACCENT);
    return val !== null ? val === 'true' : true;
  },

  setSyncAccent(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_ACCENT, enabled.toString());
  },

  getVolume(): number {
    const val = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return val !== null ? parseFloat(val) : 0.8;
  },

  setVolume(volume: number): void {
    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
  },

  getAudioQuality(): AudioQuality {
    return (localStorage.getItem(STORAGE_KEYS.AUDIO_QUALITY) as AudioQuality) || '320kbps';
  },

  setAudioQuality(quality: AudioQuality): void {
    localStorage.setItem(STORAGE_KEYS.AUDIO_QUALITY, quality);
  },

  getAutoplay(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTOPLAY);
    return val !== null ? val === 'true' : true;
  },

  setAutoplay(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTOPLAY, enabled.toString());
  },

  // Persistent Player Playback State (survives refresh / PWA background reload)
  getPlayerState(): SavedPlayerState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYER_STATE);
      if (!data) return null;
      const parsed: SavedPlayerState = JSON.parse(data);
      if (!parsed || !parsed.currentTrack) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  setPlayerState(state: Partial<SavedPlayerState>): void {
    try {
      const current = this.getPlayerState() || {
        currentTrack: null,
        queue: [],
        originalQueue: [],
        queueIndex: -1,
        currentTime: 0,
        duration: 0,
        repeatMode: 'off',
        isShuffled: false,
        savedAt: Date.now()
      };
      const merged: SavedPlayerState = {
        ...current,
        ...state,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.PLAYER_STATE, JSON.stringify(merged));
    } catch {
      // Storage full or private mode
    }
  },

  clearPlayerState(): void {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_STATE);
  },

  // Export / Import / Clear Data
  exportAllData(): string {
    const data = {
      favorites: this.getFavorites(),
      playlists: this.getPlaylists(),
      recentlyPlayed: this.getRecentlyPlayed(),
      searchHistory: this.getSearchHistory(),
      theme: this.getTheme(),
      volume: this.getVolume(),
      quality: this.getAudioQuality(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.favorites && Array.isArray(data.favorites)) this.setFavorites(data.favorites);
      if (data.playlists && Array.isArray(data.playlists)) this.setPlaylists(data.playlists);
      if (data.recentlyPlayed && Array.isArray(data.recentlyPlayed)) {
        localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(data.recentlyPlayed));
      }
      if (data.searchHistory && Array.isArray(data.searchHistory)) {
        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(data.searchHistory));
      }
      if (data.theme) this.setTheme(data.theme);
      return true;
    } catch (e) {
      console.error('Failed to import user data', e);
      return false;
    }
  },

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // PWA Install Count
  getPWAInstallCount(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_COUNT);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  incrementPWAInstallCount(): number {
    const next = this.getPWAInstallCount() + 1;
    try {
      localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_COUNT, next.toString());
    } catch (e) {
      console.error('Failed to save PWA install count', e);
    }
    return next;
  }
};
