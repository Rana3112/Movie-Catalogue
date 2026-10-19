/**
 * StreamZone Universal Download Service
 * Supports 4K, 1080p, 720p, 480p, 360p downloads for Movies, TV Shows & Anime
 */

export const RESOLUTION_PRESETS = [
  {
    quality: '1080p',
    label: '1080p Full HD',
    resolution: '1920 × 1080',
    size: '1.6 GB',
    badge: 'Crystal Clear',
    recommended: true,
    color: '#38BDF8',
  },
  {
    quality: '720p',
    label: '720p HD',
    resolution: '1280 × 720',
    size: '850 MB',
    badge: 'Standard HD',
    recommended: false,
    color: '#10B981',
  },
  {
    quality: '480p',
    label: '480p SD',
    resolution: '854 × 480',
    size: '420 MB',
    badge: 'Data Saver',
    recommended: false,
    color: '#F59E0B',
  },
  {
    quality: '360p',
    label: '360p Mobile',
    resolution: '640 × 360',
    size: '210 MB',
    badge: 'Fast Download',
    recommended: false,
    color: '#9CA3AF',
  },
];

export async function fetchDownloadOptions({ id, type = 'movie', season = 1, episode = 1, title = '', year = '', format = 'mkv' }) {
  try {
    const params = new URLSearchParams({
      id: String(id || ''),
      type,
      season: String(season || 1),
      episode: String(episode || 1),
      title: title || 'Media',
      format: format || 'mkv',
      ...(year ? { year: String(year) } : {}),
    });

    const res = await fetch(`/api/streaming/download-options?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.qualities) && data.qualities.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend download options fetch failed, using fallback:', err);
  }

  // Fallback client-generated download options (Defaulting to MKV)
  const encodedTitle = encodeURIComponent(title || 'Video');
  return {
    title: title || 'Media',
    type,
    season: Number(season),
    episode: Number(episode),
    qualities: RESOLUTION_PRESETS.map(p => ({
      ...p,
      format: 'MKV (Fast)',
      downloadUrl: `/api/streaming/download-media?id=${encodeURIComponent(id || '')}&type=${type}&season=${season}&episode=${episode}&quality=${p.quality}&title=${encodedTitle}&format=${format}${year ? `&year=${encodeURIComponent(year)}` : ''}`,
      hasDirectSource: true,
    })),
    mirrors: [
      { name: 'Pahe Fast MKV (x265)', url: `https://pahe.ink/?s=${encodedTitle}`, flag: '⚡', desc: 'Ultra-fast 1080p/720p MKV cloud mirrors' },
      { name: 'VegaMovies Dual Audio MKV', url: `https://vegamovies.im/?s=${encodedTitle}`, flag: '🇮🇳', desc: 'Hindi Dub + English 1080p MKV files' },
      { name: 'Smashy Direct CDN', url: `https://player.smashystream.com/${type === 'tv' ? `tv/${id}/${season}/${episode}` : `movie/${id}`}`, flag: '🇦🇺', desc: 'Direct unthrottled streaming mirror' },
      { name: 'MoviesDrive MKV Hub', url: `https://moviesdrive.im/?s=${encodedTitle}`, flag: '⚡', desc: 'High-speed GDrive & Pixeldrain MKV' },
      { name: 'Filmu Indian Dub MKV', url: `https://embed.filmu.in/${type === 'tv' ? `tv/${id}/${season}/${episode}` : `movie/${id}`}?lang=hi`, flag: '🇮🇳', desc: 'Hindi & regional multi-audio' },
    ],
  };
}

/**
 * Triggers one-click browser download of the video file
 */
export function triggerFileDownload(downloadUrl, filename = 'video.mkv') {
  if (!downloadUrl) return;

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {}
  }, 1000);
}
