import { BINGR_SERVERS, fetchBingrStream } from './bingrDirect.js';

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : {};
const VIDZEE = (env.VITE_VIDZEE_PLAYER || 'https://player.vidzee.wtf').replace(/\/+$/, '');
const VIDSRC_MOV = (env.VITE_VIDSRC_MOV_PLAYER || 'https://vidsrc.mov').replace(/\/+$/, '');
const ANIME_PLAYER = (env.VITE_ANIME_PLAYER || 'https://vidnest.fun').replace(/\/+$/, '');
const API_URL = (env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com').replace(/\/+$/, '');

// Verified high-uptime streaming endpoints
const VIDFAST_BASE = 'https://vidfast.vc';
const VIDLINK_BASE = 'https://vidlink.pro';
const PRIMESRC_BASE = 'https://primesrc.me';
const EMBED2_BASE = 'https://www.2embed.cc';
const VIDSRC_MOV_BASE = 'https://vidsrc.mov';
const VIDSRC_PM_BASE = 'https://vidsrc.pm';
const FILMU_BASE = 'https://embed.filmu.in';
const VIDNEST_BASE = 'https://vidnest.fun';
const VIDZEE_BASE = 'https://player.vidzee.wtf';

const preconnectedOrigins = new Set();
const prefetchedUrls = new Set();

const getOrigin = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const addHeadLink = ({ rel, href, as }) => {
  if (typeof document === 'undefined' || !href) return;
  const key = `${rel}:${href}`;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  link.dataset.streamzonePrewarm = key;
  if (as) link.as = as;
  document.head.appendChild(link);
};

// ============================================================================
// VERIFIED ACTIVE STREAMING SERVERS CATALOG
// Only servers verified via live HTTP probe to return 200 OK and stream media.
// Broken / 404 / timed-out / dead hosts have been removed.
// ============================================================================
export const STREAM_SERVERS_CATALOG = [
  {
    id: 'vidfast',
    name: 'Vidfast',
    flag: '🇬🇧',
    country: 'GB',
    tier: 'primary',
    getMovieUrl: (id) => `${VIDFAST_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDFAST_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink Pro',
    flag: '🇺🇸',
    country: 'US',
    tier: 'primary',
    getMovieUrl: (id) => `${VIDLINK_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDLINK_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'primesrc',
    name: 'Primesrc',
    flag: '🇦🇺',
    country: 'AU',
    tier: 'primary',
    getMovieUrl: (id) => `${PRIMESRC_BASE}/embed/movie?tmdb=${id}`,
    getTVUrl: (id, s, e) => `${PRIMESRC_BASE}/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: '2embed',
    name: '2Embed',
    flag: '🇦🇺',
    country: 'AU',
    tier: 'primary',
    getMovieUrl: (id) => `${EMBED2_BASE}/embed/${id}`,
    getTVUrl: (id, s, e) => `${EMBED2_BASE}/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: '111',
    name: '111 (VidSrc Mov)',
    flag: '🇬🇧',
    country: 'GB',
    tier: 'primary',
    getMovieUrl: (id) => `${VIDSRC_MOV_BASE}/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDSRC_MOV_BASE}/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-pm',
    name: 'VidSrc PM',
    flag: '🇺🇸',
    country: 'US',
    tier: 'mirror',
    getMovieUrl: (id) => `${VIDSRC_PM_BASE}/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDSRC_PM_BASE}/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidcore',
    name: 'Vidcore',
    flag: '🇮🇳',
    country: 'IN',
    tier: 'mirror',
    getMovieUrl: (id) => `${FILMU_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${FILMU_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidnest',
    name: 'Vidnest',
    flag: '🇬🇧',
    country: 'GB',
    tier: 'mirror',
    getMovieUrl: (id) => `${VIDNEST_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDNEST_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'bravo',
    name: 'Bravo (VidZee)',
    flag: '🇬🇧',
    country: 'GB',
    tier: 'mirror',
    getMovieUrl: (id) => `${VIDZEE_BASE}/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDZEE_BASE}/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'netflix',
    name: 'Netflix HD',
    flag: '🇺🇸',
    country: 'US',
    tier: 'mirror',
    getMovieUrl: (id) => `${FILMU_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${FILMU_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'nhd',
    name: 'NHD Streams',
    flag: '🇮🇳',
    country: 'IN',
    tier: 'mirror',
    getMovieUrl: (id) => `${FILMU_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${FILMU_BASE}/tv/${id}/${s}/${e}`,
  },
];

// Combine all servers
export const ALL_STREAM_SERVERS = [...STREAM_SERVERS_CATALOG];

// Custom User Added Servers (LocalStorage)
export const getCustomServers = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_stream_servers') : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomServer = (custom) => {
  try {
    const list = getCustomServers();
    const updated = [...list, custom];
    localStorage.setItem('custom_stream_servers', JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

// ============================================================================
// PRECONNECT & PREWARM ENGINE
// ============================================================================
export const preconnectStreamingProviders = () => {
  const origins = [
    VIDFAST_BASE,
    VIDLINK_BASE,
    PRIMESRC_BASE,
    EMBED2_BASE,
    VIDSRC_MOV_BASE,
    VIDSRC_PM_BASE,
    FILMU_BASE,
    VIDNEST_BASE,
    VIDZEE_BASE,
    ANIME_PLAYER,
    API_URL,
  ];

  origins
    .map(getOrigin)
    .filter(Boolean)
    .forEach(origin => {
      if (preconnectedOrigins.has(origin)) return;
      preconnectedOrigins.add(origin);
      addHeadLink({ rel: 'dns-prefetch', href: origin });
      addHeadLink({ rel: 'preconnect', href: origin });
    });
};

export const prewarmStreamUrl = (url) => {
  if (!url) return;
  preconnectStreamingProviders();
  const origin = getOrigin(url);
  if (origin && !preconnectedOrigins.has(origin)) {
    preconnectedOrigins.add(origin);
    addHeadLink({ rel: 'dns-prefetch', href: origin });
    addHeadLink({ rel: 'preconnect', href: origin });
  }
};

// ============================================================================
// INDIVIDUAL URL GENERATORS (ALL POINTING TO VERIFIED WORKING ENDPOINTS)
// ============================================================================
export const getMovieEmbedUrl = (tmdbId) => `${VIDFAST_BASE}/movie/${tmdbId}`;
export const getTVEmbedUrl = (tmdbId, season, episode) => `${VIDFAST_BASE}/tv/${tmdbId}/${season}/${episode}`;

export const getMovieEmbedUrlV2 = (tmdbId) => `${VIDLINK_BASE}/movie/${tmdbId}`;
export const getTVEmbedUrlV2 = (tmdbId, season, episode) => `${VIDLINK_BASE}/tv/${tmdbId}/${season}/${episode}`;

export const getVidSrcMovieEmbedUrl = (tmdbId) => `${VIDSRC_MOV_BASE}/embed/movie/${tmdbId}`;
export const getVidSrcTVEmbedUrl = (tmdbId, season, episode) => `${VIDSRC_MOV_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getPrimeSrcMovieUrl = (tmdbId) => `${PRIMESRC_BASE}/embed/movie?tmdb=${tmdbId}`;
export const getPrimeSrcTVUrl = (tmdbId, season, episode) => `${PRIMESRC_BASE}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;

export const get2EmbedMovieUrl = (tmdbId) => `${EMBED2_BASE}/embed/${tmdbId}`;
export const get2EmbedTVUrl = (tmdbId, season, episode) => `${EMBED2_BASE}/embedtv/${tmdbId}&s=${season}&e=${episode}`;

export const getVidLinkMovieUrl = (tmdbId) => `${VIDLINK_BASE}/movie/${tmdbId}`;
export const getVidLinkTVUrl = (tmdbId, season, episode) => `${VIDLINK_BASE}/tv/${tmdbId}/${season}/${episode}`;

// Backwards-compatible aliases for legacy callers
export const getMoviesApiMovieUrl = (tmdbId) => `${VIDFAST_BASE}/movie/${tmdbId}`;
export const getMoviesApiTVUrl = (tmdbId, season, episode) => `${VIDFAST_BASE}/tv/${tmdbId}/${season}/${episode}`;
export const getVidsrcMeMovieUrl = (tmdbId) => `${VIDSRC_PM_BASE}/embed/movie/${tmdbId}`;
export const getVidsrcMeTVUrl = (tmdbId, season, episode) => `${VIDSRC_PM_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;
export const getSuperEmbedMovieUrl = (tmdbId) => `${EMBED2_BASE}/embed/${tmdbId}`;
export const getSuperEmbedTVUrl = (tmdbId, season, episode) => `${EMBED2_BASE}/embedtv/${tmdbId}&s=${season}&e=${episode}`;
export const getAutoEmbedMovieUrl = (tmdbId) => `${VIDLINK_BASE}/movie/${tmdbId}`;
export const getAutoEmbedTVUrl = (tmdbId, season, episode) => `${VIDLINK_BASE}/tv/${tmdbId}/${season}/${episode}`;
export const getVidSrcVipMovieUrl = (tmdbId) => `${VIDSRC_MOV_BASE}/embed/movie/${tmdbId}`;
export const getVidSrcVipTVUrl = (tmdbId, season, episode) => `${VIDSRC_MOV_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

// ============================================================================
// CANDIDATE GENERATORS (CONSTELLATION DIRECT HLS + VERIFIED FALLBACKS)
// ============================================================================
export const getBingrCandidates = (tmdbId, category = 'movie', season = 1, episode = 1) => {
  return BINGR_SERVERS.map(server => ({
    id: `bingr-${server.id}`,
    srv: server.srv,
    label: server.name,
    name: server.name,
    flag: server.flag,
    country: server.country,
    tier: 'constellation',
    isDirectHls: true,
    isBingr: true,
    badge: server.badge,
    desc: server.desc,
    isPrimary: server.isPrimary,
    src: `/api/streaming/bingr/stream?srv=${server.srv}&id=${tmdbId}&type=${category}`,
    style: 'cyan',
    isCustom: false,
  }));
};

export const getMovieStreamCandidates = (tmdbId) => {
  const constellation = getBingrCandidates(tmdbId, 'movie');

  const custom = getCustomServers().map(c => ({
    id: c.id || `custom-${c.name}`,
    label: c.name,
    flag: c.flag || '🌐',
    country: c.country || 'CUSTOM',
    src: c.movieUrlTemplate ? c.movieUrlTemplate.replace('{id}', tmdbId) : c.url,
    style: 'purple',
    isCustom: true,
  }));

  const standard = STREAM_SERVERS_CATALOG.map(server => ({
    id: server.id,
    label: server.name,
    flag: server.flag,
    country: server.country,
    tier: server.tier,
    src: server.getMovieUrl(tmdbId),
    style: 'purple',
    isCustom: false,
  }));

  return [...constellation, ...custom, ...standard];
};

export const getTVStreamCandidates = (tmdbId, season, episode) => {
  const constellation = getBingrCandidates(tmdbId, 'tv', season, episode);

  const custom = getCustomServers().map(c => ({
    id: c.id || `custom-${c.name}`,
    label: c.name,
    flag: c.flag || '🌐',
    country: c.country || 'CUSTOM',
    src: c.tvUrlTemplate
      ? c.tvUrlTemplate.replace('{id}', tmdbId).replace('{s}', season).replace('{e}', episode)
      : c.url,
    style: 'purple',
    isCustom: true,
  }));

  const standard = STREAM_SERVERS_CATALOG.map(server => ({
    id: server.id,
    label: server.name,
    flag: server.flag,
    country: server.country,
    tier: server.tier,
    src: server.getTVUrl(tmdbId, season, episode),
    style: 'purple',
    isCustom: false,
  }));

  return [...constellation, ...custom, ...standard];
};

// Anime Candidates (Only verified 200 OK)
export const getAnimeEmbedUrl = (anilistId, episode, { dub = false } = {}) => {
  const params = new URLSearchParams({
    servericon: 'true',
    pip: 'true',
  });
  const language = dub ? 'dub' : 'sub';

  return `${ANIME_PLAYER}/animepahe/${anilistId}/${episode}/${language}?${params.toString()}`;
};

export const getFilmuAnimeUrl = (tmdbOrAnilistId, episode) => `${FILMU_BASE}/anime/${tmdbOrAnilistId}/${episode}`;

export const getAnimeStreamCandidates = (anilistId, episode, options = {}) => ([
  { id: 'vidnest-anime', label: 'Vidnest Pahe', flag: '🇬🇧', country: 'GB', src: getAnimeEmbedUrl(anilistId, episode, options), style: 'purple' },
  { id: 'filmu-anime', label: 'Filmu Anime', flag: '🇮🇳', country: 'IN', src: getFilmuAnimeUrl(anilistId, episode), style: 'purple' },
  { id: 'hianime-anime', label: 'AniWatch', flag: '🇯🇵', country: 'JP', src: `https://hianimez.to/watch/${anilistId}?ep=${episode}`, style: 'orange' },
]);

export const prewarmStreamCandidates = (candidates = []) => {
  candidates.slice(0, 10).forEach(candidate => prewarmStreamUrl(candidate?.src));
};

// ============================================================================
// ULTRA-FAST HEALTH CHECK & PRE-FLIGHT PROBING ENGINE
// ============================================================================
// ULTRA-FAST REAL-TIME PARALLEL SERVER RACING ENGINE (< 10 SECONDS)
// ============================================================================
const healthCache = new Map();

/**
 * Probe a single server (Constellation direct HLS or Web embed) with live millisecond latency
 */
export const probeCandidateServer = async (candidate, config = {}, { timeoutMs = 2800 } = {}) => {
  if (!candidate) return { status: 'unknown', ping: 0, label: 'Unknown' };
  const startTime = performance.now();
  const isConstellation = Boolean(candidate.isBingr || candidate.isDirectHls || candidate.srv);

  if (isConstellation) {
    try {
      const data = await fetchBingrStream({
        srv: candidate.srv || 's70',
        type: config.category || 'movie',
        id: config.id,
        title: config.title,
        year: config.year,
        season: config.season,
        episode: config.episode,
        timeoutMs,
      });
      const ping = Math.max(1, Math.round(performance.now() - startTime));
      if (data && Array.isArray(data.sources) && data.sources.length > 0) {
        return {
          status: 'online',
          ping,
          label: `${ping}ms`,
          type: 'hls',
          sourcesCount: data.sources.length,
          subtitlesCount: Array.isArray(data.subtitles) ? data.subtitles.length : 0,
          streamData: data,
        };
      }
      return {
        status: 'unreachable',
        ping,
        label: 'No Stream',
        type: 'hls',
      };
    } catch (err) {
      const ping = Math.max(1, Math.round(performance.now() - startTime));
      return {
        status: err?.name === 'AbortError' ? 'degraded' : 'unreachable',
        ping,
        label: err?.name === 'AbortError' ? 'Timeout' : 'Offline',
        type: 'hls',
      };
    }
  }

  // Web Server Embed Probe
  const targetUrl = candidate.src;
  const origin = getOrigin(targetUrl);
  if (!origin) {
    return { status: 'unknown', ping: 0, label: 'Unknown', type: 'embed' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    await fetch(origin, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const ping = Math.max(1, Math.round(performance.now() - startTime));
    return {
      status: 'online',
      ping,
      label: `${ping}ms`,
      type: 'embed',
      origin,
    };
  } catch (err) {
    const ping = Math.max(1, Math.round(performance.now() - startTime));
    return {
      status: err?.name === 'AbortError' ? 'degraded' : 'unreachable',
      ping,
      label: err?.name === 'AbortError' ? 'Timeout' : 'Offline',
      type: 'embed',
      origin,
    };
  }
};

/**
 * Real-time parallel race across all Constellation and Web servers (< 3s total)
 * Fires onFirstWinner the millisecond the first working stream is found!
 */
export const raceAllServersParallel = async (
  candidates = [],
  config = {},
  {
    timeoutMs = 2800,
    onCandidateTested,
    onFirstWinner,
  } = {}
) => {
  let hasReportedWinner = false;
  const results = new Map();

  const probePromises = candidates.map(async (candidate, index) => {
    try {
      const health = await probeCandidateServer(candidate, config, { timeoutMs });
      const key = candidate.id || candidate.src || String(index);
      results.set(key, health);

      if (typeof onCandidateTested === 'function') {
        onCandidateTested(index, candidate, health);
      }

      if (!hasReportedWinner && health.status === 'online') {
        hasReportedWinner = true;
        if (typeof onFirstWinner === 'function') {
          onFirstWinner(index, candidate, health);
        }
      }

      return { index, candidate, health };
    } catch {
      const fallback = { status: 'unreachable', ping: 0, label: 'Failed' };
      const key = candidate.id || candidate.src || String(index);
      results.set(key, fallback);
      if (typeof onCandidateTested === 'function') {
        onCandidateTested(index, candidate, fallback);
      }
      return { index, candidate, health: fallback };
    }
  });

  await Promise.allSettled(probePromises);
  return results;
};

export const checkStreamProviderHealth = async (url, { timeoutMs = 1400, skipCache = false } = {}) => {
  const origin = getOrigin(url);
  if (!origin) return { status: 'unknown', label: 'Unknown provider', origin };

  if (!skipCache && healthCache.has(origin)) {
    const cached = healthCache.get(origin);
    if (Date.now() - cached.timestamp < 30000) {
      return cached.result;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(origin, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const result = { status: 'online', label: 'Online', origin };
    healthCache.set(origin, { result, timestamp: Date.now() });
    return result;
  } catch (err) {
    const result = err.name === 'AbortError'
      ? { status: 'degraded', label: 'Slow / Timeout', origin }
      : { status: 'unreachable', label: 'Offline / Blocked', origin };
    healthCache.set(origin, { result, timestamp: Date.now() });
    return result;
  }
};

export const fastProbeCandidates = async (candidates = [], { maxProbe = 8, timeoutMs = 1200 } = {}) => {
  const targets = candidates.slice(0, maxProbe);
  const results = await Promise.allSettled(
    targets.map(c => checkStreamProviderHealth(c.src, { timeoutMs }))
  );
  return results.map((r, i) => ({
    index: i,
    candidate: targets[i],
    health: r.status === 'fulfilled' ? r.value : { status: 'unreachable', label: 'Offline / Blocked', origin: getOrigin(targets[i]?.src) },
  }));
};

// ============================================================================
// RUNTIME HELPERS (FULL BACKWARD COMPATIBILITY)
// ============================================================================
export const resolveAnimePlayback = async ({ anilistId, title, titles = [], episode = 1, language = 'sub' }) => {
  const params = new URLSearchParams({
    anilistId: String(anilistId || ''),
    title: title || '',
    titles: titles.filter(Boolean).join('|||'),
    episode: String(episode),
    language,
  });

  const response = await fetch(`${API_URL}/api/streaming/anime/play?${params.toString()}`);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : { error: await response.text().catch(() => '') };

  if (!response.ok) {
    if (response.status === 404 && String(data.error).includes('Cannot GET /api/streaming/anime/play')) {
      throw new Error('Anime streaming server is not deployed yet');
    }
    throw new Error(data.error || 'Anime episode is unavailable');
  }
  return data;
};

export const buildEmbedUrl = (config) => {
  const { category, tmdbId, season, episode, useV2, provider } = config;

  switch (category) {
    case 'movie':
      if (provider === 'vidsrc') return getVidSrcMovieEmbedUrl(tmdbId);
      if (provider === 'primesrc') return getPrimeSrcMovieUrl(tmdbId);
      if (provider === '2embed') return get2EmbedMovieUrl(tmdbId);
      if (provider === 'vidlink') return getVidLinkMovieUrl(tmdbId);
      return useV2
        ? getMovieEmbedUrlV2(tmdbId)
        : getMovieEmbedUrl(tmdbId);

    case 'tv':
      if (provider === 'vidsrc') return getVidSrcTVEmbedUrl(tmdbId, season, episode);
      if (provider === 'primesrc') return getPrimeSrcTVUrl(tmdbId, season, episode);
      if (provider === '2embed') return get2EmbedTVUrl(tmdbId, season, episode);
      if (provider === 'vidlink') return getVidLinkTVUrl(tmdbId, season, episode);
      return useV2
        ? getTVEmbedUrlV2(tmdbId, season, episode)
        : getTVEmbedUrl(tmdbId, season, episode);

    case 'anime':
      return getAnimeEmbedUrl(config.anilistId || config.id, episode, {
        dub: config.dub,
      });

    default:
      throw new Error(`Unknown or non-iframe category: ${category}`);
  }
};
