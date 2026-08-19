import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Track, Playlist } from '../api/types';
import { storage } from '../utils/storage';

interface LibraryContextType {
  favorites: Track[];
  playlists: Playlist[];
  recentlyPlayed: Track[];
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => boolean;
  createPlaylist: (title: string, description?: string) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => boolean;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  addRecentlyPlayed: (track: Track) => void;
  clearRecentlyPlayed: () => void;
  clearFavorites: () => void;
  refreshLibrary: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);

  const refreshLibrary = useCallback(() => {
    setFavorites(storage.getFavorites());
    setPlaylists(storage.getPlaylists());
    setRecentlyPlayed(storage.getRecentlyPlayed());
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const isFavorite = useCallback((trackId: string): boolean => {
    return favorites.some(t => t.id === trackId);
  }, [favorites]);

  const toggleFavorite = useCallback((track: Track): boolean => {
    const isNowFav = storage.toggleFavorite(track);
    setFavorites(storage.getFavorites());
    return isNowFav;
  }, []);

  const createPlaylist = useCallback((title: string, description: string = ''): Playlist => {
    const newPl = storage.createPlaylist(title, description);
    setPlaylists(storage.getPlaylists());
    return newPl;
  }, []);

  const updatePlaylist = useCallback((id: string, updates: Partial<Playlist>) => {
    storage.updatePlaylist(id, updates);
    setPlaylists(storage.getPlaylists());
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    storage.deletePlaylist(id);
    setPlaylists(storage.getPlaylists());
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track): boolean => {
    const res = storage.addTrackToPlaylist(playlistId, track);
    if (res) {
      setPlaylists(storage.getPlaylists());
    }
    return res;
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    storage.removeTrackFromPlaylist(playlistId, trackId);
    setPlaylists(storage.getPlaylists());
  }, []);

  const addRecentlyPlayed = useCallback((track: Track) => {
    storage.addRecentlyPlayed(track);
    setRecentlyPlayed(storage.getRecentlyPlayed());
  }, []);

  const clearRecentlyPlayed = useCallback(() => {
    storage.clearRecentlyPlayed();
    setRecentlyPlayed([]);
  }, []);

  const clearFavorites = useCallback(() => {
    storage.setFavorites([]);
    setFavorites([]);
  }, []);

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        playlists,
        recentlyPlayed,
        isFavorite,
        toggleFavorite,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        addRecentlyPlayed,
        clearRecentlyPlayed,
        clearFavorites,
        refreshLibrary
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextType => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
