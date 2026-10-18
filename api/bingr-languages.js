const langCache = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { type = 'movie', id = '', title = '', year = '' } = req.query;
    const queryParams = new URLSearchParams({ title, year }).toString();
    const cacheKey = `${type}:${id}:${queryParams}`;

    if (langCache.has(cacheKey)) {
      const cached = langCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 15 * 60 * 1000) {
        return res.status(200).json(cached.data);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    const url = `https://api.bingr.one/api/languages/${type}/${id}${queryParams ? `?${queryParams}` : ''}`;
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://bingr.one/',
        'Origin': 'https://bingr.one',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      if (data && Array.isArray(data.sources) && data.sources.length > 0) {
        langCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return res.status(upstream.status).json(data);
    }

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Bingr languages proxy failed' });
  }
}
