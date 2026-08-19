import type { VercelRequest, VercelResponse } from '@vercel/node';
import YTMusic from 'ytmusic-api';

let ytmusicInstance: YTMusic | null = null;
let initPromise: Promise<void> | null = null;

async function getYTMusic(): Promise<YTMusic> {
  if (!ytmusicInstance) {
    ytmusicInstance = new YTMusic();
  }
  if (!initPromise) {
    initPromise = ytmusicInstance.initialize().catch((err) => {
      // Clear rejected promise so transient failures can retry
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  return ytmusicInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable open CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action = 'searchSongs', q = '' } = req.query;
  const queryString = (Array.isArray(q) ? q[0] : q || '').slice(0, 200).trim();

  // Edge Caching: 1 hour max-age, stale-while-revalidate 24 hours
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  try {
    const ytmusic = await getYTMusic();

    switch (action) {
      case 'searchSongs': {
        if (!queryString) {
          return res.status(200).json([]);
        }
        const results = await ytmusic.searchSongs(queryString);
        return res.status(200).json(results);
      }
      case 'searchArtists': {
        if (!queryString) {
          return res.status(200).json([]);
        }
        const results = await ytmusic.searchArtists(queryString);
        return res.status(200).json(results);
      }
      case 'searchPlaylists': {
        if (!queryString) {
          return res.status(200).json([]);
        }
        const results = await ytmusic.searchPlaylists(queryString);
        return res.status(200).json(results);
      }
      case 'home': {
        const results = await ytmusic.getHomeSections();
        return res.status(200).json(results);
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    console.error('YTMusic API error:', err);
    return res.status(502).json({
      error: 'Failed to fetch from YouTube Music',
      message: err?.message || String(err)
    });
  }
}
