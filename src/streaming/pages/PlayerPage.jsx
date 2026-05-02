import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { RotateCcw, Shuffle, X } from 'lucide-react';
import { useStreamingStore } from '../store/useStreamingStore';
import { checkStreamProviderHealth, prewarmStreamCandidates, prewarmStreamUrl } from '../api/streams';

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
  const candidates = useMemo(() => {
    if (Array.isArray(config?.candidates) && config.candidates.length) return config.candidates;
    return config?.src ? [{ label: 'Primary', src: config.src }] : [];
  }, [config]);
  const [providerIndex, setProviderIndex] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [health, setHealth] = useState({ status: 'checking', label: 'Checking provider' });
  const [showSlowHint, setShowSlowHint] = useState(false);

  const sourceUrl = useMemo(() => candidates[providerIndex]?.src || config?.src || config?.embedUrl || '', [candidates, config, providerIndex]);
  const isHlsMode = config?.mode === 'hls';
  const hasAlternateProvider = candidates.length > 1;

  useEffect(() => {
    if (!config || !sourceUrl) {
      navigate(-1);
      return undefined;
    }

    prewarmStreamUrl(sourceUrl);
    prewarmStreamCandidates(candidates);

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
  }, [addToHistory, candidates, config, navigate, sourceUrl]);

  useEffect(() => {
    if (!sourceUrl) return undefined;
    let cancelled = false;
    const checkTimer = window.setTimeout(() => {
      if (!cancelled) setHealth({ status: 'checking', label: 'Checking provider' });
    }, 0);
    checkStreamProviderHealth(sourceUrl).then(result => {
      if (!cancelled) setHealth(result);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(checkTimer);
    };
  }, [sourceUrl]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => setShowSlowHint(false), 0);
    const timer = window.setTimeout(() => setShowSlowHint(true), 9000);
    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(timer);
    };
  }, [sourceUrl, frameKey]);

  const retryCurrentProvider = () => {
    prewarmStreamUrl(sourceUrl);
    setShowSlowHint(false);
    setFrameKey(value => value + 1);
  };

  const tryAlternateProvider = () => {
    if (!hasAlternateProvider) {
      retryCurrentProvider();
      return;
    }
    const nextIndex = (providerIndex + 1) % candidates.length;
    prewarmStreamUrl(candidates[nextIndex]?.src);
    setProviderIndex(nextIndex);
    setShowSlowHint(false);
    setFrameKey(value => value + 1);
  };

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

      <div
        style={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top))',
          right: 'max(12px, env(safe-area-inset-right))',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#fff',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.16)',
            background: 'rgba(0,0,0,0.58)',
            backdropFilter: 'blur(12px)',
            padding: '9px 12px',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: health.status === 'degraded' ? '#FBBF24' : '#E5E7EB',
          }}
        >
          {candidates[providerIndex]?.label || 'Provider'}: {health.status === 'checking' ? 'Checking' : health.status}
        </div>
        <button
          onClick={retryCurrentProvider}
          aria-label="Retry current provider"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.62)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={18} />
        </button>
        {hasAlternateProvider && (
          <button
            onClick={tryAlternateProvider}
            aria-label="Try alternate provider"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(229,9,20,0.82)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Shuffle size={18} />
          </button>
        )}
      </div>

      {showSlowHint && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 'max(14px, env(safe-area-inset-bottom))',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.72)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(12px)',
          }}
        >
          Still loading?
          <button onClick={retryCurrentProvider} style={{ color: '#fff', background: 'rgba(255,255,255,0.12)', border: 0, borderRadius: 999, padding: '7px 10px', fontWeight: 800 }}>
            Retry
          </button>
          {hasAlternateProvider && (
            <button onClick={tryAlternateProvider} style={{ color: '#fff', background: '#E50914', border: 0, borderRadius: 999, padding: '7px 10px', fontWeight: 800 }}>
              Alt Player
            </button>
          )}
        </div>
      )}

      {isHlsMode ? (
        <video
          key={`video-${providerIndex}-${frameKey}`}
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
          key={`iframe-${providerIndex}-${frameKey}`}
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
