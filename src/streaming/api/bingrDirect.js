/**
 * Bingr Constellation Direct Streaming API
 * High-Speed Caching, Pre-Warming & Fast Failover Engine
 */

export const BINGR_SERVERS = [
  {
    id: 'polaris',
    srv: 's70',
    name: 'Polaris',
    flag: '🇺🇸',
    country: 'US',
    badge: 'Multi-Audio & Subs',
    desc: 'Multi-Audio & Multi-Subtitles Flagship',
    isDirectHls: true,
    isPrimary: true,
  },
  {
    id: 'corvus',
    srv: 's61',
    name: 'Corvus',
    flag: '🇺🇸',
    country: 'US',
    badge: '1080p Master',
    desc: '1080p Cinema Master',
    isDirectHls: true,
    isPrimary: true,
  },
  {
    id: 'aphelion',
    srv: 's40',
    name: 'Aphelion',
    iconType: 'star',
    flag: '✦',
    country: 'GL',
    badge: 'Global HLS',
    desc: 'Direct HLS Global Stream',
    isDirectHls: true,
    isPrimary: true,
  },
  {
    id: 'bastion',
    srv: 's62',
    name: 'Bastion',
    flag: '🇮🇳',
    country: 'IN',
    badge: 'India Regional',
    desc: 'India Regional Multi-Audio (Tamil/Hindi/Telugu)',
    isDirectHls: true,
    isPrimary: true,
  },
  {
    id: 'orion',
    srv: 's31',
    name: 'Orion',
    flag: '🇺🇸',
    country: 'US',
    badge: 'Cloud Mirror',
    desc: 'Direct Cloud Mirror',
    isDirectHls: true,
    isPrimary: true,
  },
  {
    id: 'moscow',
    srv: 's80',
    name: 'Moscow',
    flag: '🇺🇸',
    country: 'US',
    desc: 'US East Direct Mirror',
    isDirectHls: true,
    isPrimary: false,
  },
  {
    id: 'novo',
    srv: 's81',
    name: 'Novo',
    flag: '🇺🇸',
    country: 'US',
    desc: 'US West Direct Mirror',
    isDirectHls: true,
    isPrimary: false,
  },
  {
    id: 'hallyu',
    srv: 's50',
    name: 'Hallyu',
    flag: '🇰🇷',
    country: 'KR',
    desc: 'East Asia Fast Mirror',
    isDirectHls: true,
    isPrimary: false,
  },
  {
    id: 'nova',
    srv: 's30',
    name: 'Nova',
    flag: '🇺🇸',
    country: 'US',
    desc: 'Ultra Low-Latency HLS',
    isDirectHls: true,
    isPrimary: false,
  },
  {
    id: 'vertex',
    srv: 's60',
    name: 'Vertex',
    flag: '🇺🇸',
    country: 'US',
    desc: 'High Bitrate 1080p Mirror',
    isDirectHls: true,
    isPrimary: false,
  },
  {
    id: 'edmunds',
    srv: 's3',
    name: 'Edmunds',
    flag: '🇺🇸',
    country: 'US',
    desc: 'Direct Stream Mirror',
    isDirectHls: true,
    isPrimary: false,
  },
];

export const getLanguageFlag = (langStr = '') => {
  const l = String(langStr).toLowerCase();
  if (l.includes('eng') || l.includes('original')) return '🇺🇸';
  if (l.includes('fren') || l.includes('franç') || l.includes('fr')) return '🇫🇷';
  if (l.includes('hin') || l.includes('tam') || l.includes('tel') || l.includes('mal') || l.includes('kan') || l.includes('ben')) return '🇮🇳';
  if (l.includes('span') || l.includes('esla') || l.includes('españ') || l.includes('latin')) return '🇲🇽';
  if (l.includes('ptbr') || l.includes('portug')) return '🇧🇷';
  if (l.includes('russ') || l.includes('ru')) return '🇷🇺';
  if (l.includes('arab') || l.includes('عرب')) return '🇸🇦';
  if (l.includes('indo') || l.includes('id')) return '🇮🇩';
  if (l.includes('kor') || l.includes('한국')) return '🇰🇷';
  if (l.includes('jap') || l.includes('日本語') || l.includes('ja')) return '🇯🇵';
  if (l.includes('ukr')) return '🇺🇦';
  if (l.includes('germ') || l.includes('de')) return '🇩🇪';
  if (l.includes('ital') || l.includes('it')) return '🇮🇹';
  if (l.includes('chin') || l.includes('zh')) return '🇨🇳';
  return '🌐';
};

export const normalizeAudioLabel = (source) => {
  const rawLang = source.language || source.label || source.name || '';
  let cleanName = rawLang
    .replace(/^NetNaija\s*\[?/i, '')
    .replace(/^Vegamovies\s*\[?/i, '')
    .replace(/\]$/, '')
    .replace(/\s*Audio/i, '')
    .trim();

  let subtext = source.quality || '1080p';
  if (/original|eng/i.test(cleanName) && !cleanName.toLowerCase().includes('sub')) {
    cleanName = 'English';
    subtext = 'Original';
  } else if (/esla/i.test(cleanName)) {
    cleanName = 'Spanish (LA)';
  } else if (/ptbr/i.test(cleanName)) {
    cleanName = 'Portuguese (BR)';
  }

  return {
    cleanName: cleanName || 'English',
    subtext,
    flag: getLanguageFlag(cleanName),
  };
};

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : {};
const API_URL = (env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com').replace(/\/+$/, '');

// Fast In-Memory Cache (0ms switch latency)
const streamCache = new Map();
const languageCache = new Map();

export const getStreamCacheKey = (srv, id, category, season, episode) =>
  `${srv}:${category || 'movie'}:${id}:${season || 1}:${episode || 1}`;

/**
 * Adapt the master stream cluster for specific server personalities
 */
export function adaptClusterForServer(srv = 's70', clusterData) {
  if (!clusterData || !Array.isArray(clusterData.sources) || clusterData.sources.length === 0) {
    return clusterData;
  }

  const sources = [...clusterData.sources];
  const subtitles = Array.isArray(clusterData.subtitles) ? [...clusterData.subtitles] : [];

  if (srv === 's62' || srv === 'bastion') {
    // Bastion: Prioritize Indian regional audio (Hindi, Tamil, Telugu, etc.)
    const regIdx = sources.findIndex(s => {
      const l = (s.language || s.name || s.label || '').toLowerCase();
      return /hin|tam|tel|mal|kan|ben/i.test(l);
    });
    if (regIdx > 0) {
      const [reg] = sources.splice(regIdx, 1);
      sources.unshift(reg);
    }
  } else if (srv === 's40' || srv === 'aphelion') {
    // Aphelion: Prioritize Global HLS stream
    const hlsIdx = sources.findIndex(s => s.type === 'application/x-mpegurl' || s.url?.includes('.m3u8'));
    if (hlsIdx > 0) {
      const [hls] = sources.splice(hlsIdx, 1);
      sources.unshift(hls);
    }
  } else if (srv === 's61' || srv === 'corvus') {
    // Corvus: Prioritize 1080p Cinema Master
    const masterIdx = sources.findIndex(s => s.quality === '1080p' && (s.url?.includes('streamrip') || s.type === 'video/mp4'));
    if (masterIdx > 0) {
      const [m] = sources.splice(masterIdx, 1);
      sources.unshift(m);
    }
  } else if (srv === 's30' || srv === 'nova') {
    // Nova: Prioritize 720p/480p low latency
    const lowIdx = sources.findIndex(s => s.quality === '720p' || s.quality === '480p');
    if (lowIdx > 0) {
      const [low] = sources.splice(lowIdx, 1);
      sources.unshift(low);
    }
  } else if (srv === 's31' || srv === 'orion') {
    // Orion: Cloud mirror (second 1080p or alternate stream)
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
    scraperName: `Bingr-${srv.toUpperCase()}`,
  };
}

/**
 * Prewarm and pre-resolve master Constellation cluster (s70) in the background
 */
export function prewarmBingrStreams({ type = 'movie', id, title, year, season, episode }) {
  if (!id) return;
  fetchBingrStream({ srv: 's70', type, id, title, year, season, episode, timeoutMs: 2500 }).catch(() => {});
}

/**
 * Fetch direct stream sources and subtitles with instant 0ms cached switching and smart failover
 */
export async function fetchBingrStream({ srv = 's70', type = 'movie', id, title, year, season, episode, timeoutMs = 1800 }) {
  const cacheKey = getStreamCacheKey(srv, id, type, season, episode);
  if (streamCache.has(cacheKey)) {
    return streamCache.get(cacheKey);
  }

  // Check if master s70 cluster is already in memory: 0ms INSTANT SWITCH!
  const masterKey = getStreamCacheKey('s70', id, type, season, episode);
  if (streamCache.has(masterKey)) {
    const masterData = streamCache.get(masterKey);
    const adapted = adaptClusterForServer(srv, masterData);
    streamCache.set(cacheKey, adapted);
    return adapted;
  }

  const endpoints = [
    '/api/streaming/bingr/stream',
    `${API_URL}/api/streaming/bingr/stream`,
    '/bingr-api/stream',
  ];

  const doFetch = async (targetSrv, targetTimeout) => {
    const payload = {
      srv: targetSrv,
      t: type === 'tv' ? 'tv' : 'movie',
      id: String(id || ''),
      query: {
        title: title || '',
        year: year ? String(year) : '',
        ...(type === 'tv' ? { season: Number(season) || 1, episode: Number(episode) || 1 } : {}),
      },
    };

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), targetTimeout);

        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && Array.isArray(data.sources) && data.sources.length > 0) {
            return {
              sources: data.sources,
              subtitles: Array.isArray(data.subtitles) ? data.subtitles : [],
              scraperName: data.scraperName || '',
            };
          }
        }
      } catch {
        // Continue to fallback
      }
    }
    return null;
  };

  // If requesting s70, fetch directly
  if (srv === 's70') {
    const res = await doFetch('s70', timeoutMs);
    if (res && res.sources.length > 0) {
      streamCache.set(cacheKey, res);
      return res;
    }
    return { sources: [], subtitles: [] };
  }

  // If requesting another server, first try target srv with quick timeout (1200ms)
  const directRes = await doFetch(srv, 1200);
  if (directRes && directRes.sources.length > 0) {
    streamCache.set(cacheKey, directRes);
    return directRes;
  }

  // Seamless fallback: fetch master s70 cluster and adapt for requested server
  const masterRes = await doFetch('s70', timeoutMs);
  if (masterRes && masterRes.sources.length > 0) {
    streamCache.set(masterKey, masterRes);
    const adapted = adaptClusterForServer(srv, masterRes);
    streamCache.set(cacheKey, adapted);
    return adapted;
  }

  return { sources: [], subtitles: [] };
}

/**
 * Fetch external dubbed audio sources (Vegamovies, NetNaija, etc.) with caching
 */
export async function fetchBingrLanguages({ type = 'movie', id, title, year, timeoutMs = 2800 }) {
  const cacheKey = `${type}:${id}:${title}:${year}`;
  if (languageCache.has(cacheKey)) {
    return languageCache.get(cacheKey);
  }

  const query = new URLSearchParams({
    title: title || '',
    year: year ? String(year) : '',
  }).toString();

  const endpoints = [
    `/api/streaming/bingr/languages/${type}/${id}?${query}`,
    `${API_URL}/api/streaming/bingr/languages/${type}/${id}?${query}`,
    `/bingr-api/languages/${type}/${id}?${query}`,
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(ep, { signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const sources = Array.isArray(data.sources) ? data.sources : (Array.isArray(data) ? data : []);
        if (sources.length > 0) {
          languageCache.set(cacheKey, sources);
          return sources;
        }
      }
    } catch {
      // Continue to next fallback endpoint
    }
  }

  return [];
}
