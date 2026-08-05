const VIDZEE = (import.meta.env.VITE_VIDZEE_PLAYER || 'https://player.vidzee.wtf').replace(/\/+$/, '');
const VIDSRC_MOV = (import.meta.env.VITE_VIDSRC_MOV_PLAYER || 'https://vidsrc.mov').replace(/\/+$/, '');
const ANIME_PLAYER = (import.meta.env.VITE_ANIME_PLAYER || 'https://vidnest.fun').replace(/\/+$/, '');
const API_URL = (import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com').replace(/\/+$/, '');

const MOVIESAPI_BASE = 'https://moviesapi.club';
const VIDSRC_ME_BASE = 'https://vidsrc.me';
const SUPEREMBED_BASE = 'https://multiembed.mov';
const EMBED2_BASE = 'https://www.2embed.cc';
const AUTOEMBED_BASE = 'https://player.autoembed.cc';
const PRIMESRC_BASE = 'https://primesrc.me';
const VIDSRC_VIP_BASE = 'https://vidsrc.vip';

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

export const preconnectStreamingProviders = () => {
  [
    VIDZEE,
    VIDSRC_MOV,
    ANIME_PLAYER,
    API_URL,
    MOVIESAPI_BASE,
    VIDSRC_ME_BASE,
    SUPEREMBED_BASE,
    EMBED2_BASE,
    AUTOEMBED_BASE,
    PRIMESRC_BASE,
    VIDSRC_VIP_BASE,
  ]
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
  if (prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);
  addHeadLink({ rel: 'prefetch', href: url, as: 'document' });
};

// Base Embed Generators
export const getMovieEmbedUrl = (tmdbId) =>
  `${VIDZEE}/embed/movie/${tmdbId}`;

export const getTVEmbedUrl = (tmdbId, season, episode) =>
  `${VIDZEE}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getMovieEmbedUrlV2 = (tmdbId) =>
  `${VIDZEE}/v2/embed/movie/${tmdbId}`;

export const getTVEmbedUrlV2 = (tmdbId, season, episode) =>
  `${VIDZEE}/v2/embed/tv/${tmdbId}/${season}/${episode}`;

export const getVidSrcMovieEmbedUrl = (tmdbId) =>
  `${VIDSRC_MOV}/embed/movie/${tmdbId}`;

export const getVidSrcTVEmbedUrl = (tmdbId, season, episode) =>
  `${VIDSRC_MOV}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getMoviesApiMovieUrl = (tmdbId) => `${MOVIESAPI_BASE}/movie/${tmdbId}`;
export const getMoviesApiTVUrl = (tmdbId, season, episode) => `${MOVIESAPI_BASE}/tv/${tmdbId}-${season}-${episode}`;

export const getVidsrcMeMovieUrl = (tmdbId) => `${VIDSRC_ME_BASE}/embed/movie/${tmdbId}`;
export const getVidsrcMeTVUrl = (tmdbId, season, episode) => `${VIDSRC_ME_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getSuperEmbedMovieUrl = (tmdbId) => `${SUPEREMBED_BASE}/directstream.php?video_id=${tmdbId}&tmdb=1`;
export const getSuperEmbedTVUrl = (tmdbId, season, episode) => `${SUPEREMBED_BASE}/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;

export const get2EmbedMovieUrl = (tmdbId) => `${EMBED2_BASE}/embed/${tmdbId}`;
export const get2EmbedTVUrl = (tmdbId, season, episode) => `${EMBED2_BASE}/embedtv/${tmdbId}&s=${season}&e=${episode}`;

export const getAutoEmbedMovieUrl = (tmdbId) => `${AUTOEMBED_BASE}/embed/movie/${tmdbId}`;
export const getAutoEmbedTVUrl = (tmdbId, season, episode) => `${AUTOEMBED_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getPrimeSrcMovieUrl = (tmdbId) => `${PRIMESRC_BASE}/embed/movie?tmdb=${tmdbId}`;
export const getPrimeSrcTVUrl = (tmdbId, season, episode) => `${PRIMESRC_BASE}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;

export const getVidSrcVipMovieUrl = (tmdbId) => `${VIDSRC_VIP_BASE}/embed/movie/${tmdbId}`;
export const getVidSrcVipTVUrl = (tmdbId, season, episode) => `${VIDSRC_VIP_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getMovieStreamCandidates = (tmdbId) => ([
  { label: 'Source 1', src: getMoviesApiMovieUrl(tmdbId), style: 'orange' },
  { label: 'Source 2', src: getVidsrcMeMovieUrl(tmdbId), style: 'orange' },
  { label: 'Source 3', src: getSuperEmbedMovieUrl(tmdbId), style: 'orange' },
  { label: 'Source 4', src: get2EmbedMovieUrl(tmdbId), style: 'orange' },
  { label: 'Source 5', src: getAutoEmbedMovieUrl(tmdbId), style: 'orange' },
  { label: 'Source 6', src: getPrimeSrcMovieUrl(tmdbId), style: 'purple' },
  { label: 'Source 7', src: getMovieEmbedUrl(tmdbId), style: 'orange' },
  { label: 'Source 8', src: getMovieEmbedUrlV2(tmdbId), style: 'orange' },
  { label: 'Source 9', src: getVidSrcMovieEmbedUrl(tmdbId), style: 'orange' },
  { label: 'Source 10', src: getVidSrcVipMovieUrl(tmdbId), style: 'purple' },
]);

export const getTVStreamCandidates = (tmdbId, season, episode) => ([
  { label: 'Source 1', src: getMoviesApiTVUrl(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 2', src: getVidsrcMeTVUrl(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 3', src: getSuperEmbedTVUrl(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 4', src: get2EmbedTVUrl(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 5', src: getAutoEmbedTVUrl(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 6', src: getPrimeSrcTVUrl(tmdbId, season, episode), style: 'purple' },
  { label: 'Source 7', src: getTVEmbedUrl(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 8', src: getTVEmbedUrlV2(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 9', src: getVidSrcTVEmbedUrl(tmdbId, season, episode), style: 'orange' },
  { label: 'Source 10', src: getVidSrcVipTVUrl(tmdbId, season, episode), style: 'purple' },
]);

export const getAnimeEmbedUrl = (anilistId, episode, { dub = false } = {}) => {
  const params = new URLSearchParams({
    servericon: 'true',
    pip: 'true',
  });
  const language = dub ? 'dub' : 'sub';

  return `${ANIME_PLAYER}/animepahe/${anilistId}/${episode}/${language}?${params.toString()}`;
};

export const getAnimeStreamCandidates = (anilistId, episode, options = {}) => ([
  { label: 'Source 1', src: getAnimeEmbedUrl(anilistId, episode, options), style: 'purple' },
  { label: 'Source 2', src: `https://hianimez.to/watch/${anilistId}?ep=${episode}`, style: 'orange' },
]);

export const prewarmStreamCandidates = (candidates = []) => {
  candidates.forEach(candidate => prewarmStreamUrl(candidate?.src));
};

export const checkStreamProviderHealth = async (url) => {
  const origin = getOrigin(url);
  if (!origin) return { status: 'unknown', label: 'Unknown provider' };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    await fetch(origin, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { status: 'online', label: 'Provider Online' };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { status: 'degraded', label: 'Provider Slow / Timeout' };
    }
    return { status: 'unreachable', label: 'Provider Unreachable' };
  }
};

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
      if (provider === 'moviesapi') return getMoviesApiMovieUrl(tmdbId);
      if (provider === 'vidsrcme') return getVidsrcMeMovieUrl(tmdbId);
      if (provider === 'superembed') return getSuperEmbedMovieUrl(tmdbId);
      if (provider === '2embed') return get2EmbedMovieUrl(tmdbId);
      if (provider === 'autoembed') return getAutoEmbedMovieUrl(tmdbId);
      if (provider === 'primesrc') return getPrimeSrcMovieUrl(tmdbId);
      return useV2
        ? getMovieEmbedUrlV2(tmdbId)
        : getMovieEmbedUrl(tmdbId);

    case 'tv':
      if (provider === 'vidsrc') return getVidSrcTVEmbedUrl(tmdbId, season, episode);
      if (provider === 'moviesapi') return getMoviesApiTVUrl(tmdbId, season, episode);
      if (provider === 'vidsrcme') return getVidsrcMeTVUrl(tmdbId, season, episode);
      if (provider === 'superembed') return getSuperEmbedTVUrl(tmdbId, season, episode);
      if (provider === '2embed') return get2EmbedTVUrl(tmdbId, season, episode);
      if (provider === 'autoembed') return getAutoEmbedTVUrl(tmdbId, season, episode);
      if (provider === 'primesrc') return getPrimeSrcTVUrl(tmdbId, season, episode);
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

