import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { RotateCcw, Shuffle, X, Zap } from 'lucide-react';
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
    return config?.src ? [{ label: 'Primary', src: config.src, style: 'orange' }] : [];
  }, [config]);

  const [providerIndex, setProviderIndex] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [health, setHealth] = useState({ status: 'checking', label: 'Checking provider' });
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [autoShiftNotice, setAutoShiftNotice] = useState(null);
  const [failedIndices, setFailedIndices] = useState(new Set());
  const userOverriddenRef = useRef(false);
  const loadTimeoutRef = useRef(null);

  const sourceUrl = useMemo(
    () => candidates[providerIndex]?.src || config?.src || config?.embedUrl || '',
    [candidates, config, providerIndex]
  );
  const isHlsMode = config?.mode === 'hls';
  const hasAlternateProvider = candidates.length > 1;
  const currentCandidate = candidates[providerIndex] || { label: 'Provider' };

  // Function to auto-shift to next non-failed provider
  const triggerAutoShift = useCallback((reason = 'unreachable') => {
    if (userOverriddenRef.current) return;
    if (candidates.length <= 1) return;

    setFailedIndices(prev => {
      const nextFailed = new Set(prev);
      nextFailed.add(providerIndex);

      // Find next candidate index that has not failed
      let nextIndex = (providerIndex + 1) % candidates.length;
      let attempts = 0;
      while (nextFailed.has(nextIndex) && attempts < candidates.length) {
        nextIndex = (nextIndex + 1) % candidates.length;
        attempts++;
      }

      if (attempts >= candidates.length) {
        // All candidates attempted, reset failed set and pick next
        nextIndex = (providerIndex + 1) % candidates.length;
      }

      const prevLabel = candidates[providerIndex]?.label || 'Previous provider';
      const nextLabel = candidates[nextIndex]?.label || 'Alternate provider';

      setProviderIndex(nextIndex);
      setFrameKey(v => v + 1);
      setAutoShiftNotice(`⚡ Auto-shifted to ${nextLabel} (${prevLabel} was ${reason})`);
      setTimeout(() => setAutoShiftNotice(null), 5000);

      return nextFailed;
    });
  }, [candidates, providerIndex]);

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

  // Provider health check & auto-shift trigger
  useEffect(() => {
    if (!sourceUrl) return undefined;
    let cancelled = false;

    setHealth({ status: 'checking', label: 'Checking provider' });

    checkStreamProviderHealth(sourceUrl).then(result => {
      if (cancelled) return;
      setHealth(result);

      // Auto-shift if provider is explicitly unreachable
      if (result.status === 'unreachable' && !userOverriddenRef.current && hasAlternateProvider) {
        triggerAutoShift('offline');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasAlternateProvider, sourceUrl, triggerAutoShift]);

  // Loading timeout: auto-shift if frame doesn't load within 7 seconds
  useEffect(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setShowSlowHint(false);

    loadTimeoutRef.current = setTimeout(() => {
      setShowSlowHint(true);
      if (!userOverriddenRef.current && hasAlternateProvider) {
        triggerAutoShift('slow to load');
      }
    }, 7000);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [frameKey, hasAlternateProvider, providerIndex, triggerAutoShift]);

  const handleFrameLoad = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setShowSlowHint(false);
  };

  const handleFrameError = () => {
    triggerAutoShift('blocked or failed');
  };

  const retryCurrentProvider = () => {
    userOverriddenRef.current = true;
    prewarmStreamUrl(sourceUrl);
    setShowSlowHint(false);
    setFrameKey(value => value + 1);
  };

  const tryAlternateProvider = () => {
    if (!hasAlternateProvider) {
      retryCurrentProvider();
      return;
    }
    userOverriddenRef.current = true;
    const nextIndex = (providerIndex + 1) % candidates.length;
    prewarmStreamUrl(candidates[nextIndex]?.src);
    setProviderIndex(nextIndex);
    setShowSlowHint(false);
    setFrameKey(value => value + 1);
  };

  const selectProvider = (nextIndex) => {
    if (nextIndex === providerIndex || !candidates[nextIndex]) return;
    userOverriddenRef.current = true;
    prewarmStreamUrl(candidates[nextIndex].src);
    setProviderIndex(nextIndex);
    setShowSlowHint(false);
    setFrameKey(value => value + 1);

    // Reset user override after 15s so auto-shift works if user picks a broken provider
    setTimeout(() => {
      userOverriddenRef.current = false;
    }, 15000);
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
      {/* Top Left Close Button */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Close player"
        style={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top))',
          left: 'max(12px, env(safe-area-inset-left))',
          zIndex: 10001,
          background: 'rgba(0,0,0,0.68)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '50%',
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <X size={21} />
      </button>

      {/* Top Bar: Provider Pills Navigation */}
      <div
        style={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top))',
          left: 'max(64px, env(safe-area-inset-left))',
          right: 'max(12px, env(safe-area-inset-right))',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'auto',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 4,
        }}
      >
        {/* Render Provider Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {candidates.map((candidate, index) => {
            const isActive = index === providerIndex;
            const isPurple = candidate.style === 'purple' || candidate.label.toLowerCase().includes('prime');
            
            return (
              <button
                key={`${candidate.label}-${candidate.src}`}
                onClick={() => selectProvider(index)}
                style={{
                  background: isPurple
                    ? (isActive
                      ? 'linear-gradient(135deg, #9b59b6, #8e44ad)'
                      : 'linear-gradient(135deg, #712b9b, #5b2c6f)')
                    : (isActive
                      ? 'linear-gradient(135deg, #f39c12, #d35400)'
                      : 'linear-gradient(135deg, #e67e22, #b9770e)'),
                  color: '#ffffff',
                  border: isActive ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 24,
                  padding: '6px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? (isPurple ? '0 0 16px rgba(155,89,182,0.8), 0 4px 12px rgba(0,0,0,0.6)' : '0 0 16px rgba(243,156,18,0.8), 0 4px 12px rgba(0,0,0,0.6)')
                    : '0 2px 6px rgba(0,0,0,0.3)',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {isActive && <Zap size={13} fill="#fff" />}
                {candidate.label}
              </button>
            );
          })}
        </div>

        {/* Right side controls: Health Badge & Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div
            style={{
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(12px)',
              padding: '7px 12px',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: health.status === 'online' ? '#10B981' : health.status === 'degraded' ? '#FBBF24' : '#EF4444',
              whiteSpace: 'nowrap',
            }}
          >
            ● {health.status === 'checking' ? 'Checking' : health.status}
          </div>

          <button
            onClick={retryCurrentProvider}
            aria-label="Retry current provider"
            title="Reload provider"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.65)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
          </button>

          {hasAlternateProvider && (
            <button
              onClick={tryAlternateProvider}
              aria-label="Try alternate provider"
              title="Next provider"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'linear-gradient(135deg, #E50914, #B20710)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(229,9,20,0.5)',
              }}
            >
              <Shuffle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Auto Shift Notification Toast */}
      {autoShiftNotice && (
        <div
          style={{
            position: 'fixed',
            top: 'max(64px, env(safe-area-inset-top))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 999,
            background: 'rgba(230, 126, 34, 0.92)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {autoShiftNotice}
        </div>
      )}

      {/* Slow loading hint overlay */}
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
            padding: '10px 16px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(12px)',
          }}
        >
          Stream taking long to load?
          <button
            onClick={retryCurrentProvider}
            style={{
              color: '#fff',
              background: 'rgba(255,255,255,0.15)',
              border: 0,
              borderRadius: 999,
              padding: '6px 12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          {hasAlternateProvider && (
            <button
              onClick={tryAlternateProvider}
              style={{
                color: '#fff',
                background: 'linear-gradient(135deg, #E50914, #B20710)',
                border: 0,
                borderRadius: 999,
                padding: '6px 12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Switch Provider
            </button>
          )}
        </div>
      )}

      {/* Video Surface */}
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
          onLoad={handleFrameLoad}
          onError={handleFrameError}
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

