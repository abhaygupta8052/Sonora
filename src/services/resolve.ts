import { Track } from '../api/types';
import { musicApi } from '../api/musicApi';

const CACHE_KEY = 'lf:ytmatch';
const MAX_CACHE_ENTRIES = 300;

interface MatchCache {
  [ytTrackId: string]: Track | null;
}

let memoryCache: MatchCache | null = null;

function getMatchCache(): MatchCache {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    memoryCache = raw ? JSON.parse(raw) : {};
    return memoryCache!;
  } catch {
    memoryCache = {};
    return memoryCache;
  }
}

function saveMatchCache(cache: MatchCache) {
  memoryCache = cache;
  try {
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      const pruned: MatchCache = {};
      keys.slice(-MAX_CACHE_ENTRIES).forEach((k) => {
        pruned[k] = cache[k];
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(pruned));
    } else {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (err) {
    console.warn('Failed to save ytmatch cache', err);
  }
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a track requires resolution to a full CDN audio stream.
 */
export function isNeedsResolution(track: Track | null | undefined): boolean {
  if (!track || !track.streamUrl) return true;
  return (
    track.source === 'youtube' ||
    track.source === 'itunes' ||
    track.streamUrl.includes('audio-preview') ||
    track.streamUrl.includes('youtube') ||
    track.streamUrl.includes('preview.saavncdn.com') || // 30-sec clip domain — must resolve to full
    track.streamUrl.includes('_96_p.mp4')               // low-quality preview suffix
  );
}

/**
 * Synchronously retrieves a playable track if its streamUrl is already available or cached.
 * Returns null if network resolution is still required.
 */
export function getSyncPlayableTrack(track: Track | null | undefined): Track | null {
  if (!track) return null;
  if (!isNeedsResolution(track)) {
    return track;
  }
  const cache = getMatchCache();
  const cachedMatch = cache[track.id];
  if (cachedMatch && cachedMatch.streamUrl && !isNeedsResolution(cachedMatch)) {
    return cachedMatch;
  }
  return null;
}

/**
 * Synchronously gets a direct streamUrl if already resolved/cached.
 */
export function getDirectStreamUrl(track: Track | null | undefined): string | null {
  const syncTrack = getSyncPlayableTrack(track);
  return syncTrack?.streamUrl || null;
}

// Background preload element to warm DNS, TCP handshake, and buffer cache for upcoming tracks
let preloadAudioEl: HTMLAudioElement | null = null;

/**
 * Preloads audio file into browser HTTP cache ahead of time.
 */
export function preloadTrackAudio(url: string | null | undefined): void {
  if (!url || typeof window === 'undefined') return;
  try {
    if (!preloadAudioEl) {
      preloadAudioEl = new Audio();
      preloadAudioEl.preload = 'auto';
      preloadAudioEl.volume = 0;
      preloadAudioEl.muted = true;
    }
    if (preloadAudioEl.src !== url) {
      preloadAudioEl.src = url;
      preloadAudioEl.load();
    }
  } catch {
    // Ignore preload errors on unsupported environments
  }
}

/**
 * Resolves a track to its direct 320kbps audio twin from the primary JioSaavn catalog
 * if it originated from YouTube Music or iTunes discovery without direct full audio stream.
 */
export async function resolvePlayable(track: Track): Promise<Track> {
  // If track already has direct audio stream (from JioSaavn / direct CDN), return it immediately
  if (!isNeedsResolution(track) && track.streamUrl) {
    return track;
  }

  const cache = getMatchCache();
  if (cache[track.id] !== undefined) {
    const cachedMatch = cache[track.id];
    if (cachedMatch && cachedMatch.streamUrl && !isNeedsResolution(cachedMatch)) {
      return cachedMatch;
    }
  }

  try {
    const lookupPromise = (async () => {
      const searchTarget = `${track.title} ${track.artist}`.trim();
      const results = await musicApi.getTrending(searchTarget);

      if (results && results.length > 0) {
        const normTargetTitle = normalize(track.title);
        const normTargetArtist = normalize(track.artist);

        // Find candidate with high confidence match
        const bestCandidate = results.find((candidate) => {
          if (!candidate.streamUrl || isNeedsResolution(candidate)) return false;
          const normCandTitle = normalize(candidate.title);
          const normCandArtist = normalize(candidate.artist);

          const titleMatch =
            normCandTitle.includes(normTargetTitle) || normTargetTitle.includes(normCandTitle);
          const artistMatch =
            normCandArtist.includes(normTargetArtist) ||
            normTargetArtist.includes(normCandArtist) ||
            normTargetArtist.split(' ').some((word) => word.length > 3 && normCandArtist.includes(word));

          return titleMatch || (titleMatch && artistMatch);
        }) || results.find((r) => !!r.streamUrl && !isNeedsResolution(r));

        if (bestCandidate && bestCandidate.streamUrl) {
          const resolved: Track = {
            ...track,
            streamUrl: bestCandidate.streamUrl,
            duration: bestCandidate.duration || track.duration,
            artwork: track.artwork || bestCandidate.artwork
          };
          cache[track.id] = resolved;
          saveMatchCache(cache);
          return resolved;
        }
      }

      return track;
    })();

    // Apply 3000ms timeout
    const timeoutPromise = new Promise<Track>((res) =>
      setTimeout(() => res(track), 3000)
    );

    return await Promise.race([lookupPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Audio-twin resolution failed, continuing with direct track', err);
    return track;
  }
}
