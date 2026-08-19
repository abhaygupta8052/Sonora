import { Track } from '../api/types';

function cleanTitle(rawTitle: string): { title: string; artistFallback?: string } {
  let title = rawTitle
    .replace(/\(Official (Music )?Video\)/gi, '')
    .replace(/\[Official (Music )?Video\]/gi, '')
    .replace(/\(Official Audio\)/gi, '')
    .replace(/\[Official Audio\]/gi, '')
    .replace(/\(Lyric Video\)/gi, '')
    .replace(/\[Lyrics?\]/gi, '')
    .replace(/\(4K\)/gi, '')
    .replace(/\[4K\]/gi, '')
    .replace(/\(Remastered\)/gi, '')
    .replace(/\|.*$/g, '')
    .trim();

  // If title has "Artist - Song Title" format, split it
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    const artist = parts[0].trim();
    const songName = parts.slice(1).join(' - ').trim();
    return { title: songName, artistFallback: artist };
  }

  return { title };
}

export const ytMusicService = {
  async search(query: string): Promise<Track[]> {
    if (!query.trim()) return [];

    try {
      // 1. Try local/same-origin serverless endpoint /api/ytmusic
      const res = await fetch(`/api/ytmusic?action=searchSongs&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any): Track => {
              const videoId = item.videoId || item.id || '';
              const rawName = item.name || item.title || '';
              const { title, artistFallback } = cleanTitle(rawName);
              const artist =
                (item.artists && item.artists[0]?.name) ||
                artistFallback ||
                item.artist ||
                'YouTube Music';

              const thumbnails = item.thumbnails || [];
              const bestThumbnail =
                thumbnails[thumbnails.length - 1]?.url ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

              return {
                id: `yt_${videoId}`,
                title: title || rawName,
                artist,
                album: item.album?.name || 'YouTube Single',
                artwork: bestThumbnail,
                duration: item.duration || 180,
                streamUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
                provider: 'youtube',
                source: 'youtube',
                hasLyrics: false
              };
            });
          }
        }
      }
    } catch (err) {
      console.warn('Same-origin YTMusic bridge unavailable, trying fallback discovery...', err);
    }

    // 2. Fallback: Public Invidious / Piped search bridge for pure client-side discovery
    try {
      const publicEndpoints = [
        `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`,
        `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(query)}&type=video`
      ];

      for (const endpoint of publicEndpoints) {
        try {
          const fallbackRes = await fetch(endpoint, { signal: AbortSignal.timeout(3000) });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const items = data.items || data || [];
            if (Array.isArray(items) && items.length > 0) {
              return items.slice(0, 15).map((item: any): Track => {
                const videoId = item.url ? item.url.replace('/watch?v=', '') : item.videoId || '';
                const { title, artistFallback } = cleanTitle(item.title || '');
                const artist = item.uploaderName || item.author || artistFallback || 'YouTube Music';
                const artwork =
                  item.thumbnail ||
                  item.videoThumbnails?.[0]?.url ||
                  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

                return {
                  id: `yt_${videoId}`,
                  title: title || item.title,
                  artist,
                  album: 'YouTube Stream',
                  artwork,
                  duration: item.duration || 210,
                  streamUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
                  provider: 'youtube',
                  source: 'youtube',
                  hasLyrics: false
                };
              });
            }
          }
        } catch {
          // continue to next endpoint
        }
      }
    } catch {
      // Return empty array gracefully
    }

    return [];
  }
};
