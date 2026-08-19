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
 * if it originated from YouTube Music or iTunes discovery without direct full audio stream.
 */
export async function resolvePlayable(track: Track): Promise<Track> {
  const needsResolution =
    track.source === 'youtube' ||
    track.source === 'itunes' ||
    !track.streamUrl ||
    track.streamUrl.includes('audio-preview') ||
    track.streamUrl.includes('youtube');

  // If track already has direct audio stream (from JioSaavn / direct CDN), return it
  if (!needsResolution && track.streamUrl) {
    return track;
  }

  const cache = getMatchCache();
  if (cache[track.id] !== undefined) {
    const cachedMatch = cache[track.id];
    if (cachedMatch && cachedMatch.streamUrl) return cachedMatch;
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
          if (!candidate.streamUrl) return false;
          const normCandTitle = normalize(candidate.title);
          const normCandArtist = normalize(candidate.artist);

          const titleMatch =
            normCandTitle.includes(normTargetTitle) || normTargetTitle.includes(normCandTitle);
          const artistMatch =
            normCandArtist.includes(normTargetArtist) ||
            normTargetArtist.includes(normCandArtist) ||
            normTargetArtist.split(' ').some((word) => word.length > 3 && normCandArtist.includes(word));

          return titleMatch || (titleMatch && artistMatch);
        }) || results[0];

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
