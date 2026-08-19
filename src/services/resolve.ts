import { Track } from '../api/types';
import { musicApi } from '../api/musicApi';

const CACHE_KEY = 'lf:ytmatch';
const MAX_CACHE_ENTRIES = 300;

interface MatchCache {
  [ytTrackId: string]: Track | null;
}

function getMatchCache(): MatchCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMatchCache(cache: MatchCache) {
  try {
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_ENTRIES) {
      // Evict oldest entries
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
 * Resolves a track to its direct 320kbps audio twin from the primary JioSaavn catalog
 * if it originated from YouTube Music discovery.
 */
export async function resolvePlayable(track: Track): Promise<Track> {
  // If track already has direct audio stream (from JioSaavn / direct CDN), return it
  if (track.source !== 'youtube' && track.streamUrl && !track.streamUrl.includes('youtube')) {
    return track;
  }

  const cache = getMatchCache();
  if (cache[track.id] !== undefined) {
    const cachedMatch = cache[track.id];
    if (cachedMatch) return cachedMatch;
    return track;
  }

  try {
    // 2500ms budget to lookup audio-twin
    const lookupPromise = (async () => {
      const searchTarget = `${track.title} ${track.artist}`.trim();
      const results = await musicApi.search(searchTarget);

      if (results.tracks && results.tracks.length > 0) {
        const normTargetTitle = normalize(track.title);
        const normTargetArtist = normalize(track.artist);

        // Find candidate with high confidence match
        const bestCandidate = results.tracks.find((candidate) => {
          const normCandTitle = normalize(candidate.title);
          const normCandArtist = normalize(candidate.artist);

          const titleMatch =
            normCandTitle.includes(normTargetTitle) || normTargetTitle.includes(normCandTitle);
          const artistMatch =
            normCandArtist.includes(normTargetArtist) ||
            normTargetArtist.includes(normCandArtist) ||
            normTargetArtist.split(' ').some((word) => word.length > 3 && normCandArtist.includes(word));

          return titleMatch || (titleMatch && artistMatch);
        });

        if (bestCandidate && bestCandidate.streamUrl) {
          cache[track.id] = bestCandidate;
          saveMatchCache(cache);
          return bestCandidate;
        }
      }

      // Memoize "looked, found nothing"
      cache[track.id] = null;
      saveMatchCache(cache);
      return track;
    })();

    // Apply 2500ms timeout
    const timeoutPromise = new Promise<Track>((res) =>
      setTimeout(() => res(track), 2500)
    );

    return await Promise.race([lookupPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Audio-twin resolution failed, continuing with direct track', err);
    return track;
  }
}
