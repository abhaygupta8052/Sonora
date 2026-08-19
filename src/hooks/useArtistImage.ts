import { useState, useEffect } from 'react';

const CACHE_KEY_PREFIX = 'sonora:artist-img:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry { url: string; ts: number }

function readCache(name: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + name.toLowerCase());
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + name.toLowerCase());
      return null;
    }
    return entry.url;
  } catch { return null; }
}

function writeCache(name: string, url: string) {
  try {
    const entry: CacheEntry = { url, ts: Date.now() };
    localStorage.setItem(CACHE_KEY_PREFIX + name.toLowerCase(), JSON.stringify(entry));
  } catch { /* storage full, ignore */ }
}

/**
 * Lazily fetches a real artist photo from JioSaavn API if initialImage is empty.
 * Returns initialImage or fallback immediately.
 */
export function useArtistImage(artistName: string, initialImage?: string, fallback = ''): string {
  const [imgUrl, setImgUrl] = useState<string>(() => {
    if (initialImage && initialImage.trim()) return initialImage;
    return readCache(artistName) || fallback;
  });

  useEffect(() => {
    // If we already have a valid image URL from props, use it directly
    if (initialImage && initialImage.trim()) {
      setImgUrl(initialImage);
      return;
    }

    if (!artistName) return;

    // Already have a real image cached
    const cached = readCache(artistName);
    if (cached) {
      setImgUrl(cached);
      return;
    }

    let cancelled = false;

    const fetchImage = async () => {
      try {
        // 1. Try JioSaavn artist search via our proxy
        const params = `?__call=search.getArtistResults&_format=json&n=5&q=${encodeURIComponent(artistName)}`;
        const res = await fetch(`/api/saavn${params}`, { signal: AbortSignal.timeout(5000) });
        if (res.ok && !cancelled) {
          const data = await res.json();
          const results: any[] = data?.results || data?.data || [];
          const firstName = artistName.toLowerCase().split(' ')[0];
          for (const r of results) {
            const name: string = String(r?.title || r?.name || '').toLowerCase();
            if (name.includes(firstName)) {
              let img = String(r?.image || r?.picture || '');
              if (img) {
                img = img.replace('50x50', '500x500').replace('150x150', '500x500');
                writeCache(artistName, img);
                if (!cancelled) setImgUrl(img);
                return;
              }
            }
          }
        }
      } catch { /* ignore */ }

      // 2. Fallback: community mirror artist search
      const mirrors = [
        'https://saavn.dev/api',
        'https://saavn-api-eight.vercel.app/api',
      ];
      for (const endpoint of mirrors) {
        try {
          const res = await fetch(
            `${endpoint}/search/artists?query=${encodeURIComponent(artistName)}&limit=3`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (res.ok && !cancelled) {
            const data = await res.json();
            const list: any[] = data?.data?.results || data?.results || [];
            if (list.length > 0) {
              const img = String(
                list[0]?.image?.[2]?.link ||
                list[0]?.image?.[1]?.link ||
                list[0]?.image?.[0]?.link ||
                list[0]?.image ||
                ''
              );
              if (img) {
                writeCache(artistName, img);
                if (!cancelled) setImgUrl(img);
                return;
              }
            }
          }
        } catch { /* next */ }
      }
    };

    fetchImage();
    return () => { cancelled = true; };
  }, [artistName, initialImage]);

  return imgUrl;
}
