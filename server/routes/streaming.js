const crypto = require('crypto');
const express = require('express');
const { Readable } = require('stream');

const router = express.Router();

const TOKEN_TTL_SECONDS = 45 * 60;
const HIANIME_SEARCH_PATH = '/api/v2/hianime/search';

const getProxySecret = () => (
    process.env.STREAM_PROXY_SECRET ||
    process.env.JWT_SECRET ||
    'streaming_proxy_dev_secret'
);

const getHiAnimeBaseUrl = () => {
    const baseUrl = process.env.HIANIME_API_BASE_URL;
    if (!baseUrl) return null;
    const normalized = baseUrl.replace(/\/+$/, '');
    return /^https?:\/\//i.test(normalized) ? normalized : `http://${normalized}`;
};

const normalizeTitle = (value = '') => (
    String(value)
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
);

const safeJson = async (response) => {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Invalid JSON from upstream (${response.status})`);
    }
};

const uniqueValues = (values) => (
    [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
);

const getTitleCandidates = (title, titles) => {
    const aliases = String(titles || '')
        .split('|||')
        .map((value) => value.trim());

    return uniqueValues([title, ...aliases]);
};

const hianimeFetch = async (path, params = {}) => {
    const baseUrl = getHiAnimeBaseUrl();
    if (!baseUrl) {
        const error = new Error('HIANIME_API_BASE_URL is not configured');
        error.statusCode = 503;
        throw error;
    }

    const url = new URL(path, `${baseUrl}/`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'Categloge-StreamZone/1.0'
        }
    });

    const json = await safeJson(response);
    if (!response.ok || json.success === false) {
        const message = json.message || json.error || `HiAnime request failed (${response.status})`;
        const error = new Error(message);
        error.statusCode = response.status || 502;
        throw error;
    }
    return json.data || json;
};

const pickBestAnime = (animes, requestedTitle) => {
    if (!Array.isArray(animes) || animes.length === 0) return null;

    const wanted = normalizeTitle(requestedTitle);
    return animes.find((anime) => normalizeTitle(anime.name) === wanted)
        || animes.find((anime) => normalizeTitle(anime.jname) === wanted)
        || animes.find((anime) => normalizeTitle(anime.name).includes(wanted))
        || animes.find((anime) => wanted.includes(normalizeTitle(anime.name)))
        || animes[0];
};

const pickEpisode = (episodes, episodeNumber) => {
    if (!Array.isArray(episodes) || episodes.length === 0) return null;
    return episodes.find((episode) => Number(episode.number) === Number(episodeNumber))
        || episodes[Math.max(0, Number(episodeNumber) - 1)]
        || episodes[0];
};

const pickServerCandidates = (servers, language) => {
    const fromApi = Array.isArray(servers?.[language])
        ? servers[language].map((server) => server.serverName).filter(Boolean)
        : [];

    return [
        ...fromApi,
        'hd-1',
        'hd-2',
        'vidstreaming',
        'megacloud'
    ].filter((server, index, all) => server && all.indexOf(server) === index);
};

const signPayload = (payload) => {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', getProxySecret())
        .update(body)
        .digest('base64url');
    return `${body}.${signature}`;
};

const readToken = (token) => {
    const [body, signature] = String(token || '').split('.');
    if (!body || !signature) return null;

    const expected = crypto
        .createHmac('sha256', getProxySecret())
        .update(body)
        .digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
};

const buildPublicProxyUrl = (req, url, headers = {}) => {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('host');
    const token = signPayload({
        url,
        headers,
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
    });
    return `${proto}://${host}/api/streaming/proxy?token=${encodeURIComponent(token)}`;
};

const rewritePlaylistUrl = (req, value, baseUrl, headers) => {
    const absoluteUrl = new URL(value, baseUrl).toString();
    return buildPublicProxyUrl(req, absoluteUrl, headers);
};

const rewritePlaylist = (req, playlist, baseUrl, headers) => {
    return playlist
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/g, (_match, uri) => (
                    `URI="${rewritePlaylistUrl(req, uri, baseUrl, headers)}"`
                ));
            }

            return rewritePlaylistUrl(req, trimmed, baseUrl, headers);
        })
        .join('\n');
};

router.get('/anime/play', async (req, res) => {
    try {
        const { title, titles, episode = '1', language = 'sub' } = req.query;
        const episodeNumber = Number(episode);
        const category = ['sub', 'dub', 'raw'].includes(language) ? language : 'sub';

        if (!title || !Number.isFinite(episodeNumber) || episodeNumber < 1) {
            return res.status(400).json({ error: 'Missing or invalid title/episode' });
        }

        const titleCandidates = getTitleCandidates(title, titles);
        let selectedAnime = null;
        for (const candidate of titleCandidates) {
            const searchData = await hianimeFetch(HIANIME_SEARCH_PATH, { q: candidate, page: 1 });
            selectedAnime = pickBestAnime(searchData.animes, candidate);
            if (selectedAnime?.id) break;
        }

        if (!selectedAnime?.id) {
            return res.status(404).json({ error: 'Anime unavailable from streaming provider' });
        }

        const episodeData = await hianimeFetch(`/api/v2/hianime/anime/${encodeURIComponent(selectedAnime.id)}/episodes`);
        const selectedEpisode = pickEpisode(episodeData.episodes, episodeNumber);
        if (!selectedEpisode?.episodeId) {
            return res.status(404).json({ error: `Episode ${episodeNumber} unavailable` });
        }

        const serverData = await hianimeFetch('/api/v2/hianime/episode/servers', {
            animeEpisodeId: selectedEpisode.episodeId
        }).catch(() => null);

        const serverCandidates = pickServerCandidates(serverData, category);
        let sourceData = null;
        let selectedServer = null;

        for (const server of serverCandidates) {
            try {
                const data = await hianimeFetch('/api/v2/hianime/episode/sources', {
                    animeEpisodeId: selectedEpisode.episodeId,
                    server,
                    category
                });
                if (Array.isArray(data.sources) && data.sources.length > 0) {
                    sourceData = data;
                    selectedServer = server;
                    break;
                }
            } catch {
                // Try the next server candidate.
            }
        }

        if (!sourceData) {
            return res.status(404).json({ error: 'No playable source found for this episode' });
        }

        const source = sourceData.sources.find((item) => item.isM3U8) || sourceData.sources[0];
        const headers = sourceData.headers || {};
        const subtitles = Array.isArray(sourceData.subtitles)
            ? sourceData.subtitles.map((subtitle) => ({
                lang: subtitle.lang,
                url: buildPublicProxyUrl(req, subtitle.url, headers)
            }))
            : [];

        res.json({
            mode: 'hls',
            src: buildPublicProxyUrl(req, source.url, headers),
            title: selectedAnime.name || title,
            category: 'anime',
            episode: Number(selectedEpisode.number) || episodeNumber,
            episodeTitle: selectedEpisode.title || `Episode ${episodeNumber}`,
            posterUrl: selectedAnime.poster || null,
            subtitles,
            provider: {
                animeId: selectedAnime.id,
                episodeId: selectedEpisode.episodeId,
                server: selectedServer,
                language: category
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            error: statusCode === 503 ? error.message : 'Anime playback could not be resolved',
            details: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
});

const zlib = require('zlib');

const openSubtitlesHeaders = () => ({
    'Api-Key': process.env.OPENSUBTITLES_API_KEY || '',
    'User-Agent': 'Categloge-StreamZone/1.0',
    Accept: 'application/json',
});

const getOpenSubtitlesV1Results = async ({ query, imdbId, season, episode, category, request }) => {
    const apiKey = process.env.OPENSUBTITLES_API_KEY;
    if (!apiKey || !query) return [];

    const params = new URLSearchParams({ query });
    if (imdbId) params.set('imdb_id', String(imdbId).replace(/^tt/i, ''));
    if (season) params.set('season_number', String(season));
    if (episode) params.set('episode_number', String(episode));
    if (category === 'tv') params.set('type', 'tv');

    const response = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?${params.toString()}`, {
        headers: openSubtitlesHeaders(),
    });
    if (!response.ok) throw new Error(`OpenSubtitles API search failed (${response.status})`);

    const data = await response.json();
    const proto = request.get('x-forwarded-proto') || request.protocol || 'https';
    const host = request.get('host');
    return (data.data || []).slice(0, 40).flatMap((item) => {
        const attributes = item.attributes || {};
        const file = Array.isArray(attributes.files) ? attributes.files[0] : null;
        if (!file?.file_id) return [];
        return [{
            id: String(file.file_id),
            label: `${attributes.language || 'Unknown'} - ${attributes.release || attributes.feature_details?.title || 'Subtitle'}`,
            language: attributes.language || 'Unknown',
            rating: String(attributes.ratings || '0'),
            downloads: String(attributes.download_count || '0'),
            downloadUrl: `${proto}://${host}/api/streaming/subtitles/download?fileId=${encodeURIComponent(file.file_id)}`,
            source: 'OpenSubtitles',
            format: file.file_name?.split('.').pop() || 'srt',
        }];
    });
};

const buildSubtitleDownloadUrl = (request, url) => {
    const proto = request.get('x-forwarded-proto') || request.protocol || 'https';
    const host = request.get('host');
    return `${proto}://${host}/api/streaming/subtitles/download?url=${encodeURIComponent(url)}`;
};

const getSubdlResults = async ({ query, imdbId, tmdbId, season, episode, category, request }) => {
    const apiKey = process.env.SUBDL_API_KEY;
    if (!apiKey || (!query && !imdbId && !tmdbId)) return [];

    const params = new URLSearchParams({
        api_key: apiKey,
        type: category === 'tv' || category === 'anime' ? 'tv' : 'movie',
        languages: 'EN',
        unpack: '1',
        subs_per_page: '30',
        client: 'custom_integration',
    });
    if (query) params.set('film_name', query);
    if (imdbId) params.set('imdb_id', imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`);
    if (tmdbId) params.set('tmdb_id', tmdbId);
    if (season) params.set('season_number', String(season));
    if (episode) params.set('episode_number', String(episode));

    const response = await fetch(`https://api.subdl.com/api/v1/subtitles?${params.toString()}`, {
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Subdl search failed (${response.status})`);

    const data = await response.json();
    if (!data.status || !Array.isArray(data.subtitles)) return [];

    const results = [];
    for (const subtitle of data.subtitles) {
        if (!subtitle?.url) continue;

        // Subdl's individual `unpack_files` URLs can return 404 for free keys.
        // The parent archive URL is reliable and our download route extracts its
        // first subtitle file before returning it to the browser.
        const downloadUrl = new URL(subtitle.url, 'https://dl.subdl.com');
        downloadUrl.search = '';
        results.push({
            id: String(subtitle.url),
            label: `${subtitle.language || 'English'} - ${subtitle.release_name || subtitle.name || 'Subtitle'}`,
            language: subtitle.language || 'English',
            rating: String(subtitle.rating || '0'),
            downloads: String(subtitle.download_count || '0'),
            downloadUrl: buildSubtitleDownloadUrl(request, downloadUrl.toString()),
            source: 'Subdl',
            format: 'srt',
        });
        if (results.length === 30) return results;
    }
    return results;
};

router.get('/subtitles/search', async (req, res) => {
    try {
        const { query = '', imdbId = '', tmdbId = '', season, episode, category = 'movie' } = req.query;
        let targetImdbId = imdbId ? String(imdbId).replace(/^tt/, '') : '';
        const tmdbKey = process.env.TMDB_API_KEY || 'aec06bf784ea079c469980766c06e16d';

        // 1. If tmdbId is numeric (e.g. 863), resolve IMDb ID from TMDB external_ids
        if (!targetImdbId && tmdbId && !isNaN(Number(tmdbId))) {
            try {
                const type = category === 'tv' ? 'tv' : 'movie';
                const tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${tmdbKey}`);
                if (tmdbRes.ok) {
                    const ids = await tmdbRes.json();
                    if (ids.imdb_id) targetImdbId = ids.imdb_id.replace(/^tt/, '');
                }
            } catch (e) {
                console.warn('TMDB external_ids fetch failed:', e);
            }
        }

        // 2. If no IMDb ID yet, search TMDB by title to find IMDb ID
        if (!targetImdbId && query) {
            try {
                const cleanSearch = encodeURIComponent(query.trim());
                const searchRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${cleanSearch}`);
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (Array.isArray(searchData.results) && searchData.results.length > 0) {
                        const topResult = searchData.results[0];
                        const type = topResult.media_type === 'tv' ? 'tv' : 'movie';
                        const extRes = await fetch(`https://api.themoviedb.org/3/${type}/${topResult.id}/external_ids?api_key=${tmdbKey}`);
                        if (extRes.ok) {
                            const extData = await extRes.json();
                            if (extData.imdb_id) targetImdbId = extData.imdb_id.replace(/^tt/, '');
                        }
                    }
                }
            } catch (e) {
                console.warn('TMDB multi search failed:', e);
            }
        }

        const results = [];

        // Primary: Subdl (free API key, no OpenSubtitles dependency).
        try {
            const subdlResults = await getSubdlResults({
                query,
                imdbId: targetImdbId,
                tmdbId: String(tmdbId || ''),
                season,
                episode,
                category,
                request: req,
            });
            if (subdlResults.length > 0) return res.json({ results: subdlResults });
        } catch (error) {
            console.warn('Subdl search failed:', error.message);
        }

        // Fallback: OpenSubtitles v1 API. Requires OPENSUBTITLES_API_KEY.
        try {
            const modernResults = await getOpenSubtitlesV1Results({
                query,
                imdbId: targetImdbId,
                season,
                episode,
                category,
                request: req,
            });
            if (modernResults.length > 0) return res.json({ results: modernResults });
        } catch (error) {
            console.warn('OpenSubtitles API search failed:', error.message);
        }

        res.json({ results });
    } catch (error) {
        console.error('Subtitle search error:', error);
        res.status(500).json({ error: 'Subtitle search failed', results: [] });
    }
});

// Minimal ZIP reader (built-in zlib only) for providers like Subdl that
// return zipped subtitle files. Supports STORE (0) and DEFLATE (8) methods.
const extractSubtitleFromZip = (buffer) => {
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    let offset = 0;
    while (offset + 30 <= buffer.length) {
        if (dv.getUint32(offset, true) !== 0x04034b50) break;
        const method = dv.getUint16(offset + 8, true);
        const compressedSize = dv.getUint32(offset + 18, true);
        const fileNameLen = dv.getUint16(offset + 26, true);
        const extraLen = dv.getUint16(offset + 28, true);
        const fileName = buffer.slice(offset + 30, offset + 30 + fileNameLen).toString('utf8');
        const dataStart = offset + 30 + fileNameLen + extraLen;
        const candidate = /\.(srt|vtt|ass|ssa)$/i.test(fileName);
        if (candidate) {
            const data = buffer.slice(dataStart, dataStart + compressedSize);
            if (method === 0) return data.toString('utf8');
            if (method === 8) return zlib.inflateRawSync(data).toString('utf8');
            return null;
        }
        offset = dataStart + compressedSize;
    }
    return null;
};

router.get('/subtitles/download', async (req, res) => {
    try {
        const { url, fileId } = req.query;
        let downloadUrl = url;

        if (fileId) {
            if (!process.env.OPENSUBTITLES_API_KEY) {
                return res.status(503).send('OpenSubtitles API key is not configured');
            }
            const linkResponse = await fetch('https://api.opensubtitles.com/api/v1/download', {
                method: 'POST',
                headers: {
                    ...openSubtitlesHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_id: Number(fileId) }),
            });
            if (!linkResponse.ok) return res.status(linkResponse.status).send('Subtitle link request failed');
            const linkData = await linkResponse.json();
            downloadUrl = linkData.link;
        }

        if (!downloadUrl) return res.status(400).send('Missing subtitle URL');

        const upstream = await fetch(downloadUrl, {
            headers: { 'User-Agent': 'TemporaryUserAgent' }
        });

        if (!upstream.ok) {
            return res.status(upstream.status).send('Subtitle download upstream failed');
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        // ZIP container (PK\x03\x04) — e.g. Subdl. Extract the first subtitle file.
        if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
            const extracted = extractSubtitleFromZip(buffer);
            if (extracted) return res.send(extracted);
            return res.status(422).send('Could not extract subtitle from archive');
        }

        // GZIP header (0x1f, 0x8b)
        if (buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
            zlib.gunzip(buffer, (err, decompressed) => {
                if (err) {
                    return res.send(buffer.toString('utf8'));
                }
                return res.send(decompressed.toString('utf8'));
            });
        } else {
            return res.send(buffer.toString('utf8'));
        }
    } catch (error) {
        console.error('Subtitle proxy download error:', error);
        res.status(500).send('Subtitle proxy failed');
    }
});

router.get('/proxy', async (req, res) => {
    try {
        const payload = readToken(req.query.token);
        if (!payload?.url) {
            return res.status(401).send('Invalid or expired stream token');
        }

        const upstream = await fetch(payload.url, {
            headers: payload.headers || {}
        });

        if (!upstream.ok) {
            return res.status(upstream.status).send('Upstream stream request failed');
        }

        const contentType = upstream.headers.get('content-type') || '';
        const isPlaylist = contentType.includes('mpegurl') || contentType.includes('m3u8') || payload.url.includes('.m3u8');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'private, max-age=60');

        if (isPlaylist) {
            const playlist = await upstream.text();
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(rewritePlaylist(req, playlist, payload.url, payload.headers || {}));
        }

        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        if (upstream.body) {
            return Readable.fromWeb(upstream.body).pipe(res);
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.send(buffer);
    } catch {
        res.status(500).send('Stream proxy failed');
    }
});

// --- BINGR CONSTELLATION & LANGUAGES PROXY ENDPOINTS WITH IN-MEMORY CACHE ---
const expressBingrStreamCache = new Map();
const expressBingrLangCache = new Map();

function adaptExpressClusterForServer(srv, clusterData) {
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

router.post('/bingr/stream', async (req, res) => {
    try {
        const { srv = 's70', id = '', query = {} } = req.body || {};
        const cacheKey = `${srv}:${id}:${query.season || ''}:${query.episode || ''}`;
        const masterKey = `s70:${id}:${query.season || ''}:${query.episode || ''}`;

        res.setHeader('Access-Control-Allow-Origin', '*');

        if (expressBingrStreamCache.has(cacheKey)) {
            const cached = expressBingrStreamCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 15 * 60 * 1000) {
                return res.json(cached.data);
            }
        }

        if (expressBingrStreamCache.has(masterKey)) {
            const masterCached = expressBingrStreamCache.get(masterKey);
            if (Date.now() - masterCached.timestamp < 15 * 60 * 1000) {
                const adapted = adaptExpressClusterForServer(srv, masterCached.data);
                expressBingrStreamCache.set(cacheKey, { data: adapted, timestamp: Date.now() });
                return res.json(adapted);
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
                    body: JSON.stringify({ ...req.body, srv: targetSrv }),
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
                expressBingrStreamCache.set(cacheKey, { data, timestamp: Date.now() });
                return res.json(data);
            }
            return res.json({ sources: [], subtitles: [] });
        }

        // For other servers: first attempt target srv (1200ms)
        const targetData = await fetchUpstream(srv, 1200);
        if (targetData) {
            expressBingrStreamCache.set(cacheKey, { data: targetData, timestamp: Date.now() });
            return res.json(targetData);
        }

        // Fallback: fetch master s70 and adapt for srv
        const masterData = await fetchUpstream('s70', 2500);
        if (masterData) {
            expressBingrStreamCache.set(masterKey, { data: masterData, timestamp: Date.now() });
            const adapted = adaptExpressClusterForServer(srv, masterData);
            expressBingrStreamCache.set(cacheKey, { data: adapted, timestamp: Date.now() });
            return res.json(adapted);
        }

        res.json({ sources: [], subtitles: [] });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Bingr stream proxy failed' });
    }
});

router.get('/bingr/languages/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const queryParams = new URLSearchParams(req.query).toString();
        const cacheKey = `${type}:${id}:${queryParams}`;

        if (expressBingrLangCache.has(cacheKey)) {
            const cached = expressBingrLangCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 15 * 60 * 1000) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                return res.json(cached.data);
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
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType.includes('application/json')) {
            const data = await upstream.json();
            if (data && Array.isArray(data.sources) && data.sources.length > 0) {
                expressBingrLangCache.set(cacheKey, { data, timestamp: Date.now() });
            }
            return res.status(upstream.status).json(data);
        }

        const text = await upstream.text();
        res.status(upstream.status).send(text);
    } catch (err) {
        res.status(500).json({ error: err.message || 'Bingr languages proxy failed' });
    }
});

let animeSaltToken = null;
let animeSaltTokenExpiry = 0;
router.get('/bingr/animesalt', async (req, res) => {
    try {
        const { title, ep = 1, season = 1 } = req.query;
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
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(streamRes.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || 'AnimeSalt proxy failed' });
    }
});

// ============================================================================
// UNIVERSAL STREAM DOWNLOAD ENGINE (MOVIES, TV, ANIME ON ANY RESOLUTION)
// ============================================================================
router.get('/download-options', async (req, res) => {
    try {
        const { id, type = 'movie', season = 1, episode = 1, title = 'Media', year = '', format = 'mkv' } = req.query;
        res.setHeader('Access-Control-Allow-Origin', '*');

        let rawSources = [];
        if (type === 'anime') {
            try {
                const aRes = await fetch(`https://hianime.filmu.in/animesalt/streams?title=${encodeURIComponent(title)}&ep=${episode}&season=${season}`);
                if (aRes.ok) {
                    const anData = await aRes.json();
                    if (Array.isArray(anData?.streams)) {
                        rawSources = anData.streams.map(s => ({
                            name: s.server || 'AnimeSalt',
                            quality: s.quality || '1080p',
                            url: s.url,
                            type: 'application/x-mpegurl',
                        }));
                    }
                }
            } catch {}
        } else if (id) {
            try {
                const bRes = await fetch('https://api.bingr.one/api/stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Referer': 'https://bingr.one/',
                        'Origin': 'https://bingr.one',
                    },
                    body: JSON.stringify({
                        srv: 's70',
                        t: type === 'tv' ? 'tv' : 'movie',
                        id: String(id),
                        query: {
                            title: title || '',
                            year: year ? String(year) : '',
                            ...(type === 'tv' ? { season: Number(season) || 1, episode: Number(episode) || 1 } : {}),
                        },
                    }),
                });
                if (bRes.ok) {
                    const bData = await bRes.json();
                    if (Array.isArray(bData?.sources)) {
                        rawSources = bData.sources;
                    }
                }
            } catch (err) {
                console.error('Error fetching download sources from Bingr:', err.message);
            }
        }

        const RESOLUTION_META = [
            { quality: '1080p', label: '1080p Full HD', resolution: '1920x1080', size: '1.6 GB', badge: 'Crystal Clear', recommended: true },
            { quality: '720p', label: '720p HD', resolution: '1280x720', size: '850 MB', badge: 'Standard HD', recommended: false },
            { quality: '480p', label: '480p SD', resolution: '854x480', size: '420 MB', badge: 'Data Saver', recommended: false },
            { quality: '360p', label: '360p Mobile', resolution: '640x360', size: '210 MB', badge: 'Fast Download', recommended: false },
        ];

        const hasAnySources = rawSources.length > 0;

        const qualities = RESOLUTION_META.map(meta => {
            // Prioritize direct binary video file that supports HTTP Range multi-threaded acceleration
            const directMatch = rawSources.find(s => {
                const qStr = String(s.quality || '').toLowerCase();
                const isDirect = s.type === 'video/mp4' || s.isMP4 || s.url?.includes('.mp4');
                return isDirect && (qStr.includes(meta.quality) || qStr.includes(meta.quality.replace('p', '')));
            });

            const anyMatch = rawSources.find(s => {
                const qStr = String(s.quality || '').toLowerCase();
                return qStr.includes(meta.quality) || qStr.includes(meta.quality.replace('p', ''));
            });

            const matchedSrc = directMatch || anyMatch || (hasAnySources ? rawSources[0] : null);
            const directStream = matchedSrc?.url || null;

            const downloadApiUrl = `/api/streaming/download-media?id=${encodeURIComponent(id || '')}&type=${type}&season=${season}&episode=${episode}&quality=${meta.quality}&title=${encodeURIComponent(title)}&format=${format}${year ? `&year=${encodeURIComponent(year)}` : ''}${directStream ? `&url=${encodeURIComponent(directStream)}` : ''}`;

            return {
                ...meta,
                format: format === 'mp4' ? 'Direct MP4' : 'Direct MKV (Fast)',
                downloadUrl: downloadApiUrl,
                directStreamUrl: directStream,
                hasDirectSource: Boolean(directStream),
            };
        });

        // Fast External Mirrors for alternative 1-click MKV downloads
        const mirrors = [];
        const encodedTitle = encodeURIComponent(title || 'Video');
        if (type === 'movie' && id) {
            mirrors.push(
                { name: 'Pahe Fast MKV (x265)', url: `https://pahe.ink/?s=${encodedTitle}`, flag: '⚡', desc: 'Ultra-fast 1080p/720p MKV cloud mirrors' },
                { name: 'VegaMovies Dual Audio MKV', url: `https://vegamovies.im/?s=${encodedTitle}`, flag: '🇮🇳', desc: 'Hindi Dub + English 1080p MKV files' },
                { name: 'Smashy Direct CDN', url: `https://player.smashystream.com/movie/${id}`, flag: '⚡', desc: 'Direct unthrottled streaming mirror' },
                { name: 'MoviesDrive MKV Hub', url: `https://moviesdrive.im/?s=${encodedTitle}`, flag: '⚡', desc: 'High-speed GDrive & Pixeldrain MKV' },
                { name: 'Filmu Indian DL', url: `https://embed.filmu.in/movie/${id}?lang=hi`, flag: '🇮🇳', desc: 'Hindi & regional multi-audio' },
                { name: '2Embed Cinema DL', url: `https://www.2embed.cc/embed/${id}`, flag: '🇦🇺', desc: 'Ultra-fast streaming mirror' },
            );
        } else if (type === 'tv' && id) {
            mirrors.push(
                { name: 'Pahe Series MKV', url: `https://pahe.ink/?s=${encodedTitle}`, flag: '⚡', desc: 'Compact x265 MKV episodes' },
                { name: 'VegaMovies Series Dual Audio', url: `https://vegamovies.im/?s=${encodedTitle}`, flag: '🇮🇳', desc: 'Hindi Dub + English MKV episodes' },
                { name: 'Smashy TV Direct', url: `https://player.smashystream.com/tv/${id}/${season}/${episode}`, flag: '⚡', desc: 'Direct episode download' },
                { name: 'MoviesDrive Series Hub', url: `https://moviesdrive.im/?s=${encodedTitle}`, flag: '⚡', desc: 'High-speed TV seasons MKV' },
                { name: 'Filmu TV Hindi', url: `https://embed.filmu.in/tv/${id}/${season}/${episode}?lang=hi`, flag: '🇮🇳', desc: 'Hindi episode mirror' },
                { name: '2Embed TV HD', url: `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`, flag: '🇦🇺', desc: 'Fast episode mirror' },
            );
        } else if (type === 'anime') {
            mirrors.push(
                { name: 'AnimePahe Direct MKV', url: `https://animepahe.ru/?q=${encodedTitle}`, flag: '🇯🇵', desc: 'Pahe sub & dub MKV download mirror' },
                { name: 'Smashy Anime DL', url: `https://player.smashystream.com`, flag: '⚡', desc: 'High-speed anime mirror' },
            );
        }

        res.json({
            title,
            type,
            format,
            season: Number(season),
            episode: Number(episode),
            qualities,
            mirrors,
            totalSources: rawSources.length,
            isAvailable: hasAnySources,
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch download options' });
    }
});

router.get('/download-media', async (req, res) => {
    try {
        const { url, id, type = 'movie', season = 1, episode = 1, quality = '1080p', title = 'video', year = '', format = 'mkv' } = req.query;

        let targetUrl = url;

        // If targetUrl not supplied, resolve stream from Bingr or AnimeSalt
        if (!targetUrl && id) {
            if (type === 'anime') {
                try {
                    const animeRes = await fetch(`https://hianime.filmu.in/animesalt/streams?title=${encodeURIComponent(title)}&ep=${episode}&season=${season}`);
                    if (animeRes.ok) {
                        const anData = await animeRes.json();
                        if (Array.isArray(anData?.streams) && anData.streams.length > 0) {
                            const match = anData.streams.find(s => String(s.quality).includes(quality.replace('p', ''))) || anData.streams[0];
                            targetUrl = match?.url;
                        }
                    }
                } catch {}
            } else {
                try {
                    const upstream = await fetch('https://api.bingr.one/api/stream', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                            'Referer': 'https://bingr.one/',
                            'Origin': 'https://bingr.one',
                        },
                        body: JSON.stringify({
                            srv: 's70',
                            t: type === 'tv' ? 'tv' : 'movie',
                            id: String(id),
                            query: {
                                title: title || '',
                                year: year ? String(year) : '',
                                ...(type === 'tv' ? { season: Number(season) || 1, episode: Number(episode) || 1 } : {}),
                            },
                        }),
                    });
                    if (upstream.ok) {
                        const bData = await upstream.json();
                        if (Array.isArray(bData?.sources) && bData.sources.length > 0) {
                            const direct = bData.sources.find(s => (s.type === 'video/mp4' || s.isMP4 || s.url?.includes('.mp4')) && String(s.quality).includes(quality.replace('p', '')));
                            const fallback = bData.sources.find(s => String(s.quality).includes(quality.replace('p', ''))) || bData.sources[0];
                            targetUrl = (direct || fallback)?.url;
                        }
                    }
                } catch {}
            }
        }

        if (!targetUrl) {
            return res.status(404).send('Stream source for download not found or title not yet digitally released.');
        }

        const ext = format === 'mp4' ? 'mp4' : 'mkv';
        const contentType = ext === 'mkv' ? 'video/x-matroska' : 'video/mp4';

        const safeTitle = (title || 'Video')
            .replace(/[^a-zA-Z0-9_\- ]/g, '')
            .trim()
            .replace(/\s+/g, '.');

        const epSuffix = (type === 'tv' || type === 'anime')
            ? `.S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
            : '';

        const fileName = `${safeTitle}${epSuffix}.${quality || 'HD'}.${ext}`;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Accept-Ranges', 'bytes');

        const isHls = targetUrl.includes('.m3u8') || targetUrl.includes('mpegurl');

        if (!isHls) {
            // Direct video stream with full Range request acceleration support
            const rangeHeader = req.headers.range;
            const upstreamHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://bingr.one/',
                'Origin': 'https://bingr.one',
            };
            if (rangeHeader) {
                upstreamHeaders['Range'] = rangeHeader;
            }

            const upstream = await fetch(targetUrl, { headers: upstreamHeaders });

            if (!upstream.ok && upstream.status !== 206) {
                return res.status(upstream.status).send('Upstream download failed');
            }

            if (upstream.status === 206) {
                res.status(206);
                const contentRange = upstream.headers.get('content-range');
                if (contentRange) res.setHeader('Content-Range', contentRange);
            }

            const contentLength = upstream.headers.get('content-length');
            if (contentLength) res.setHeader('Content-Length', contentLength);
            res.setHeader('Content-Type', contentType);

            if (upstream.body) {
                return Readable.fromWeb(upstream.body).pipe(res);
            }
            const buffer = Buffer.from(await upstream.arrayBuffer());
            return res.send(buffer);
        }

        // For HLS .m3u8 playlist: fetch playlist and stream segments with high-speed sliding-window prefetching
        const plRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://bingr.one/',
                'Origin': 'https://bingr.one',
            }
        });

        if (!plRes.ok) {
            return res.status(plRes.status).send('Upstream playlist request failed');
        }

        let playlistText = await plRes.text();
        let basePlaylistUrl = targetUrl;

        // If it's a master playlist with multiple variant streams, select the best matching stream
        if (playlistText.includes('#EXT-X-STREAM-INF')) {
            const lines = playlistText.split('\n');
            let matchedVariantUrl = null;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#EXT-X-STREAM-INF')) {
                    const nextLine = lines[i + 1]?.trim();
                    if (nextLine && !nextLine.startsWith('#')) {
                        if (line.includes(quality.replace('p', '')) || !matchedVariantUrl) {
                            matchedVariantUrl = nextLine.startsWith('http')
                                ? nextLine
                                : new URL(nextLine, basePlaylistUrl).toString();
                        }
                    }
                }
            }
            if (matchedVariantUrl) {
                basePlaylistUrl = matchedVariantUrl;
                const vRes = await fetch(matchedVariantUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Referer': 'https://bingr.one/',
                    }
                });
                if (vRes.ok) {
                    playlistText = await vRes.text();
                }
            }
        }

        // Extract segment URLs
        const segmentLines = playlistText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'));

        if (segmentLines.length === 0) {
            return res.status(404).send('No video segments found in stream');
        }

        res.setHeader('Content-Type', contentType);

        // High-throughput sliding-window concurrent prefetching
        const CONCURRENCY = 6;
        let nextIndexToFetch = 0;
        let nextIndexToWrite = 0;
        const inFlight = new Map();

        const fetchSegmentBuffer = async (segUrl) => {
            const fullUrl = segUrl.startsWith('http') ? segUrl : new URL(segUrl, basePlaylistUrl).toString();
            try {
                const segRes = await fetch(fullUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Referer': 'https://bingr.one/',
                    }
                });
                if (segRes.ok) {
                    return Buffer.from(await segRes.arrayBuffer());
                }
            } catch (segErr) {
                console.error('Error fetching segment:', segErr.message);
            }
            return null;
        };

        const fillWindow = () => {
            while (inFlight.size < CONCURRENCY && nextIndexToFetch < segmentLines.length) {
                const idx = nextIndexToFetch++;
                inFlight.set(idx, fetchSegmentBuffer(segmentLines[idx]));
            }
        };

        fillWindow();

        while (nextIndexToWrite < segmentLines.length) {
            if (res.writableEnded || res.destroyed) break;

            const p = inFlight.get(nextIndexToWrite);
            if (!p) {
                fillWindow();
                continue;
            }

            const buf = await p;
            inFlight.delete(nextIndexToWrite);
            nextIndexToWrite++;

            fillWindow();

            if (buf && buf.length > 0) {
                if (!res.write(buf)) {
                    await new Promise(r => res.once('drain', r));
                }
            }
        }

        res.end();
    } catch (err) {
        console.error('Download media error:', err);
        if (!res.headersSent) {
            res.status(500).send('Download processing failed');
        }
    }
});

module.exports = router;
