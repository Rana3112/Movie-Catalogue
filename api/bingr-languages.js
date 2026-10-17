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
    const url = `https://api.bingr.one/api/languages/${type}/${id}${queryParams ? `?${queryParams}` : ''}`;

    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://bingr.one/',
        'Origin': 'https://bingr.one',
      }
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Bingr languages proxy failed' });
  }
}
