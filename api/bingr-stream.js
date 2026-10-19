const streamCache = new Map();

function adaptCluster(srv, clusterData) {
  if (!clusterData || !Array.isArray(clusterData.sources) || clusterData.sources.length === 0) {
    return clusterData;
  }
  const sources = [...clusterData.sources];
  const subtitles = Array.isArray(clusterData.subtitles) ? [...clusterData.subtitles] : [];

  if (srv === 's62' || srv === 'bastion') {
    const regIdx = sources.findIndex(s => {
      const l = (s.language || s.name || s.label || '').toLowerCase();
      return /hin|tam|tel|mal|kan|ben/i.test(l);
    });
    if (regIdx > 0) {
      const [reg] = sources.splice(regIdx, 1);
      sources.unshift(reg);
    }
  } else if (srv === 's40' || srv === 'aphelion') {
    const hlsIdx = sources.findIndex(s => s.type === 'application/x-mpegurl' || s.url?.includes('.m3u8'));
    if (hlsIdx > 0) {
      const [hls] = sources.splice(hlsIdx, 1);
      sources.unshift(hls);
    }
  } else if (srv === 's61' || srv === 'corvus') {
    const masterIdx = sources.findIndex(s => s.quality === '1080p' && (s.url?.includes('streamrip') || s.type === 'video/mp4'));
    if (masterIdx > 0) {
      const [m] = sources.splice(masterIdx, 1);
      sources.unshift(m);
    }
  } else if (srv === 's30' || srv === 'nova') {
    const lowIdx = sources.findIndex(s => s.quality === '720p' || s.quality === '480p');
    if (lowIdx > 0) {
      const [low] = sources.splice(lowIdx, 1);
      sources.unshift(low);
    }
  } else if (srv === 's31' || srv === 'orion') {
    if (sources.length > 1) {
      const alt = sources[1];
      sources.splice(1, 1);
      sources.unshift(alt);
    }
  }

  return {
    ...clusterData,
    sources,
    subtitles,
    scraperName: `Bingr-${String(srv || 'S70').toUpperCase()}`,
  };
}

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
        // Keep as is
      }
    }

    if (!bodyPayload || typeof bodyPayload !== 'object' || Object.keys(bodyPayload).length === 0) {
      bodyPayload = {
        srv: req.query?.srv || 's70',
        t: req.query?.t || req.query?.type || 'movie',
        id: req.query?.id || '',
        query: {
          title: req.query?.title || '',
          year: req.query?.year || '',
          ...(req.query?.season ? { season: Number(req.query.season) } : {}),
          ...(req.query?.episode ? { episode: Number(req.query.episode) } : {}),
        }
      };
    }

    const t = bodyPayload.t || bodyPayload.type || (req.query?.type === 'tv' ? 'tv' : 'movie');
    bodyPayload.t = t;

    const { srv = 's70', id = '', query = {} } = bodyPayload || {};
    const cacheKey = `${srv}:${id}:${query.season || ''}:${query.episode || ''}`;
    const masterKey = `s70:${id}:${query.season || ''}:${query.episode || ''}`;

    if (streamCache.has(cacheKey)) {
      const cached = streamCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 15 * 60 * 1000) {
        return res.status(200).json(cached.data);
      }
    }

    if (streamCache.has(masterKey)) {
      const masterCached = streamCache.get(masterKey);
      if (Date.now() - masterCached.timestamp < 15 * 60 * 1000) {
        const adapted = adaptCluster(srv, masterCached.data);
        streamCache.set(cacheKey, { data: adapted, timestamp: Date.now() });
        return res.status(200).json(adapted);
      }
    }

    const fetchUpstream = async (targetSrv, timeoutMs) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const upstream = await fetch('https://api.bingr.one/api/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://bingr.one/',
            'Origin': 'https://bingr.one',
          },
          body: JSON.stringify({ ...(bodyPayload || {}), srv: targetSrv, t }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const contentType = upstream.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await upstream.json();
          if (data && Array.isArray(data.sources) && data.sources.length > 0) {
            return data;
          }
        }
      } catch {
        // fall through
      }
      return null;
    };

    if (srv === 's70') {
      const data = await fetchUpstream('s70', 2500);
      if (data) {
        streamCache.set(cacheKey, { data, timestamp: Date.now() });
        return res.status(200).json(data);
      }
      return res.status(200).json({ sources: [], subtitles: [] });
    }

    // Try target srv with quick 1200ms timeout
    const targetData = await fetchUpstream(srv, 1200);
    if (targetData) {
      streamCache.set(cacheKey, { data: targetData, timestamp: Date.now() });
      return res.status(200).json(targetData);
    }

    // Fallback: master s70
    const masterData = await fetchUpstream('s70', 2500);
    if (masterData) {
      streamCache.set(masterKey, { data: masterData, timestamp: Date.now() });
      const adapted = adaptCluster(srv, masterData);
      streamCache.set(cacheKey, { data: adapted, timestamp: Date.now() });
      return res.status(200).json(adapted);
    }

    return res.status(200).json({ sources: [], subtitles: [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Bingr stream proxy failed' });
  }
}
