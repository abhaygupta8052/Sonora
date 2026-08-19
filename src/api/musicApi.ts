import CryptoJS from 'crypto-js';
import { Track, Artist, Album, Playlist, SearchResults } from './types';
import { FEATURED_TRACKS, CURATED_PLAYLISTS, FEATURED_ARTISTS } from './curatedData';
import { ytMusicService } from '../services/ytmusic';

// ─── API Endpoints ──────────────────────────────────────────────────────────
// Use our own Vercel serverless proxy to avoid CORS on production.
// Falls back to public community mirrors if /api/saavn is not available (e.g. local dev).
const SAAVN_PROXY = '/api/saavn';        // Vercel serverless function (no CORS)
const DES_KEY = '38346591';             // Standard JioSaavn media decryption key

// Community-hosted Saavn REST mirrors (fallback)
const BACKUP_ENDPOINTS = [
  'https://saavn-api-eight.vercel.app/api',
  'https://saavn.dev/api',
  'https://saavn.me/api',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely stringify anything that might be an object or array */
function safeString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    // e.g. primary_artists is sometimes [{id, name, role}, ...]
    return value.map((v: any) => v?.name || v?.title || String(v)).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, any>;
    return obj.name || obj.title || obj.text || JSON.stringify(obj);
  }
  return String(value);
}

/** Decode HTML entities in titles / artist names */
function decodeHtml(html: string): string {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");
}

/**
 * Generate a normalized deduplication key for a track.
 * Strips movie descriptors like (From "Movie"), (Audio), (Official Video), punctuation, and casing.
 */
export function getSongDedupKey(track: Track): string {
  if (!track || !track.title) return '';

  // 1. Clean title: remove descriptors in brackets
  const cleanTitle = track.title
    .toLowerCase()
    .replace(/\((from|video|audio|official|lyrics|hd|4k|remix|slowed|reverb|full song|original)[^)]*\)/gi, '')
    .replace(/\[(from|video|audio|official|lyrics|hd|4k|remix|slowed|reverb|full song|original)[^\]]*\]/gi, '')
    .replace(/[^\w\s\u0900-\u097F]/g, '') // keep letters, numbers, devanagari hindi letters
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Clean artist: extract primary artist
  const cleanArtist = (track.artist || '')
    .toLowerCase()
    .split(',')[0]
    .split('&')[0]
    .replace(/[^\w\s\u0900-\u097F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `${cleanTitle}::${cleanArtist}`;
}

/**
 * Deduplicates an array of tracks.
 * When duplicates are encountered (same normalized title + artist), gives priority to:
 * 1. Official JioSaavn 320kbps streams over YouTube
 * 2. Higher resolution artwork
 * 3. Valid duration metadata
 */
export function deduplicateTracks(tracks: Track[]): Track[] {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  const seenIds = new Set<string>();
  const keyMap = new Map<string, Track>();
  const orderedKeys: string[] = [];

  for (const track of tracks) {
    if (!track || !track.title || !track.streamUrl) continue;

    // Check exact ID duplicate first
    if (seenIds.has(track.id)) continue;
    seenIds.add(track.id);

    const key = getSongDedupKey(track);
    if (!key) {
      orderedKeys.push(track.id);
      keyMap.set(track.id, track);
      continue;
    }

    if (!keyMap.has(key)) {
      keyMap.set(key, track);
      orderedKeys.push(key);
    } else {
      // Duplicate found! Prioritize higher quality track
      const existing = keyMap.get(key)!;
      const existingScore =
        (existing.provider === 'saavn' ? 10 : 0) +
        (existing.artwork && !existing.artwork.includes('unsplash') ? 5 : 0) +
        (existing.duration > 0 ? 2 : 0);

      const newScore =
        (track.provider === 'saavn' ? 10 : 0) +
        (track.artwork && !track.artwork.includes('unsplash') ? 5 : 0) +
        (track.duration > 0 ? 2 : 0);

      if (newScore > existingScore) {
        keyMap.set(key, track); // Replace with higher priority version
      }
    }
  }

  return orderedKeys.map((k) => keyMap.get(k)!).filter(Boolean);
}

/** Decrypt official JioSaavn encrypted_media_url → direct streaming URL */
function decryptMediaUrl(encryptedUrl: string, quality: '320kbps' | '160kbps' | '96kbps' = '320kbps'): string {
  if (!encryptedUrl) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse(DES_KEY);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl),
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);

    if (!decrypted || !decrypted.startsWith('http')) return '';

    if (quality === '320kbps') return decrypted.replace(/_96\.mp4|_160\.mp4/g, '_320.mp4');
    if (quality === '160kbps') return decrypted.replace(/_96\.mp4|_320\.mp4/g, '_160.mp4');
    return decrypted;
  } catch {
    return '';
  }
}

/** Normalize a raw official JioSaavn song item → Track */
function normalizeOfficialSong(item: any): Track {
  let streamUrl = '';
  if (item.encrypted_media_url) {
    streamUrl = decryptMediaUrl(item.encrypted_media_url, '320kbps');
  } else if (item.media_preview_url) {
    streamUrl = item.media_preview_url
      .replace('preview.saavncdn.com', 'aac.saavncdn.com')
      .replace('_96_p.mp4', '_320.mp4');
  }

  // Artwork — upgrade resolution
  let rawImage: any = item.image || item.artwork || '';
  if (typeof rawImage === 'string') {
    rawImage = rawImage.replace('150x150', '500x500').replace('50x50', '500x500');
  } else if (Array.isArray(rawImage) && rawImage.length > 0) {
    rawImage = rawImage[rawImage.length - 1]?.url || rawImage[0]?.url || '';
  } else {
    rawImage = '';
  }
  const artwork = rawImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  // Artist — always a plain string (fixes React error #31)
  const rawArtist = item.primary_artists ?? item.singers ?? item.music ?? item.artist ?? 'Unknown Artist';
  const artistName = decodeHtml(safeString(rawArtist));

  return {
    id: item.id || `track-${Math.random().toString(36).substring(2, 9)}`,
    title: decodeHtml(safeString(item.song || item.name || item.title || 'Untitled Song')),
    artist: artistName,
    artistId: safeString(item.primary_artists_id || item.artistId || item.more_info?.artist_map?.primary_artists?.[0]?.id),
    album: decodeHtml(safeString(item.album || item.more_info?.album || 'Single')),
    albumId: safeString(item.albumid || item.album_id || item.more_info?.album_id),
    duration: parseInt(item.duration, 10) || 180,
    artwork,
    streamUrl,
    provider: 'saavn',
    releaseYear: safeString(item.year || item.more_info?.year || '2024'),
    genre: safeString(item.language || item.more_info?.language || 'Bollywood'),
  };
}

/** Normalize a Saavn community proxy track (saavn.dev / sumit API) → Track */
function normalizeProxyTrack(item: any): Track {
  const downloadUrl = item.downloadUrl || item.media_url || item.url || [];
  let streamUrl = '';

  if (Array.isArray(downloadUrl) && downloadUrl.length > 0) {
    const highQ =
      downloadUrl.find((u: any) => u.quality === '320kbps') ||
      downloadUrl.find((u: any) => u.quality === '160kbps') ||
      downloadUrl[downloadUrl.length - 1];
    streamUrl = highQ?.url || highQ?.link || '';
  } else if (typeof downloadUrl === 'string') {
    streamUrl = downloadUrl;
  }

  const images = item.image || item.images || [];
  let artwork = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
  if (Array.isArray(images) && images.length > 0) {
    const highImg = images.find((img: any) => img.quality === '500x500') || images[images.length - 1];
    artwork = highImg?.url || highImg?.link || artwork;
  } else if (typeof images === 'string' && images.length > 0) {
    artwork = images.replace('150x150', '500x500').replace('50x50', '500x500');
  }

  const rawArtist = (() => {
    if (item.artists?.primary?.length > 0) return item.artists.primary.map((a: any) => a.name).join(', ');
    if (typeof item.primaryArtists === 'string') return item.primaryArtists;
    if (typeof item.artist === 'string') return item.artist;
    return 'Unknown Artist';
  })();

  return {
    id: item.id || `track-${Math.random().toString(36).substring(2, 9)}`,
    title: decodeHtml(safeString(item.name || item.title || item.song || 'Untitled Song')),
    artist: decodeHtml(rawArtist),
    artistId: safeString(item.primaryArtistsId || item.artistId || item.artists?.primary?.[0]?.id),
    album: decodeHtml(safeString(item.album?.name || item.album || 'Single')),
    albumId: safeString(item.album?.id || item.albumId),
    duration: parseInt(item.duration, 10) || 180,
    artwork,
    streamUrl,
    provider: 'saavn',
    releaseYear: safeString(item.year || item.releaseDate?.substring(0, 4) || '2024'),
    genre: safeString(item.language || 'Music'),
  };
}

// ─── Core JioSaavn search via proxy ─────────────────────────────────────────

async function searchSaavn(trimmed: string): Promise<{ tracks: Track[]; artists: Artist[]; albums: Album[]; playlists: Playlist[] }> {
  // 1. Try our own /api/saavn Vercel proxy (CORS-safe)
  try {
    const params = `?__call=search.getResults&_format=json&p=1&n=25&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        const rawTracks = data.results.map(normalizeOfficialSong).filter((t: Track) => !!t.streamUrl);
        const tracks = deduplicateTracks(rawTracks);
        if (tracks.length > 0) {
          // Autocomplete for artists / albums
          let artists: Artist[] = [];
          let albums: Album[] = [];
          let playlists: Playlist[] = [];
          try {
            const autoParams = `?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(trimmed)}`;
            const autoRes = await fetch(`${SAAVN_PROXY}${autoParams}`, { signal: AbortSignal.timeout(4000) });
            if (autoRes.ok) {
              const autoData = await autoRes.json();
              if (autoData?.artists?.data) {
                artists = autoData.artists.data.map((a: any): Artist => ({
                  id: safeString(a.id || a.title),
                  name: decodeHtml(safeString(a.title || a.name)),
                  image: (safeString(a.image)).replace('50x50', '500x500'),
                  followerCount: 150000,
                  monthlyListeners: '2.5M',
                  genres: ['Bollywood', 'Popular'],
                  topTracks: [],
                  albums: [],
                }));
              }
              if (autoData?.albums?.data) {
                albums = autoData.albums.data.map((al: any): Album => ({
                  id: safeString(al.id),
                  title: decodeHtml(safeString(al.title)),
                  artist: decodeHtml(safeString(al.music || al.artist || 'Various Artists')),
                  artwork: (safeString(al.image)).replace('50x50', '500x500'),
                  releaseYear: safeString(al.year || '2024'),
                  trackCount: 5,
                  tracks: [],
                }));
              }
              if (autoData?.playlists?.data) {
                playlists = autoData.playlists.data.map((p: any): Playlist => ({
                  id: safeString(p.id),
                  title: decodeHtml(safeString(p.title)),
                  description: 'Curated Playlist',
                  artwork: (safeString(p.image)).replace('50x50', '500x500'),
                  trackCount: 10,
                  tracks: [],
                }));
              }
            }
          } catch { /* non-critical */ }
          return { tracks, artists, albums, playlists };
        }
      }
    }
  } catch (e) {
    console.warn('Saavn proxy search failed, trying community mirrors...', e);
  }

  // 2. Community mirrors
  for (const endpoint of BACKUP_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(trimmed)}&limit=25`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const resultsList = data?.data?.results || data?.results || [];
        if (Array.isArray(resultsList) && resultsList.length > 0) {
          const rawTracks = resultsList.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
          const tracks = deduplicateTracks(rawTracks);
          if (tracks.length > 0) return { tracks, artists: [], albums: [], playlists: [] };
        }
      }
    } catch { /* try next */ }
  }

  return { tracks: [], artists: [], albums: [], playlists: [] };
}

async function trendingSaavn(query: string): Promise<Track[]> {
  const currentYear = new Date().getFullYear();
  const randomPage = Math.floor(Math.random() * 2) + 1; // page 1 or 2 to rotate on refresh
  const dynamicQuery = query.includes(String(currentYear)) ? query : `${query} ${currentYear}`;

  // 1. Try our own Vercel proxy first
  try {
    const params = `?__call=search.getResults&_format=json&p=${randomPage}&n=30&q=${encodeURIComponent(dynamicQuery)}`;
    const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        const rawTracks = data.results.map(normalizeOfficialSong).filter((t: Track) => !!t.streamUrl);
        const tracks = deduplicateTracks(rawTracks);
        if (tracks.length > 0) return tracks;
      }
    }
  } catch (e) {
    console.warn('Saavn proxy trending failed, trying mirrors...', e);
  }

  // Community mirrors
  for (const endpoint of BACKUP_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(dynamicQuery)}&page=${randomPage}&limit=30`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const list = data?.data?.results || data?.results || [];
        const rawTracks = list.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
        const tracks = deduplicateTracks(rawTracks);
        if (tracks.length > 0) return tracks;
      }
    } catch { /* next */ }
  }

  return [];
}

/**
 * Fetch all songs by a specific artist name — fetches multiple pages to get more results.
 * Used by ArtistPage to build a complete song list.
 */
async function fetchAllArtistSongs(artistName: string): Promise<Track[]> {
  const allTracks: Track[] = [];

  // Fetch 3 pages from proxy in parallel for speed
  try {
    const pagePromises = [1, 2, 3].map(async (page) => {
      const params = `?__call=search.getResults&_format=json&p=${page}&n=25&q=${encodeURIComponent(artistName)}`;
      const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          return data.results.map(normalizeOfficialSong).filter((t: Track) => !!t.streamUrl);
        }
      }
      return [] as Track[];
    });
    const pages = await Promise.allSettled(pagePromises);
    for (const p of pages) {
      if (p.status === 'fulfilled') {
        allTracks.push(...p.value);
      }
    }
    const deduped = deduplicateTracks(allTracks);
    if (deduped.length > 0) return deduped;
  } catch (e) {
    console.warn('Multi-page artist search failed, trying mirrors...', e);
  }

  // Fallback: community mirrors with higher limit
  for (const endpoint of BACKUP_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(artistName)}&limit=50`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        const list = data?.data?.results || data?.results || [];
        const rawTracks = list.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
        const deduped = deduplicateTracks(rawTracks);
        if (deduped.length > 0) return deduped;
      }
    } catch { /* next */ }
  }

  return [];
}

/**
 * Fetch real artist image from JioSaavn artist search API.
 * Returns high-res Saavn CDN image URL or null.
 */
async function fetchArtistRealImage(artistName: string): Promise<string | null> {
  // 1. JioSaavn artist search (official artist photo from Saavn CDN)
  try {
    const params = `?__call=search.getArtistResults&_format=json&n=5&q=${encodeURIComponent(artistName)}`;
    const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const results: any[] = data?.results || data?.data || [];
      for (const r of results) {
        const name: string = safeString(r?.title || r?.name || '');
        if (name.toLowerCase().includes(artistName.toLowerCase().split(' ')[0])) {
          const img = safeString(r?.image || r?.picture || '');
          if (img) return img.replace('50x50', '500x500').replace('150x150', '500x500');
        }
      }
    }
  } catch { /* ignore */ }

  // 2. Community mirror artist search
  for (const endpoint of BACKUP_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}/search/artists?query=${encodeURIComponent(artistName)}&limit=3`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const list: any[] = data?.data?.results || data?.results || [];
        if (list.length > 0) {
          const img = safeString(
            list[0]?.image?.[2]?.link ||
            list[0]?.image?.[1]?.link ||
            list[0]?.image?.[0]?.link ||
            list[0]?.image || ''
          );
          if (img) return img;
        }
      }
    } catch { /* next */ }
  }

  return null;
}

/**
 * Extract artist image from the first song whose artist matches the search name.
 */
function extractArtistImageFromSongs(songs: Track[], artistName: string): string | null {
  const firstName = artistName.toLowerCase().split(' ')[0];
  for (const s of songs) {
    if (s.artwork && String(s.artist).toLowerCase().includes(firstName)) {
      return s.artwork;
    }
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const musicApi = {
  /**
   * Search across JioSaavn + YouTube Music (as fallback).
   * - Primary: JioSaavn proxy + community mirrors (deduplicated)
   * - Fallback: YouTube Music discovery (Piped/Invidious)
   * - Final fallback: curated static data
   */
  async search(query: string): Promise<SearchResults> {
    if (!query?.trim()) return { tracks: [], artists: [], albums: [], playlists: [] };
    const trimmed = query.trim();

    // Run JioSaavn + YouTube Music discovery in parallel
    const [saavnResult, ytTracks] = await Promise.all([
      searchSaavn(trimmed),
      ytMusicService.search(trimmed).catch(() => [] as Track[]),
    ]);

    // Merge: JioSaavn first, YouTube fills gaps, then apply deduplication
    const rawCombined: Track[] = [...saavnResult.tracks, ...ytTracks];
    const combined = deduplicateTracks(rawCombined);

    if (combined.length > 0) {
      return {
        tracks: combined,
        artists: saavnResult.artists.length > 0 ? saavnResult.artists : FEATURED_ARTISTS.slice(0, 5),
        albums: saavnResult.albums,
        playlists: saavnResult.playlists.length > 0 ? saavnResult.playlists : CURATED_PLAYLISTS,
      };
    }

    // Final fallback — static curated data filtered by query
    const qLower = trimmed.toLowerCase();
    const filtered = FEATURED_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(qLower) ||
        t.artist.toLowerCase().includes(qLower) ||
        (t.genre && t.genre.toLowerCase().includes(qLower))
    );
    return {
      tracks: filtered.length > 0 ? deduplicateTracks(filtered) : FEATURED_TRACKS,
      artists: FEATURED_ARTISTS,
      albums: [],
      playlists: CURATED_PLAYLISTS,
    };
  },

  /** Get trending songs by genre/language query */
  async getTrending(query = 'Top Bollywood Hindi Hits 2024'): Promise<Track[]> {
    // Try JioSaavn first, YouTube as fallback
    const saavnTracks = await trendingSaavn(query);
    if (saavnTracks.length > 0) return deduplicateTracks(saavnTracks);

    // YouTube Music fallback for trending
    try {
      const ytTracks = await ytMusicService.search(query);
      if (ytTracks.length > 0) return deduplicateTracks(ytTracks);
    } catch { /* ignore */ }

    return FEATURED_TRACKS;
  },

  async getNewReleases(): Promise<Track[]> {
    return this.getTrending('Latest Hindi Punjabi New Releases 2024');
  },

  async getByGenre(genreQuery: string): Promise<Track[]> {
    return this.getTrending(genreQuery);
  },

  async getArtistDetails(id: string): Promise<Artist | null> {
    const artistName = decodeURIComponent(id).trim();
    // Check local curated first (for bio, genres etc)
    const local = FEATURED_ARTISTS.find(
      (a) => a.id === artistName || a.name.toLowerCase() === artistName.toLowerCase()
    );

    // Fetch songs (multi-page) + real artist image in parallel
    const [rawSongs, realImage] = await Promise.all([
      fetchAllArtistSongs(artistName),
      fetchArtistRealImage(artistName),
    ]);

    const songs = deduplicateTracks(rawSongs);

    // Best image: real API image > local curated > song artwork fallback > avatar API
    const artistImage =
      realImage ||
      local?.image ||
      extractArtistImageFromSongs(songs, artistName) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&size=400&background=7c3aed&color=fff&bold=true&format=svg`;

    return {
      id: artistName,
      name: local?.name || decodeHtml(artistName),
      image: artistImage,
      bio: local?.bio || `Explore all songs, hits and discography by ${artistName}.`,
      followerCount: local?.followerCount || 500000,
      monthlyListeners: local?.monthlyListeners || '1.2M',
      genres: local?.genres || ['Bollywood', 'Popular'],
      topTracks: songs.length > 0 ? songs : (local?.topTracks || []),
      albums: local?.albums || [],
    };
  },

  /** Public method to get all songs by artist name (multi-page) */
  async getArtistSongs(artistName: string): Promise<Track[]> {
    const songs = await fetchAllArtistSongs(artistName);
    return deduplicateTracks(songs);
  },

  async getAlbumDetails(id: string): Promise<Album | null> {
    try {
      const songs = await this.getTrending(id);
      const deduped = deduplicateTracks(songs);
      if (deduped.length > 0) {
        return {
          id,
          title: decodeHtml(safeString(deduped[0].album || id)),
          artist: deduped[0].artist,
          artistId: deduped[0].artistId,
          artwork: deduped[0].artwork,
          releaseYear: deduped[0].releaseYear || '2024',
          trackCount: deduped.length,
          tracks: deduped,
          genre: deduped[0].genre,
        };
      }
    } catch { /* ignore */ }
    return null;
  },

  async getPlaylistDetails(id: string): Promise<Playlist | null> {
    const local = CURATED_PLAYLISTS.find((p) => p.id === id);
    if (local) return local;
    try {
      const songs = await this.getTrending(id);
      const deduped = deduplicateTracks(songs);
      return {
        id,
        title: decodeHtml(id.replace(/[-_]/g, ' ')),
        description: 'Curated Music Stream',
        artwork: deduped[0]?.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        trackCount: deduped.length,
        tracks: deduped,
      };
    } catch { /* ignore */ }
    return CURATED_PLAYLISTS[0];
  },
};
