import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import http from 'http';

// All allowed JioSaavn api.php call types
const ALLOWED_CALLS = new Set([
  'search.getResults',
  'search.getAlbumResults',
  'search.getArtistResults',
  'search.getPlaylistResults',
  'autocomplete.get',
  'song.getDetails',
  'album.getAlbum',
  'playlist.getPlaylist',
  'artist.getArtistPageDetails',
  'webapi.getLaunchData',
]);

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.jiosaavn.com/',
          Origin: 'https://www.jiosaavn.com',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('Request timed out'));
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers — allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Build query string from forwarded params
  const params = new URLSearchParams();
  params.set('_format', 'json');

  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') {
      params.set(key, value);
    }
  }

  const callType = params.get('__call');
  if (!callType || !ALLOWED_CALLS.has(callType)) {
    return res.status(400).json({ error: 'Unsupported __call parameter' });
  }

  const targetUrl = `https://www.jiosaavn.com/api.php?${params.toString()}`;

  try {
    const body = await fetchUrl(targetUrl);
    // Attempt to parse and re-serialize for clean JSON
    try {
      const json = JSON.parse(body);
      return res.status(200).json(json);
    } catch {
      // Return raw string if not JSON
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(body);
    }
  } catch (err: any) {
    console.error('Saavn proxy error:', err);
    return res.status(502).json({ error: 'Failed to fetch from JioSaavn', detail: err.message });
  }
}
