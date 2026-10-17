/**
 * Bingr Constellation Direct Streaming API
 * Provides direct HLS / MP4 playback, multi-audio tracks, and multi-subtitles
 * Reverse-engineered from Bingr.one constellation architecture
 */

export const BINGR_SERVERS = [
  {
    id: 'aphelion',
    srv: 's40',
    name: 'Aphelion',
    iconType: 'star',
    flag: '✦',
    country: 'GL',
    desc: 'Direct HLS Global Stream',
    isDirectHls: true,
  },
  {
    id: 'polaris',
    srv: 's70',
    name: 'Polaris',
    flag: '🇺🇸',
    country: 'US',
    desc: 'Multi-Audio & Multi-Subtitles Flagship',
    isDirectHls: true,
  },
  {
    id: 'moscow',
    srv: 's80',
    name: 'Moscow',
    flag: '🇺🇸',
    country: 'US',
    desc: 'US East Direct Mirror',
    isDirectHls: true,
  },
  {
    id: 'novo',
    srv: 's81',
    name: 'Novo',
    flag: '🇺🇸',
    country: 'US',
    desc: 'US West Direct Mirror',
    isDirectHls: true,
  },
  {
    id: 'bastion',
    srv: 's62',
    name: 'Bastion',
    flag: '🇮🇳',
    country: 'IN',
    desc: 'India Regional Multi-Audio (Tamil/Hindi/Telugu)',
    isDirectHls: true,
  },
  {
    id: 'hallyu',
    srv: 's50',
    name: 'Hallyu',
    flag: '🇰🇷',
    country: 'KR',
    desc: 'East Asia Fast Mirror',
    isDirectHls: true,
  },
  {
    id: 'nova',
    srv: 's30',
    name: 'Nova',
    flag: '🇺🇸',
    country: 'US',
    desc: 'Ultra Low-Latency HLS',
    isDirectHls: true,
  },
  {
    id: 'vertex',
    srv: 's60',
    name: 'Vertex',
    flag: '🇺🇸',
    country: 'US',
    desc: 'High Bitrate 1080p Mirror',
    isDirectHls: true,
  },
  {
    id: 'corvus',
    srv: 's61',
    name: 'Corvus',
    flag: '🇺🇸',
    country: 'US',
    desc: '1080p Cinema Master',
    isDirectHls: true,
  },
  {
    id: 'orion',
    srv: 's31',
    name: 'Orion',
    flag: '🇺🇸',
    country: 'US',
    desc: 'Direct Cloud Mirror',
    isDirectHls: true,
  },
  {
    id: 'edmunds',
    srv: 's3',
    name: 'Edmunds',
    flag: '🇺🇸',
    country: 'US',
    desc: 'Direct Stream Mirror',
    isDirectHls: true,
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

/**
 * Fetch direct stream sources and subtitles for a specific server
 */
export async function fetchBingrStream({ srv = 's70', type = 'movie', id, title, year, season, episode }) {
  const payload = {
    srv,
    t: type === 'tv' ? 'tv' : 'movie',
    id: String(id || ''),
    query: {
      title: title || '',
      year: year ? String(year) : '',
      ...(type === 'tv' ? { season: Number(season) || 1, episode: Number(episode) || 1 } : {}),
    },
  };

  const endpoints = ['/api/streaming/bingr/stream', '/bingr-api/stream'];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          sources: Array.isArray(data.sources) ? data.sources : [],
          subtitles: Array.isArray(data.subtitles) ? data.subtitles : [],
          scraperName: data.scraperName || '',
        };
      }
    } catch {
      // Continue to next endpoint
    }
  }

  return { sources: [], subtitles: [] };
}

/**
 * Fetch external dubbed audio sources (Vegamovies, NetNaija, etc.)
 */
export async function fetchBingrLanguages({ type = 'movie', id, title, year }) {
  const query = new URLSearchParams({
    title: title || '',
    year: year ? String(year) : '',
  }).toString();

  const endpoints = [
    `/api/streaming/bingr/languages/${type}/${id}?${query}`,
    `/bingr-api/languages/${type}/${id}?${query}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep);
      if (res.ok) {
        const data = await res.json();
        const sources = Array.isArray(data.sources) ? data.sources : (Array.isArray(data) ? data : []);
        return sources;
      }
    } catch {
      // Continue to next endpoint
    }
  }

  return [];
}
