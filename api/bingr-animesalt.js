let animeSaltToken = null;
let animeSaltTokenExpiry = 0;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { title = '', ep = 1, season = 1 } = req.query;
    if (!title) return res.status(400).json({ error: 'Title required' });

    if (!animeSaltToken || Date.now() > animeSaltTokenExpiry) {
      const tokenRes = await fetch('https://hianime.filmu.in/token', { method: 'POST' });
      if (tokenRes.ok) {
        const tData = await tokenRes.json();
        if (tData.token) {
          animeSaltToken = tData.token;
          animeSaltTokenExpiry = Date.now() + 2 * 60 * 60 * 1000;
        }
      }
    }

    const streamUrl = `https://hianime.filmu.in/animesalt/streams?title=${encodeURIComponent(title)}&ep=${ep}&season=${season}`;
    const streamRes = await fetch(streamUrl, {
      headers: {
        'x-api-key': animeSaltToken || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const data = await streamRes.json();
    return res.status(streamRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'AnimeSalt proxy failed' });
  }
}
