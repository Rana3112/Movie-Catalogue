/**
 * Subtitle parser, converter, and online search helper
 */

export function parseTimestampSeconds(str) {
  if (!str) return NaN;
  const clean = str.replace(',', '.').trim();
  const parts = clean.split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(clean);
}

export function parseSubtitles(rawText) {
  if (!rawText) return [];
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const timeIndex = lines.findIndex(l => l.includes('-->'));
    if (timeIndex === -1) continue;

    const timeLine = lines[timeIndex];
    const text = lines.slice(timeIndex + 1).join('\n').replace(/<[^>]*>/g, '');

    const timeParts = timeLine.split('-->').map(s => s.trim().split(' ')[0]);
    if (timeParts.length < 2) continue;

    const start = parseTimestampSeconds(timeParts[0]);
    const end = parseTimestampSeconds(timeParts[1]);

    if (!isNaN(start) && !isNaN(end) && text) {
      cues.push({ start, end, text });
    }
  }

  return cues;
}

export function formatVttTime(sec) {
  const safeSec = Math.max(0, sec || 0);
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = (safeSec % 60).toFixed(3);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(6, '0')}`;
}

export function cuesToVttBlobUrl(cues) {
  let vtt = 'WEBVTT\n\n';
  cues.forEach((cue, i) => {
    vtt += `${i + 1}\n${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${cue.text}\n\n`;
  });
  const blob = new Blob([vtt], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}

/**
 * Search online subtitles across multiple sources
 */
export async function searchOnlineSubtitles({ title = '', id = '', season, episode, category = 'movie' }) {
  const results = [];

  // Source 1: Wyzie Subtitles API (TMDB ID based)
  if (id) {
    try {
      let wyzieUrl = `https://sub.wyzie.ru/search?id=${id}`;
      if (category === 'tv' && season && episode) {
        wyzieUrl += `&season=${season}&episode=${episode}`;
      }
      const res = await fetch(wyzieUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(sub => {
            if (sub.url) {
              results.push({
                id: sub.id || sub.url,
                label: `${sub.display_name || sub.language || 'English'} (${sub.format || 'vtt'})`,
                language: sub.language || 'English',
                url: sub.url,
                source: 'Wyzie',
                format: sub.format || 'vtt',
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Wyzie subtitles search failed', e);
    }
  }

  // Source 2: OpenSubtitles REST API search fallback
  try {
    const query = `${title} ${season ? `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}` : ''}`.trim();
    const osUrl = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(query)}`;
    const osRes = await fetch(osUrl, {
      headers: {
        'User-Agent': 'Categloge-StreamZone v1.0',
      },
    });
    if (osRes.ok) {
      const osData = await osRes.json();
      if (Array.isArray(osData.data)) {
        osData.data.slice(0, 10).forEach(sub => {
          const file = sub.attributes?.files?.[0];
          if (file) {
            results.push({
              id: String(file.file_id || sub.id),
              label: `${sub.attributes.language || 'English'} - ${file.file_name || 'Subtitle'}`,
              language: sub.attributes.language || 'English',
              url: `https://dl.opensubtitles.org/en/download/sub/${file.file_id}`,
              source: 'OpenSubtitles',
              format: 'srt',
            });
          }
        });
      }
    }
  } catch (e) {
    console.warn('OpenSubtitles search failed', e);
  }

  return results;
}

export async function fetchSubtitleText(url) {
  if (!url) return '';
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Subtitle download failed (${response.status})`);
  return await response.text();
}
