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
const API_URL = (import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com').replace(/\/+$/, '');

export async function searchOnlineSubtitles({ title = '', id = '', season, episode, category = 'movie' }) {
  const results = [];
  const rawId = String(id || '').trim();
  const imdbId = /^tt\d+$/i.test(rawId) ? rawId : '';
  const tmdbId = /^\d+$/.test(rawId) ? rawId : '';

  // 1. Primary: backend API search (Subdl, with optional OpenSubtitles fallback).
  try {
    const params = new URLSearchParams({
      query: title || '',
      tmdbId,
      imdbId,
      season: season ? String(season) : '',
      episode: episode ? String(episode) : '',
      category: category || 'movie',
    });
    const res = await fetch(`${API_URL}/api/streaming/subtitles/search?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map(sub => ({
          id: sub.id,
          label: sub.label,
          language: sub.language,
          url: sub.downloadUrl,
          source: sub.source || 'Subtitle provider',
          format: sub.format || 'srt',
        }));
      }
    }
  } catch (e) {
    console.warn('Backend subtitle search failed:', e);
  }

  return results;
}

export async function fetchSubtitleText(url) {
  if (!url) return '';
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Subtitle download failed (${response.status})`);
  return await response.text();
}
