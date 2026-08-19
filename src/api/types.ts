export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  duration: number; // in seconds
  artwork: string; // high-resolution image URL
  streamUrl: string; // playable audio URL
  provider: 'saavn' | 'youtube' | 'audius' | 'jamendo' | 'curated' | 'local' | 'itunes';
  source?: 'youtube' | 'saavn' | 'audius' | 'jamendo' | 'curated' | 'local' | 'itunes';
  hasLyrics?: boolean;
  lyrics?: string;
  releaseYear?: string;
  genre?: string;
  bitrate?: string;
  quality?: string;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  bio?: string;
  followerCount?: number;
  monthlyListeners?: string;
  genres?: string[];
  topTracks: Track[];
  albums: Album[];
  singles?: Album[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  artwork: string;
  releaseYear?: string;
  trackCount?: number;
  tracks: Track[];
  genre?: string;
  description?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  artwork: string;
  trackCount: number;
  tracks: Track[];
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface GenreCategory {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  bgImage?: string;
  query: string;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type ThemeMode = 'dark' | 'light' | 'system';
export type AudioQuality = '96kbps' | '160kbps' | '320kbps';
