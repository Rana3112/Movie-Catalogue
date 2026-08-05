import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Check, RotateCcw, Server, Shuffle, Sliders, X, Zap } from 'lucide-react';
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
    if (Array.isArray(config?.candidates) && config.candidates.length) {
      return config.candidates.map((c, i) => ({
        ...c,
        label: c.label || `Source ${i + 1}`,
      }));
    }
    return config?.src ? [{ label: 'Source 1', src: config.src, style: 'orange' }] : [];
  }, [config]);

  const [providerIndex, setProviderIndex] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [health, setHealth] = useState({ status: 'checking', label: 'Checking provider' });
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [autoShiftNotice, setAutoShiftNotice] = useState(null);
  const [failedIndices, setFailedIndices] = useState(new Set());
  const [autoShiftEnabled, setAutoShiftEnabled] = useState(true);
  const [isSourcesMenuOpen, setIsSourcesMenuOpen] = useState(false);

  const userOverriddenRef = useRef(false);
  const loadTimeoutRef = useRef(null);

  const sourceUrl = useMemo(
    () => candidates[providerIndex]?.src || config?.src || config?.embedUrl || '',
    [candidates, config, providerIndex]
  );
  const isHlsMode = config?.mode === 'hls';
  const hasAlternateProvider = candidates.length > 1;
  const currentCandidate = candidates[providerIndex] || { label: 'Source 1' };

  // Function to auto-shift to next non-failed provider
  const triggerAutoShift = useCallback((reason = 'unreachable') => {
    if (!autoShiftEnabled) return;
    if (userOverriddenRef.current) return;
    if (candidates.length <= 1) return;

    setFailedIndices(prev => {
      const nextFailed = new Set(prev);
      nextFailed.add(providerIndex);

      let nextIndex = (providerIndex + 1) % candidates.length;
      let attempts = 0;
      while (nextFailed.has(nextIndex) && attempts < candidates.length) {
        nextIndex = (nextIndex + 1) % candidates.length;
        attempts++;
      }

      if (attempts >= candidates.length) {
        nextIndex = (providerIndex + 1) % candidates.length;
      }

      const prevLabel = candidates[providerIndex]?.label || `Source ${providerIndex + 1}`;
      const nextLabel = candidates[nextIndex]?.label || `Source ${nextIndex + 1}`;

      setProviderIndex(nextIndex);
      setFrameKey(v => v + 1);
      setAutoShiftNotice(`⚡ Auto-shifted to ${nextLabel} (${prevLabel} was ${reason})`);
      setTimeout(() => setAutoShiftNotice(null), 3500);

      return nextFailed;
    });
  }, [autoShiftEnabled, candidates, providerIndex]);

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

      if (result.status === 'unreachable' && autoShiftEnabled && !userOverriddenRef.current && hasAlternateProvider) {
        triggerAutoShift('offline');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [autoShiftEnabled, hasAlternateProvider, sourceUrl, triggerAutoShift]);

  // Loading timeout: auto-shift if frame doesn't load within 7 seconds
  useEffect(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setShowSlowHint(false);

    loadTimeoutRef.current = setTimeout(() => {
      setShowSlowHint(true);
      if (autoShiftEnabled && !userOverriddenRef.current && hasAlternateProvider) {
        triggerAutoShift('slow to load');
      }
    }, 7000);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [autoShiftEnabled, frameKey, hasAlternateProvider, providerIndex, triggerAutoShift]);

  const handleFrameLoad = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setShowSlowHint(false);
  };

  const handleFrameError = () => {
    if (autoShiftEnabled) {
      triggerAutoShift('blocked or failed');
    }
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
    setIsSourcesMenuOpen(false);
    setFrameKey(value => value + 1);

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

      {/* Top Right Controls (Minimal & Non-intrusive) */}
      <div
        style={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top))',
          right: 'max(12px, env(safe-area-inset-right))',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        {/* Current Active Source Pill & Menu Opener */}
        <button
          onClick={() => setIsSourcesMenuOpen(prev => !prev)}
          style={{
            background: 'rgba(0,0,0,0.72)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 24,
            padding: '7px 14px',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <Server size={14} className="text-amber-400" />
          <span>{currentCandidate.label}</span>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: health.status === 'online' ? '#10B981' : health.status === 'degraded' ? '#FBBF24' : '#EF4444',
            }}
          />
        </button>

        {/* Reload Current Source Button */}
        <button
          onClick={retryCurrentProvider}
          aria-label="Reload source"
          title="Reload source"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.68)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Next Source Button */}
        {hasAlternateProvider && (
          <button
            onClick={tryAlternateProvider}
            aria-label="Next source"
            title="Next source"
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

      {/* Sources Selection Menu Drawer / Modal */}
      {isSourcesMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setIsSourcesMenuOpen(false)}
        >
          <div
            style={{
              width: 'min(92vw, 420px)',
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 20,
              padding: 20,
              color: '#fff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} className="text-red-500" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Stream Sources</h3>
              </div>
              <button
                onClick={() => setIsSourcesMenuOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 0,
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Auto-Shift Toggle Control */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} className={autoShiftEnabled ? 'text-amber-400' : 'text-slate-500'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Auto-Shift Stream</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>Automatically switch if stream fails</div>
                </div>
              </div>

              <button
                onClick={() => setAutoShiftEnabled(prev => !prev)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  border: 0,
                  cursor: 'pointer',
                  background: autoShiftEnabled
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  boxShadow: autoShiftEnabled ? '0 0 10px rgba(16,185,129,0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {autoShiftEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Sources List Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxHeight: '240px', overflowY: 'auto', paddingRight: 4 }}>
              {candidates.map((candidate, index) => {
                const isActive = index === providerIndex;
                const isPurple = candidate.style === 'purple';

                return (
                  <button
                    key={`${candidate.label}-${candidate.src}`}
                    onClick={() => selectProvider(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: isActive
                        ? '2px solid #E50914'
                        : '1px solid rgba(255,255,255,0.12)',
                      background: isActive
                        ? (isPurple ? 'linear-gradient(135deg, rgba(142,68,173,0.3), rgba(0,0,0,0.8))' : 'linear-gradient(135deg, rgba(229,9,20,0.3), rgba(0,0,0,0.8))')
                        : 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{candidate.label}</span>
                    {isActive ? (
                      <Check size={16} className="text-red-500" />
                    ) : (
                      <span style={{ fontSize: 10, color: '#6B7280' }}>Select</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Auto Shift Notification Toast (Disappears in 3.5s) */}
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
              Next Source
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


