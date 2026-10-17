export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let bodyPayload = req.body;
    if (typeof bodyPayload === 'string') {
      try {
        bodyPayload = JSON.parse(bodyPayload);
      } catch {
        // Keep string if parse fails
      }
    }

    const upstream = await fetch('https://api.bingr.one/api/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://bingr.one/',
        'Origin': 'https://bingr.one',
      },
      body: JSON.stringify(bodyPayload || {})
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Bingr stream proxy failed' });
  }
}
