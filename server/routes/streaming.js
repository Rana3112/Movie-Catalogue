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

router.get('/subtitles/search', async (req, res) => {
    try {
        const { query = '', imdbId = '', tmdbId = '', season, episode } = req.query;
        let targetImdbId = imdbId ? imdbId.replace(/^tt/, '') : '';

        // If no IMDb ID provided, resolve via TMDB API
        if (!targetImdbId && tmdbId) {
            const tmdbKey = process.env.TMDB_API_KEY || 'e367800078b548b2611a129d20c5d6c8';
            try {
                const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${tmdbKey}`);
                if (tmdbRes.ok) {
                    const ids = await tmdbRes.json();
                    if (ids.imdb_id) targetImdbId = ids.imdb_id.replace(/^tt/, '');
                }
            } catch (e) {
                console.warn('TMDB external_ids fetch failed:', e);
            }
        }

        const results = [];

        // 1. Search OpenSubtitles via rest.opensubtitles.org by IMDb ID
        if (targetImdbId) {
            try {
                const osUrl = `https://rest.opensubtitles.org/search/imdbid-${targetImdbId}`;
                const osRes = await fetch(osUrl, {
                    headers: { 'User-Agent': 'TemporaryUserAgent' }
                });
                if (osRes.ok) {
                    const data = await osRes.json();
                    if (Array.isArray(data)) {
                        data.slice(0, 25).forEach((sub) => {
                            if (sub.SubDownloadLink || sub.IDSubtitleFile) {
                                const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
                                const host = req.get('host');
                                const downloadUrl = sub.SubDownloadLink || `https://dl.opensubtitles.org/en/download/src-api/filead/${sub.IDSubtitleFile}.gz`;
                                const proxyDownloadUrl = `${proto}://${host}/api/streaming/subtitles/download?url=${encodeURIComponent(downloadUrl)}`;

                                results.push({
                                    id: String(sub.IDSubtitleFile || sub.IDSubtitle),
                                    label: `${sub.LanguageName || 'English'} - ${sub.SubFileName || sub.MovieReleaseName || 'Subtitle'} (${sub.SubFormat || 'srt'})`,
                                    language: sub.LanguageName || 'English',
                                    rating: sub.SubRating || '0',
                                    downloads: sub.SubDownloadsCnt || '0',
                                    downloadUrl: proxyDownloadUrl,
                                    source: 'OpenSubtitles',
                                    format: sub.SubFormat || 'srt'
                                });
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('OpenSubtitles IMDb search failed:', e);
            }
        }

        // 2. Search OpenSubtitles via query if no results yet or query provided
        if (results.length < 5 && query) {
            try {
                const cleanQuery = encodeURIComponent(query.trim());
                const osUrl = `https://rest.opensubtitles.org/search/query-${cleanQuery}`;
                const osRes = await fetch(osUrl, {
                    headers: { 'User-Agent': 'TemporaryUserAgent' }
                });
                if (osRes.ok) {
                    const data = await osRes.json();
                    if (Array.isArray(data)) {
                        data.slice(0, 25).forEach((sub) => {
                            if (sub.SubDownloadLink || sub.IDSubtitleFile) {
                                const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
                                const host = req.get('host');
                                const downloadUrl = sub.SubDownloadLink || `https://dl.opensubtitles.org/en/download/src-api/filead/${sub.IDSubtitleFile}.gz`;
                                const proxyDownloadUrl = `${proto}://${host}/api/streaming/subtitles/download?url=${encodeURIComponent(downloadUrl)}`;

                                if (!results.some(r => r.id === String(sub.IDSubtitleFile || sub.IDSubtitle))) {
                                    results.push({
                                        id: String(sub.IDSubtitleFile || sub.IDSubtitle),
                                        label: `${sub.LanguageName || 'English'} - ${sub.SubFileName || sub.MovieReleaseName || 'Subtitle'} (${sub.SubFormat || 'srt'})`,
                                        language: sub.LanguageName || 'English',
                                        rating: sub.SubRating || '0',
                                        downloads: sub.SubDownloadsCnt || '0',
                                        downloadUrl: proxyDownloadUrl,
                                        source: 'OpenSubtitles',
                                        format: sub.SubFormat || 'srt'
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('OpenSubtitles query search failed:', e);
            }
        }

        res.json({ results });
    } catch (error) {
        console.error('Subtitle search error:', error);
        res.status(500).json({ error: 'Subtitle search failed', results: [] });
    }
});

router.get('/subtitles/download', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send('Missing subtitle URL');

        const upstream = await fetch(url, {
            headers: { 'User-Agent': 'TemporaryUserAgent' }
        });

        if (!upstream.ok) {
            return res.status(upstream.status).send('Subtitle download upstream failed');
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        // Check for GZIP header (0x1f, 0x8b)
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

module.exports = router;
