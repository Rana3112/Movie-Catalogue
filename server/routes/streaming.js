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

    const requestedSeason = Number(season);
    const requestedEpisode = Number(episode);
    const results = [];
    for (const subtitle of data.subtitles) {
        const files = Array.isArray(subtitle.unpack_files) && subtitle.unpack_files.length > 0
            ? subtitle.unpack_files
            : [subtitle];
        for (const file of files) {
            if (!file?.url) continue;
            if (requestedSeason && Number(file.season || subtitle.season) !== requestedSeason) continue;
            if (requestedEpisode && Number(file.episode || subtitle.episode) !== requestedEpisode) continue;

            const downloadUrl = new URL(file.url, 'https://dl.subdl.com').toString();
            results.push({
                id: String(file.file_n_id || file.url),
                label: `${file.language || subtitle.language || 'English'} - ${file.release_name || subtitle.release_name || file.name || 'Subtitle'}`,
                language: file.language || subtitle.language || 'English',
                rating: String(subtitle.rating || '0'),
                downloads: String(subtitle.download_count || '0'),
                downloadUrl: buildSubtitleDownloadUrl(request, downloadUrl),
                source: 'Subdl',
                format: file.format || subtitle.format || (file.name || '').split('.').pop() || 'srt',
            });
            if (results.length === 30) return results;
        }
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

module.exports = router;
