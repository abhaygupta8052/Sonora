import CryptoJS from 'crypto-js';
import { Track, Artist, Album, Playlist, SearchResults } from './types';
import { FEATURED_TRACKS, CURATED_PLAYLISTS, FEATURED_ARTISTS } from './curatedData';

const SAAVN_DIRECT_API = 'https://www.jiosaavn.com/api.php';
const DES_KEY = '38346591'; // Standard JioSaavn media decryption key

// Backup endpoints
const BACKUP_ENDPOINTS = [
  'https://saavn-api-eight.vercel.app/api',
  'https://saavn.dev/api',
  'https://saavn.me/api'
];

// Helper to decode HTML entities in titles and artist names
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

// Decrypt official JioSaavn encrypted_media_url to direct streaming URL
function decryptMediaUrl(encryptedUrl: string, quality: '320kbps' | '160kbps' | '96kbps' = '320kbps'): string {
  if (!encryptedUrl) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse(DES_KEY);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl)
    });
    const decrypted = CryptoJS.DES.decrypt(
      cipherParams,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    ).toString(CryptoJS.enc.Utf8);

    if (!decrypted || !decrypted.startsWith('http')) {
      return '';
    }

    if (quality === '320kbps') {
      return decrypted.replace(/_96\.mp4|_160\.mp4/g, '_320.mp4');
    } else if (quality === '160kbps') {
      return decrypted.replace(/_96\.mp4|_320\.mp4/g, '_160.mp4');
    }
    return decrypted;
  } catch (err) {
    console.warn('Failed to decrypt Saavn media URL', err);
    return '';
  }
}

// Normalize official JioSaavn song item
function normalizeOfficialSong(item: any): Track {
  let streamUrl = '';
  if (item.encrypted_media_url) {
    streamUrl = decryptMediaUrl(item.encrypted_media_url, '320kbps');
  } else if (item.media_preview_url) {
    streamUrl = item.media_preview_url.replace('preview.saavncdn.com', 'aac.saavncdn.com').replace('_96_p.mp4', '_320.mp4');
  }

  // Artwork resolution: replace 150x150 with 500x500
  let rawImage = item.image || item.artwork || '';
  if (typeof rawImage === 'string') {
    rawImage = rawImage.replace('150x150', '500x500').replace('50x50', '500x500');
  } else if (Array.isArray(rawImage) && rawImage.length > 0) {
    rawImage = rawImage[rawImage.length - 1]?.url || rawImage[0]?.url || '';
  }

  const artwork = rawImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  let artistName = item.primary_artists || item.singers || item.music || item.artist || 'Unknown Artist';
  if (typeof artistName === 'object' && Array.isArray(artistName)) {
    artistName = artistName.map((a: any) => a.name).join(', ');
  }

  const duration = parseInt(item.duration, 10) || 180;

  return {
    id: item.id || `track-${Math.random().toString(36).substring(2, 9)}`,
    title: decodeHtml(item.song || item.name || item.title || 'Untitled Song'),
    artist: decodeHtml(artistName),
    artistId: item.primary_artists_id || item.artistId || (item.more_info?.artist_map?.primary_artists?.[0]?.id),
    album: decodeHtml(item.album || item.more_info?.album || 'Single'),
    albumId: item.albumid || item.album_id || item.more_info?.album_id,
    duration,
    artwork,
    streamUrl,
    provider: 'saavn',
    releaseYear: item.year || item.more_info?.year || '2024',
    genre: item.language || item.more_info?.language || 'Bollywood'
  };
}

// Normalize Saavn proxy track (from sumit / saavn.dev)
function normalizeProxyTrack(item: any): Track {
  const downloadUrl = item.downloadUrl || item.media_url || item.url || [];
  let streamUrl = '';

  if (Array.isArray(downloadUrl) && downloadUrl.length > 0) {
    const highQ = downloadUrl.find((u: any) => u.quality === '320kbps') ||
                  downloadUrl.find((u: any) => u.quality === '160kbps') ||
                  downloadUrl[downloadUrl.length - 1];
    streamUrl = highQ?.url || highQ?.link || downloadUrl[downloadUrl.length - 1]?.url || '';
  } else if (typeof downloadUrl === 'string') {
    streamUrl = downloadUrl;
  }

  const images = item.image || item.images || [];
  let artwork = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
  if (Array.isArray(images) && images.length > 0) {
    const highImg = images.find((img: any) => img.quality === '500x500') || images[images.length - 1];
    artwork = highImg?.url || highImg?.link || images[images.length - 1]?.url || artwork;
  } else if (typeof images === 'string' && images.length > 0) {
    artwork = images.replace('150x150', '500x500').replace('50x50', '500x500');
  }

  let artistName = 'Unknown Artist';
  if (typeof item.artists === 'object' && item.artists?.primary?.length > 0) {
    artistName = item.artists.primary.map((a: any) => a.name).join(', ');
  } else if (typeof item.primaryArtists === 'string' && item.primaryArtists.length > 0) {
    artistName = item.primaryArtists;
  } else if (typeof item.artist === 'string' && item.artist.length > 0) {
    artistName = item.artist;
  }

  return {
    id: item.id || `track-${Math.random().toString(36).substring(2, 9)}`,
    title: decodeHtml(item.name || item.title || item.song || 'Untitled Song'),
    artist: decodeHtml(artistName),
    artistId: item.primaryArtistsId || item.artistId || (item.artists?.primary?.[0]?.id),
    album: decodeHtml(item.album?.name || item.album || 'Single'),
    albumId: item.album?.id || item.albumId,
    duration: parseInt(item.duration, 10) || 180,
    artwork,
    streamUrl,
    provider: 'saavn',
    releaseYear: item.year || item.releaseDate?.substring(0, 4) || '2024',
    genre: item.language || 'Music'
  };
}

export const musicApi = {
  // Main Search across all languages: Bollywood, Hindi, Bhojpuri, Punjabi, English, etc.
  async search(query: string): Promise<SearchResults> {
    if (!query || !query.trim()) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }

    const trimmed = query.trim();

    // 1. First try direct Official JioSaavn Search API
    try {
      const url = `${SAAVN_DIRECT_API}?__call=search.getResults&_format=json&p=1&n=25&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const tracks = data.results
            .map(normalizeOfficialSong)
            .filter((t: Track) => !!t.streamUrl);

          if (tracks.length > 0) {
            // Also fetch autocomplete artists and albums in parallel
            const autoRes = await fetch(`${SAAVN_DIRECT_API}?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(trimmed)}`, { signal: AbortSignal.timeout(4000) }).catch(() => null);
            let artists: Artist[] = [];
            let albums: Album[] = [];
            let playlists: Playlist[] = [];

            if (autoRes && autoRes.ok) {
              const autoData = await autoRes.json().catch(() => null);
              if (autoData?.artists?.data) {
                artists = autoData.artists.data.map((a: any) => ({
                  id: a.id || a.title,
                  name: decodeHtml(a.title || a.name),
                  image: (a.image || '').replace('50x50', '500x500'),
                  followerCount: 150000,
                  monthlyListeners: '2.5M',
                  genres: ['Bollywood', 'Popular'],
                  topTracks: [],
                  albums: []
                }));
              }
              if (autoData?.albums?.data) {
                albums = autoData.albums.data.map((al: any) => ({
                  id: al.id,
                  title: decodeHtml(al.title),
                  artist: decodeHtml(al.music || al.artist || 'Various Artists'),
                  artwork: (al.image || '').replace('50x50', '500x500'),
                  releaseYear: al.year || '2024',
                  trackCount: 5,
                  tracks: []
                }));
              }
              if (autoData?.playlists?.data) {
                playlists = autoData.playlists.data.map((p: any) => ({
                  id: p.id,
                  title: decodeHtml(p.title),
                  description: 'Curated Playlist',
                  artwork: (p.image || '').replace('50x50', '500x500'),
                  trackCount: 10,
                  tracks: []
                }));
              }
            }

            return { tracks, artists, albums, playlists };
          }
        }
      }
    } catch (e) {
      console.warn('Direct Saavn search failed, trying proxy mirror...', e);
    }

    // 2. Try proxy endpoints (saavn-api-eight / sumit endpoints)
    for (const endpoint of BACKUP_ENDPOINTS) {
      try {
        const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(trimmed)}&limit=25`, {
          signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
          const data = await res.json();
          const resultsList = data?.data?.results || data?.results || [];
          if (Array.isArray(resultsList) && resultsList.length > 0) {
            const tracks = resultsList.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
            if (tracks.length > 0) {
              return { tracks, artists: [], albums: [], playlists: [] };
            }
          }
        }
      } catch (err) {
        // Try next mirror
      }
    }

    // 3. Fallback to curated set
    const qLower = trimmed.toLowerCase();
    const fallbackTracks = FEATURED_TRACKS.filter(t =>
      t.title.toLowerCase().includes(qLower) ||
      t.artist.toLowerCase().includes(qLower) ||
      (t.genre && t.genre.toLowerCase().includes(qLower))
    );

    return {
      tracks: fallbackTracks.length > 0 ? fallbackTracks : FEATURED_TRACKS,
      artists: FEATURED_ARTISTS,
      albums: [],
      playlists: CURATED_PLAYLISTS
    };
  },

  // Get Trending Bollywood / Indian / Global Hits
  async getTrending(query: string = 'Top Bollywood Hindi Hits 2024'): Promise<Track[]> {
    try {
      const url = `${SAAVN_DIRECT_API}?__call=search.getResults&_format=json&p=1&n=25&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const tracks = data.results.map(normalizeOfficialSong).filter((t: Track) => !!t.streamUrl);
          if (tracks.length > 0) return tracks;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch official trending, trying backup...', e);
    }

    for (const endpoint of BACKUP_ENDPOINTS) {
      try {
        const res = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(query)}&limit=20`, {
          signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
          const data = await res.json();
          const list = data?.data?.results || data?.results || [];
          const tracks = list.map(normalizeProxyTrack).filter((t: Track) => !!t.streamUrl);
          if (tracks.length > 0) return tracks;
        }
      } catch (err) {
        // Continue
      }
    }

    return FEATURED_TRACKS;
  },

  // Get New Releases
  async getNewReleases(): Promise<Track[]> {
    return this.getTrending('Latest Hindi Punjabi Hits');
  },

  // Get Songs by Genre / Mood (Bhojpuri, Bollywood, Punjabi, Lo-Fi, EDM, etc.)
  async getByGenre(genreQuery: string): Promise<Track[]> {
    return this.getTrending(genreQuery);
  },

  // Get Artist details & top songs
  async getArtistDetails(id: string): Promise<Artist | null> {
    const local = FEATURED_ARTISTS.find(a => a.id === id);
    if (local) return local;

    try {
      // Search artist songs directly
      const songs = await this.getTrending(id);
      return {
        id,
        name: decodeHtml(id.replace(/[-_]/g, ' ')),
        image: songs[0]?.artwork || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
        bio: `Explore top trending tracks and discography by ${id}.`,
        followerCount: 450000,
        monthlyListeners: '3.8M',
        genres: ['Popular', 'Bollywood', 'Pop'],
        topTracks: songs,
        albums: []
      };
    } catch (e) {
      console.warn('Artist fetch fallback', e);
    }
    return FEATURED_ARTISTS[0];
  },

  // Get Album details
  async getAlbumDetails(id: string): Promise<Album | null> {
    try {
      const songs = await this.getTrending(id);
      if (songs.length > 0) {
        return {
          id,
          title: decodeHtml(songs[0].album || id),
          artist: songs[0].artist,
          artistId: songs[0].artistId,
          artwork: songs[0].artwork,
          releaseYear: songs[0].releaseYear || '2024',
          trackCount: songs.length,
          tracks: songs,
          genre: songs[0].genre
        };
      }
    } catch (e) {
      console.warn('Album fetch fallback', e);
    }
    return null;
  },

  // Get Playlist details
  async getPlaylistDetails(id: string): Promise<Playlist | null> {
    const local = CURATED_PLAYLISTS.find(p => p.id === id);
    if (local) return local;

    try {
      const songs = await this.getTrending(id);
      return {
        id,
        title: decodeHtml(id.replace(/[-_]/g, ' ')),
        description: 'Curated Music Stream',
        artwork: songs[0]?.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        trackCount: songs.length,
        tracks: songs
      };
    } catch (e) {
      console.warn('Playlist details fallback', e);
    }
    return CURATED_PLAYLISTS[0];
  }
};
