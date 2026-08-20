import CryptoJS from 'crypto-js';
import { Track, Artist, Album, Playlist, SearchResults } from './types';
import { FEATURED_TRACKS, CURATED_PLAYLISTS, FEATURED_ARTISTS } from './curatedData';
import { ytMusicService } from '../services/ytmusic';
import { detectMood, getMoodById, MoodDefinition } from '../utils/moodData';

// ─── API Endpoints ──────────────────────────────────────────────────────────
const SAAVN_PROXY = '/api/saavn'; // Vercel serverless function (no CORS)
const DES_KEY = '38346591'; // Standard JioSaavn media decryption key

// Community-hosted Saavn REST mirrors (fallback)
const BACKUP_ENDPOINTS = [
  'https://saavn-api-eight.vercel.app/api',
  'https://saavn.me/api',
  'https://jiosaavn-api-privateindexer.vercel.app/api',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely stringify anything that might be an object, array, number, null or undefined */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v: any) => {
        if (typeof v === 'string') return v;
        if (typeof v === 'object' && v !== null) {
          return String(v.name || v.title || v.text || v.artist || v.artistName || '');
        }
        return String(v || '');
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, any>;
    return String(obj.name || obj.title || obj.text || obj.artist || obj.artistName || '');
  }
  return String(value);
}

/** Decode HTML entities in titles / artist names */
export function decodeHtml(html: string): string {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = String(html);
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
 */
export function getSongDedupKey(track: Track): string {
  if (!track) return '';

  const rawTitle = safeString(track.title);
  if (!rawTitle) return '';

  const cleanTitle = rawTitle
    .toLowerCase()
    .replace(/\((from|video|audio|official|lyrics|hd|4k|remix|slowed|reverb|full song|original)[^)]*\)/gi, '')
    .replace(/\[(from|video|audio|official|lyrics|hd|4k|remix|slowed|reverb|full song|original)[^\]]*\]/gi, '')
    .replace(/[^\w\s\u0900-\u097F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanArtist = safeString(track.artist)
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
 */
export function deduplicateTracks(tracks: Track[]): Track[] {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  const seenIds = new Set<string>();
  const keyMap = new Map<string, Track>();
  const orderedKeys: string[] = [];

  for (const track of tracks) {
    if (!track) continue;
    const trackId = safeString(track.id);
    if (!trackId) continue;

    if (seenIds.has(trackId)) continue;
    seenIds.add(trackId);

    const key = getSongDedupKey(track);
    if (!key) {
      orderedKeys.push(trackId);
      keyMap.set(trackId, track);
      continue;
    }

    if (!keyMap.has(key)) {
      keyMap.set(key, track);
      orderedKeys.push(key);
    } else {
      const existing = keyMap.get(key)!;
      const existingScore =
        (existing.provider === 'saavn' ? 10 : 0) +
        (existing.artwork && !existing.artwork.includes('unsplash') ? 5 : 0) +
        (existing.duration > 0 ? 2 : 0) +
        (existing.streamUrl && !existing.streamUrl.includes('preview') ? 10 : 0);

      const newScore =
        (track.provider === 'saavn' ? 10 : 0) +
        (track.artwork && !track.artwork.includes('unsplash') ? 5 : 0) +
        (track.duration > 0 ? 2 : 0) +
        (track.streamUrl && !track.streamUrl.includes('preview') ? 10 : 0);

      if (newScore > existingScore) {
        keyMap.set(key, track);
      }
    }
  }

  return orderedKeys.map((k) => keyMap.get(k)!).filter(Boolean);
}

/** Decrypt official JioSaavn encrypted_media_url → direct streaming URL */
function decryptMediaUrl(encryptedUrl: string, quality: '320kbps' | '160kbps' | '96kbps' = '320kbps'): string {
  if (!encryptedUrl || typeof encryptedUrl !== 'string') return '';
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
  const moreInfo = (typeof item.more_info === 'object' && item.more_info) ? item.more_info : {};
  let streamUrl = '';

  const encUrl = item.encrypted_media_url || moreInfo.encrypted_media_url || item.encrypted_url || moreInfo.encrypted_url;
  if (encUrl && typeof encUrl === 'string') {
    streamUrl = decryptMediaUrl(encUrl, '320kbps');
  }

  if (!streamUrl) {
    const preview = item.media_preview_url || moreInfo.media_preview_url || item.preview_url;
    if (preview && typeof preview === 'string') {
      // Only use preview URL if it resolves to the full CDN domain (not the clip preview domain)
      if (!preview.includes('preview.saavncdn.com')) {
        streamUrl = preview
          .replace('_96_p.mp4', '_320.mp4')
          .replace('_96.mp4', '_320.mp4');
      }
      // preview.saavncdn.com URLs are 30-second clips — leave streamUrl empty so resolvePlayable upgrades them
    }
  }

  // Artwork
  let rawImage: any = item.image || moreInfo.image || item.artwork || '';
  if (typeof rawImage === 'string') {
    rawImage = rawImage.replace('150x150', '500x500').replace('50x50', '500x500');
  } else if (Array.isArray(rawImage) && rawImage.length > 0) {
    rawImage = rawImage[rawImage.length - 1]?.url || rawImage[0]?.url || '';
  } else {
    rawImage = '';
  }
  const artwork = safeString(rawImage) || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  // Artist — guaranteed primitive string!
  const rawArtist =
    item.primary_artists ??
    moreInfo.primary_artists ??
    moreInfo.artistMap?.primary_artists ??
    moreInfo.music ??
    item.singers ??
    moreInfo.singers ??
    item.music ??
    item.artist ??
    'Unknown Artist';
  const artistName = decodeHtml(safeString(rawArtist)) || 'Unknown Artist';

  const title = decodeHtml(safeString(item.song || item.name || item.title || moreInfo.song || 'Untitled Song')) || 'Untitled Song';

  return {
    id: safeString(item.id) || `track-${Math.random().toString(36).substring(2, 9)}`,
    title,
    artist: artistName,
    artistId: safeString(item.primary_artists_id || moreInfo.primary_artists_id || item.artistId || moreInfo.artistMap?.primary_artists?.[0]?.id),
    album: decodeHtml(safeString(item.album || moreInfo.album || 'Single')),
    albumId: safeString(item.albumid || item.album_id || moreInfo.album_id),
    duration: parseInt(item.duration || moreInfo.duration, 10) || 180,
    artwork,
    streamUrl,
    provider: 'saavn',
    releaseYear: safeString(item.year || moreInfo.year || '2024'),
    genre: safeString(item.language || moreInfo.language || 'Bollywood'),
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
    streamUrl = safeString(highQ?.url || highQ?.link || '');
  } else if (typeof downloadUrl === 'string') {
    streamUrl = downloadUrl;
  }

  const images = item.image || item.images || [];
  let artwork = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
  if (Array.isArray(images) && images.length > 0) {
    const highImg = images.find((img: any) => img.quality === '500x500') || images[images.length - 1];
    artwork = safeString(highImg?.url || highImg?.link || artwork);
  } else if (typeof images === 'string' && images.length > 0) {
    artwork = images.replace('150x150', '500x500').replace('50x50', '500x500');
  }

  const rawArtist =
    item.artists?.primary ??
    item.primaryArtists ??
    item.artist ??
    item.singers ??
    'Unknown Artist';

  return {
    id: safeString(item.id) || `track-${Math.random().toString(36).substring(2, 9)}`,
    title: decodeHtml(safeString(item.name || item.title || item.song || 'Untitled Song')),
    artist: decodeHtml(safeString(rawArtist)) || 'Unknown Artist',
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

// ─── iTunes Global Fallback Discovery ────────────────────────────────────────

async function searchItunes(query: string): Promise<Track[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((item: any): Track => {
          const artwork = safeString((item.artworkUrl100 || '')).replace('100x100bb', '600x600bb');
          return {
            id: `itunes_${item.trackId}`,
            title: decodeHtml(safeString(item.trackName || item.collectionName || 'Song')),
            artist: decodeHtml(safeString(item.artistName || 'Unknown Artist')) || 'Unknown Artist',
            artistId: safeString(item.artistId),
            album: decodeHtml(safeString(item.collectionName || 'Single')),
            albumId: safeString(item.collectionId),
            duration: Math.round((item.trackTimeMillis || 180000) / 1000),
            artwork: artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
            // iTunes previewUrl is only a 30-second clip — intentionally leave streamUrl empty
            // so resolvePlayable() always fetches the full JioSaavn stream for this track.
            streamUrl: '',
            provider: 'saavn',
            source: 'itunes',
            releaseYear: safeString(item.releaseDate ? item.releaseDate.substring(0, 4) : '2024'),
            genre: safeString(item.primaryGenreName || 'Music'),
          };
        });
      }
    }
  } catch (e) {
    console.warn('iTunes fallback search failed', e);
  }
  return [];
}

// ─── Core JioSaavn search via proxy ─────────────────────────────────────────

async function searchSaavn(trimmed: string): Promise<{ tracks: Track[]; artists: Artist[]; albums: Album[]; playlists: Playlist[] }> {
  // 1. Try our own /api/saavn Vercel proxy (CORS-safe)
  try {
    const params = `?__call=search.getResults&_format=json&p=1&n=30&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const resultsList = data.results || data.data?.results || data.songs?.data || [];
      if (Array.isArray(resultsList) && resultsList.length > 0) {
        const rawTracks = resultsList.map(normalizeOfficialSong);
        const tracks = deduplicateTracks(rawTracks);
        if (tracks.length > 0) {
          let artists: Artist[] = [];
          let albums: Album[] = [];
          let playlists: Playlist[] = [];
          try {
            const autoParams = `?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(trimmed)}`;
            const autoRes = await fetch(`${SAAVN_PROXY}${autoParams}`, { signal: AbortSignal.timeout(4000) });
            if (autoRes.ok) {
              const autoData = await autoRes.json();
              if (autoData?.artists?.data && Array.isArray(autoData.artists.data)) {
                artists = autoData.artists.data.map((a: any): Artist => {
                  const aName = decodeHtml(safeString(a.title || a.name)) || 'Artist';
                  return {
                    id: safeString(a.id || aName),
                    name: aName,
                    image: (safeString(a.image)).replace('50x50', '500x500'),
                    followerCount: 150000,
                    monthlyListeners: '2.5M',
                    genres: ['Bollywood', 'Popular'],
                    topTracks: [],
                    albums: [],
                  };
                });
              }
              if (autoData?.albums?.data && Array.isArray(autoData.albums.data)) {
                albums = autoData.albums.data.map((al: any): Album => ({
                  id: safeString(al.id),
                  title: decodeHtml(safeString(al.title)) || 'Album',
                  artist: decodeHtml(safeString(al.music || al.artist || 'Various Artists')) || 'Various Artists',
                  artwork: (safeString(al.image)).replace('50x50', '500x500'),
                  releaseYear: safeString(al.year || '2024'),
                  trackCount: 5,
                  tracks: [],
                }));
              }
              if (autoData?.playlists?.data && Array.isArray(autoData.playlists.data)) {
                playlists = autoData.playlists.data.map((p: any): Playlist => ({
                  id: safeString(p.id),
                  title: decodeHtml(safeString(p.title)) || 'Playlist',
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
          const rawTracks = resultsList.map(normalizeProxyTrack);
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
  const randomPage = Math.floor(Math.random() * 2) + 1;
  const dynamicQuery = query.includes(String(currentYear)) ? query : `${query} ${currentYear}`;

  try {
    const params = `?__call=search.getResults&_format=json&p=${randomPage}&n=30&q=${encodeURIComponent(dynamicQuery)}`;
    const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const resultsList = data.results || data.data?.results || data.songs?.data || [];
      if (Array.isArray(resultsList) && resultsList.length > 0) {
        const rawTracks = resultsList.map(normalizeOfficialSong);
        const tracks = deduplicateTracks(rawTracks);
        if (tracks.length > 0) return tracks;
      }
    }
  } catch (e) {
    console.warn('Saavn proxy trending failed, trying mirrors...', e);
  }

  for (const endpoint of BACKUP_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(dynamicQuery)}&page=${randomPage}&limit=30`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const list = data?.data?.results || data?.results || [];
        const rawTracks = list.map(normalizeProxyTrack);
        const tracks = deduplicateTracks(rawTracks);
        if (tracks.length > 0) return tracks;
      }
    } catch { /* next */ }
  }

  return [];
}

/**
 * Fetch all songs by a specific artist name — fetches multiple pages to get more results.
 */
async function fetchAllArtistSongs(artistName: string): Promise<Track[]> {
  const allTracks: Track[] = [];

  try {
    const pagePromises = [1, 2, 3].map(async (page) => {
      const params = `?__call=search.getResults&_format=json&p=${page}&n=25&q=${encodeURIComponent(artistName)}`;
      const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const data = await res.json();
        const resultsList = data.results || data.data?.results || data.songs?.data || [];
        if (Array.isArray(resultsList)) {
          return resultsList.map(normalizeOfficialSong);
        }
      }
      return [];
    });

    const results = await Promise.all(pagePromises);
    results.forEach((tracks) => allTracks.push(...tracks));
  } catch (e) {
    console.warn('Proxy artist songs fetch failed, trying mirrors...', e);
  }

  if (allTracks.length === 0) {
    for (const endpoint of BACKUP_ENDPOINTS) {
      try {
        const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(artistName)}&limit=30`, {
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const data = await res.json();
          const list = data?.data?.results || data?.results || [];
          if (Array.isArray(list) && list.length > 0) {
            allTracks.push(...list.map(normalizeProxyTrack));
            break;
          }
        }
      } catch { /* try next */ }
    }
  }

  if (allTracks.length === 0) {
    const itunesTracks = await searchItunes(artistName);
    allTracks.push(...itunesTracks);
  }

  return deduplicateTracks(allTracks);
}

/**
 * Try to get a high-quality real artist image from JioSaavn artist autocomplete
 */
async function fetchArtistRealImage(artistName: string): Promise<string | null> {
  try {
    const params = `?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(artistName)}`;
    const res = await fetch(`${SAAVN_PROXY}${params}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const artists = data?.artists?.data;
      if (Array.isArray(artists) && artists.length > 0) {
        const exact = artists.find(
          (a: any) =>
            safeString(a.name).toLowerCase().includes(artistName.toLowerCase()) ||
            safeString(a.title).toLowerCase().includes(artistName.toLowerCase()) ||
            artistName.toLowerCase().includes(safeString(a.name).toLowerCase())
        );
        const match = exact || artists[0];
        if (match?.image) {
          const img = (safeString(match.image)).replace('50x50', '500x500').replace('150x150', '500x500');
          if (img && !img.includes('default') && !img.includes('artist-default')) {
            return img;
          }
        }
      }
    }
  } catch { /* non-critical */ }

  return null;
}

function extractArtistImageFromSongs(songs: Track[], artistName: string): string | null {
  const firstName = artistName.toLowerCase().split(' ')[0];
  for (const s of songs) {
    if (s.artwork && safeString(s.artist).toLowerCase().includes(firstName)) {
      return s.artwork;
    }
  }
  return null;
}

function extractArtistsFromTracks(tracks: Track[]): Artist[] {
  const artistMap = new Map<string, { name: string; image: string; songCount: number }>();

  for (const t of tracks) {
    const artistStr = safeString(t.artist);
    if (!artistStr) continue;
    const names = artistStr.split(/[,&/|]/).map((n) => n.trim()).filter((n) => n.length > 1);
    for (const name of names) {
      if (!artistMap.has(name)) {
        artistMap.set(name, {
          name,
          image: t.artwork || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=7c3aed&color=fff&bold=true`,
          songCount: 1,
        });
      } else {
        const item = artistMap.get(name)!;
        item.songCount += 1;
      }
    }
  }

  return Array.from(artistMap.values()).slice(0, 10).map((a): Artist => ({
    id: safeString(a.name),
    name: safeString(a.name),
    image: safeString(a.image),
    followerCount: 200000 + a.songCount * 15000,
    monthlyListeners: `${(1.2 + a.songCount * 0.3).toFixed(1)}M`,
    genres: ['Bollywood', 'Popular'],
    topTracks: [],
    albums: [],
  }));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const musicApi = {
  /**
   * Search across JioSaavn + iTunes + YouTube Music in parallel with Mood Intelligence.
   */
  async search(query: string): Promise<SearchResults> {
    if (!query?.trim()) return { tracks: [], artists: [], albums: [], playlists: [] };
    const trimmed = query.trim();
    const matchedMood = detectMood(trimmed);

    // If query matches a mood/emotion, enrich search by querying both user input and curated mood target
    const moodPromise =
      matchedMood && matchedMood.primaryQuery.toLowerCase() !== trimmed.toLowerCase()
        ? searchSaavn(matchedMood.primaryQuery)
        : Promise.resolve({ tracks: [] as Track[], artists: [] as Artist[], albums: [] as Album[], playlists: [] as Playlist[] });

    const [saavnResult, moodSaavnResult, itunesTracks, ytTracks] = await Promise.all([
      searchSaavn(trimmed),
      moodPromise,
      searchItunes(matchedMood ? matchedMood.primaryQuery : trimmed),
      ytMusicService.search(matchedMood ? matchedMood.primaryQuery : trimmed).catch(() => [] as Track[]),
    ]);

    // Merge tracks: JioSaavn + Mood JioSaavn + iTunes + YouTube Music
    const rawCombined: Track[] = [
      ...saavnResult.tracks,
      ...moodSaavnResult.tracks,
      ...itunesTracks,
      ...ytTracks
    ];
    const combined = deduplicateTracks(rawCombined);

    // Collect artists
    const combinedArtists: Artist[] = [...saavnResult.artists, ...moodSaavnResult.artists];
    if (combinedArtists.length < 3 && combined.length > 0) {
      const derived = extractArtistsFromTracks(combined);
      for (const d of derived) {
        if (!combinedArtists.some((a) => safeString(a.name).toLowerCase() === safeString(d.name).toLowerCase())) {
          combinedArtists.push(d);
        }
      }
    }

    const combinedAlbums = [...saavnResult.albums, ...moodSaavnResult.albums];
    const combinedPlaylists = [...saavnResult.playlists, ...moodSaavnResult.playlists];

    if (combined.length > 0) {
      return {
        tracks: combined,
        artists: combinedArtists.length > 0 ? combinedArtists : FEATURED_ARTISTS.slice(0, 6),
        albums: combinedAlbums,
        playlists: combinedPlaylists.length > 0 ? combinedPlaylists : CURATED_PLAYLISTS,
      };
    }

    // Final fallback — static curated data filtered by query
    const qLower = trimmed.toLowerCase();
    const filtered = FEATURED_TRACKS.filter(
      (t) =>
        safeString(t.title).toLowerCase().includes(qLower) ||
        safeString(t.artist).toLowerCase().includes(qLower) ||
        (t.genre && safeString(t.genre).toLowerCase().includes(qLower))
    );
    return {
      tracks: filtered.length > 0 ? deduplicateTracks(filtered) : FEATURED_TRACKS,
      artists: FEATURED_ARTISTS,
      albums: [],
      playlists: CURATED_PLAYLISTS,
    };
  },

  /**
   * Get songs tailored for a specific mood or vibe
   */
  async getMoodTracks(moodIdOrQuery: string): Promise<{ mood: MoodDefinition | null; tracks: Track[] }> {
    const mood = getMoodById(moodIdOrQuery) || detectMood(moodIdOrQuery);
    const searchTarget = mood ? mood.primaryQuery : moodIdOrQuery;

    const queries = [searchTarget];
    if (mood?.alternativeQueries?.[0]) {
      queries.push(mood.alternativeQueries[0]);
    }

    try {
      const batches = await Promise.all(queries.map((q) => this.getTrending(q)));
      const combined = deduplicateTracks(batches.flat());
      return {
        mood,
        tracks: combined.length > 0 ? combined : FEATURED_TRACKS
      };
    } catch {
      return { mood, tracks: FEATURED_TRACKS };
    }
  },

  /** Get trending songs by genre/language query */
  async getTrending(query = 'Top Bollywood Hindi Hits 2024'): Promise<Track[]> {
    const saavnTracks = await trendingSaavn(query);
    if (saavnTracks.length > 0) return deduplicateTracks(saavnTracks);

    const itunesTracks = await searchItunes(query);
    if (itunesTracks.length > 0) return deduplicateTracks(itunesTracks);

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
    const local = FEATURED_ARTISTS.find(
      (a) => a.id === artistName || safeString(a.name).toLowerCase() === artistName.toLowerCase()
    );

    const [rawSongs, realImage] = await Promise.all([
      fetchAllArtistSongs(artistName),
      fetchArtistRealImage(artistName),
    ]);

    const songs = deduplicateTracks(rawSongs);

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
          id: safeString(id),
          title: decodeHtml(safeString(deduped[0].album || id)),
          artist: safeString(deduped[0].artist),
          artistId: safeString(deduped[0].artistId),
          artwork: safeString(deduped[0].artwork),
          releaseYear: safeString(deduped[0].releaseYear || '2024'),
          trackCount: deduped.length,
          tracks: deduped,
          genre: safeString(deduped[0].genre),
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
        id: safeString(id),
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
