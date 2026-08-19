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
        const tracks = data.results.map(normalizeOfficialSong).filter((t: Track) => !!t.streamUrl);
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
          const tracks = resultsList.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
          if (tracks.length > 0) return { tracks, artists: [], albums: [], playlists: [] };
        }
      }
    } catch { /* try next */ }
  }

  return { tracks: [], artists: [], albums: [], playlists: [] };
}

async function trendingSaavn(query: string): Promise<Track[]> {
  // Try proxy first
  try {
    const params = `?__call=search.getResults&_format=json&p=1&n=25&q=${encodeURIComponent(query)}`;
    const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        const tracks = data.results.map(normalizeOfficialSong).filter((t: Track) => !!t.streamUrl);
        if (tracks.length > 0) return tracks;
      }
    }
  } catch (e) {
    console.warn('Saavn proxy trending failed, trying mirrors...', e);
  }

  // Community mirrors
  for (const endpoint of BACKUP_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(query)}&limit=20`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const list = data?.data?.results || data?.results || [];
        const tracks = list.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
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
  const seenIds = new Set<string>();

  const addTracks = (tracks: Track[]) => {
    for (const t of tracks) {
      if (!seenIds.has(t.id) && t.streamUrl) {
        seenIds.add(t.id);
        allTracks.push(t);
      }
    }
  };

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
      if (p.status === 'fulfilled') addTracks(p.value);
    }
    if (allTracks.length > 0) return allTracks;
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
        const tracks = list.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
        if (tracks.length > 0) return tracks;
      }
    } catch { /* next */ }
  }

  return [];
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const musicApi = {
  /**
   * Search across JioSaavn + YouTube Music (as fallback).
   * - Primary: JioSaavn proxy + community mirrors
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

    // Merge: JioSaavn first, YouTube fills gaps
    const combined: Track[] = [...saavnResult.tracks];
    const seenTitles = new Set(saavnResult.tracks.map((t) => t.title.toLowerCase().trim()));

    for (const yt of ytTracks) {
      const lower = yt.title.toLowerCase().trim();
      if (!seenTitles.has(lower)) {
        seenTitles.add(lower);
        combined.push(yt);
      }
    }

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
      tracks: filtered.length > 0 ? filtered : FEATURED_TRACKS,
      artists: FEATURED_ARTISTS,
      albums: [],
      playlists: CURATED_PLAYLISTS,
    };
  },

  /** Get trending songs by genre/language query */
  async getTrending(query = 'Top Bollywood Hindi Hits 2024'): Promise<Track[]> {
    // Try JioSaavn first, YouTube as fallback
    const saavnTracks = await trendingSaavn(query);
    if (saavnTracks.length > 0) return saavnTracks;

    // YouTube Music fallback for trending
    try {
      const ytTracks = await ytMusicService.search(query);
      if (ytTracks.length > 0) return ytTracks;
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
    // Check local curated first
    const local = FEATURED_ARTISTS.find((a) => a.id === artistName || a.name.toLowerCase() === artistName.toLowerCase());
    // Fetch all songs (multi-page) regardless, to get real data
    const songs = await fetchAllArtistSongs(artistName);

    // Derive artist image from first song artwork (real API data)
    // or use local curated image if available
    const artistImage = local?.image ||
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
    return fetchAllArtistSongs(artistName);
  },

  async getAlbumDetails(id: string): Promise<Album | null> {
    try {
      const songs = await this.getTrending(id);
      if (songs.length > 0) {
        return {
          id,
          title: decodeHtml(safeString(songs[0].album || id)),
          artist: songs[0].artist,
          artistId: songs[0].artistId,
          artwork: songs[0].artwork,
          releaseYear: songs[0].releaseYear || '2024',
          trackCount: songs.length,
          tracks: songs,
          genre: songs[0].genre,
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
      return {
        id,
        title: decodeHtml(id.replace(/[-_]/g, ' ')),
        description: 'Curated Music Stream',
        artwork: songs[0]?.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        trackCount: songs.length,
        tracks: songs,
      };
    } catch { /* ignore */ }
    return CURATED_PLAYLISTS[0];
  },
};
