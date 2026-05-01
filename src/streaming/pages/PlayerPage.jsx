import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { X } from 'lucide-react';
import { useStreamingStore } from '../store/useStreamingStore';
import { prewarmStreamUrl } from '../api/streams';

const setNativePlayerMode = (enabled) => {
  try {
    window.StreamZoneNative?.setPlayerMode?.(enabled);
  } catch {
    // Native bridge is Android-only.
  }
};

export default function PlayerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state;
  const addToHistory = useStreamingStore(s => s.addToHistory);

  const sourceUrl = useMemo(() => config?.src || config?.embedUrl || '', [config]);
  const isHlsMode = config?.mode === 'hls';

  useEffect(() => {
    if (!config || !sourceUrl) {
      navigate(-1);
      return undefined;
    }

    prewarmStreamUrl(sourceUrl);

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    StatusBar.hide().catch(() => {});
    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
    setNativePlayerMode(true);

    addToHistory({
      id: config.id || `${config.category}:${config.title}:${config.season || ''}:${config.episode || ''}`,
      title: config.title,
      posterUrl: config.posterUrl ?? null,
      category: config.category,
      season: config.season,
      episode: config.episode,
      episodeTitle: config.episodeTitle,
      watchedAt: Date.now(),
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      StatusBar.show().catch(() => {});
      ScreenOrientation.unlock().catch(() => {});
      setNativePlayerMode(false);
    };
  }, [addToHistory, config, navigate, sourceUrl]);

  if (!config || !sourceUrl) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        zIndex: 9999,
        width: '100dvw',
        height: '100dvh',
        minWidth: '100vw',
        minHeight: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <button
        onClick={() => navigate(-1)}
        aria-label="Close player"
        style={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top))',
          left: 'max(12px, env(safe-area-inset-left))',
          zIndex: 10000,
          background: 'rgba(0,0,0,0.62)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '50%',
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          backdropFilter: 'blur(10px)',
        }}
      >
        <X size={21} />
      </button>

      {isHlsMode ? (
        <video
          src={sourceUrl}
          autoPlay
          controls
          playsInline
          controlsList="nodownload"
          poster={config.posterUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000',
          }}
        >
          {Array.isArray(config.subtitles) && config.subtitles.map((subtitle) => (
            <track
              key={subtitle.url}
              kind="subtitles"
              src={subtitle.url}
              srcLang={(subtitle.lang || 'en').slice(0, 2).toLowerCase()}
              label={subtitle.lang || 'Subtitle'}
            />
          ))}
        </video>
      ) : (
        <iframe
          title={config.title || 'StreamZone player'}
          src={sourceUrl}
          loading="eager"
          fetchPriority="high"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#000',
          }}
          referrerPolicy="no-referrer"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
        />
      )}
    </div>
  );
}
