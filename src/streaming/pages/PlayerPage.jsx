import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import Hls from 'hls.js';
import {
  Activity,
  Captions,
  Check,
  Clock,
  FileText,
  Globe,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Server,
  Settings,
  Shuffle,
  Sliders,
  Sparkles,
  Upload,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { useStreamingStore } from '../store/useStreamingStore';
import {
  checkStreamProviderHealth,
  fastProbeCandidates,
  prewarmStreamCandidates,
  prewarmStreamUrl,
  getMovieStreamCandidates,
  getTVStreamCandidates,
  getAnimeStreamCandidates,
  getCustomServers,
  saveCustomServer,
} from '../api/streams';
import {
  BINGR_SERVERS,
  fetchBingrStream,
  fetchBingrLanguages,
  prewarmBingrStreams,
  normalizeAudioLabel,
  getLanguageFlag,
} from '../api/bingrDirect.js';
import { cuesToVttBlobUrl, fetchSubtitleText, parseSubtitles, searchOnlineSubtitles } from '../api/subtitles';

const setNativePlayerMode = (enabled) => {
  try {
    window.StreamZoneNative?.setPlayerMode?.(enabled);
  } catch {
    // Native bridge is Android-only.
  }
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state;
  const addToHistory = useStreamingStore(s => s.addToHistory);

  const [customServerList, setCustomServerList] = useState(() => getCustomServers());
  const [isAddingServerOpen, setIsAddingServerOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerFlag, setNewServerFlag] = useState('🇺🇸');

  // Candidate Server List Generation
  const candidates = useMemo(() => {
    let baseList = [];
    if (config?.category === 'tv' && config?.id) {
      baseList = getTVStreamCandidates(config.id, config.season || 1, config.episode || 1);
    } else if (config?.category === 'anime' && config?.id) {
      baseList = getAnimeStreamCandidates(config.id, config.episode || 1);
    } else if (config?.id) {
      baseList = getMovieStreamCandidates(config.id);
    } else if (Array.isArray(config?.candidates) && config.candidates.length) {
      baseList = config.candidates;
    } else if (config?.src) {
      baseList = [{ label: 'Source 1', src: config.src, flag: '🌐', style: 'purple', isPrevious: true }];
    }

    return baseList.map((c, i) => ({
      ...c,
      originalIndex: i,
      label: c.label || c.name || `Source ${i + 1}`,
      flag: c.flag || '🌐',
    }));
  }, [config]);

  const [providerIndex, setProviderIndex] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [health, setHealth] = useState({ status: 'checking', label: 'Checking provider' });
  const [healthMap, setHealthMap] = useState(() => new Map());
  const [isProbingAll, setIsProbingAll] = useState(false);
  const [serverTab, setServerTab] = useState('constellation'); // 'constellation' | 'web' | 'custom' | 'all'
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [autoShiftNotice, setAutoShiftNotice] = useState(null);
  const [, setFailedIndices] = useState(new Set());
  const [autoShiftEnabled, setAutoShiftEnabled] = useState(true);
  const [isSourcesMenuOpen, setIsSourcesMenuOpen] = useState(false);

  // Direct HLS & Multi-Audio States
  const [directStreamUrl, setDirectStreamUrl] = useState(null);
  const [bingrSources, setBingrSources] = useState([]);
  const [bingrSubtitles, setBingrSubtitles] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState('primary');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isResolvingStream, setIsResolvingStream] = useState(false);
  const hlsInstanceRef = useRef(null);

  // Subtitle States
  const [isSubtitlesMenuOpen, setIsSubtitlesMenuOpen] = useState(false);
  const [subModalTab, setSubModalTab] = useState('languages'); // 'languages' | 'search' | 'device'
  const [activeSubtitle, setActiveSubtitle] = useState(null); // { label, blobUrl, cues, language, source }
  const [subtitleSyncOffset, setSubtitleSyncOffset] = useState(0); // in seconds
  const [onlineSubSearchQuery, setOnlineSubSearchQuery] = useState('');
  const [onlineSubResults, setOnlineSubResults] = useState([]);
  const [isSearchingOnlineSubs, setIsSearchingOnlineSubs] = useState(false);
  const [currentCueText, setCurrentCueText] = useState('');

  const userOverriddenRef = useRef(false);
  const loadTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const candidatesRef = useRef(candidates);
  candidatesRef.current = candidates;
  const providerIndexRef = useRef(providerIndex);
  providerIndexRef.current = providerIndex;
  const autoShiftEnabledRef = useRef(autoShiftEnabled);
  autoShiftEnabledRef.current = autoShiftEnabled;
  const healthMapRef = useRef(healthMap);
  healthMapRef.current = healthMap;

  const currentCandidate = candidates[providerIndex] || { label: 'Source 1' };
  const isBingrCandidate = Boolean(currentCandidate?.isBingr || currentCandidate?.isDirectHls);
  const hasAlternateProvider = candidates.length > 1;

  const sourceUrl = useMemo(
    () => directStreamUrl || candidates[providerIndex]?.src || config?.src || config?.embedUrl || '',
    [candidates, config, providerIndex, directStreamUrl]
  );

  // Function to swiftly auto-shift to next healthy, non-failed provider
  const triggerAutoShift = useCallback((reason = 'unreachable') => {
    if (!autoShiftEnabledRef.current) return;
    if (userOverriddenRef.current) return;
    const currentCandidates = candidatesRef.current;
    if (currentCandidates.length <= 1) return;

    const currIdx = providerIndexRef.current;
    setFailedIndices(prev => {
      const nextFailed = new Set(prev);
      nextFailed.add(currIdx);

      let nextIndex = (currIdx + 1) % currentCandidates.length;
      let attempts = 0;

      while (attempts < currentCandidates.length) {
        const cand = currentCandidates[nextIndex];
        const candHealth = cand ? healthMapRef.current.get(cand.src) : null;
        const isKnownDead = candHealth?.status === 'unreachable';

        if (!nextFailed.has(nextIndex) && !isKnownDead) {
          break;
        }
        nextIndex = (nextIndex + 1) % currentCandidates.length;
        attempts++;
      }

      if (attempts >= currentCandidates.length) {
        nextIndex = (currIdx + 1) % currentCandidates.length;
      }

      const prevLabel = currentCandidates[currIdx]?.label || `Source ${currIdx + 1}`;
      const nextLabel = currentCandidates[nextIndex]?.label || `Source ${nextIndex + 1}`;

      prewarmStreamUrl(currentCandidates[nextIndex]?.src);

      setProviderIndex(nextIndex);
      setFrameKey(v => v + 1);
      setAutoShiftNotice(`⚡ Swift Failover: ${prevLabel} (${reason}) → ${nextLabel}`);
      setTimeout(() => setAutoShiftNotice(null), 3500);

      return nextFailed;
    });
  }, []);

  // Initial candidate pre-warming & device setup
  useEffect(() => {
    if (!config) {
      navigate(-1);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    StatusBar.hide().catch(() => {});
    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
    setNativePlayerMode(true);

    const initialQuery = `${config.title || ''} ${config.season ? `S${String(config.season).padStart(2, '0')}E${String(config.episode).padStart(2, '0')}` : ''}`.trim();
    setOnlineSubSearchQuery(initialQuery);

    // Prewarm Constellation master cluster s70 in background for 0ms server switching
    prewarmBingrStreams({
      type: config.category || 'movie',
      id: config.id,
      title: config.title,
      year: config.year,
      season: config.season,
      episode: config.episode,
    });

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
  }, [addToHistory, config, navigate]);

  // Bingr Constellation Stream Resolution Effect
  useEffect(() => {
    if (!isBingrCandidate) {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      setDirectStreamUrl(null);
      setBingrSources([]);
      setBingrSubtitles([]);
      setAudioTracks([]);
      setIsResolvingStream(false);
      return;
    }

    let isCancelled = false;
    setIsResolvingStream(true);
    setHealth({ status: 'checking', label: `Connecting to ${currentCandidate.label}...` });

    const resolveStream = async () => {
      try {
        const streamData = await fetchBingrStream({
          srv: currentCandidate.srv || 's70',
          type: config?.category || 'movie',
          id: config?.id,
          title: config?.title,
          year: config?.year,
          season: config?.season,
          episode: config?.episode,
          timeoutMs: 1800,
        });

        if (isCancelled) return;

        const sources = streamData.sources || [];
        const subtitles = streamData.subtitles || [];

        if (sources.length > 0) {
          setBingrSources(sources);
          setBingrSubtitles(subtitles);

          // Build audio tracks list matching Screenshot 3
          const primarySrc = sources[0];
          const primaryNorm = normalizeAudioLabel(primarySrc);
          const initialAudioTracks = [
            {
              id: 'primary',
              name: primaryNorm.cleanName,
              subtext: primaryNorm.subtext || 'Original',
              flag: primaryNorm.flag,
              url: primarySrc.url,
              type: primarySrc.type,
              quality: primarySrc.quality || '1080p',
              isOriginal: true,
            },
          ];

          const seenLangs = new Set([primaryNorm.cleanName.toLowerCase()]);

          // Multi-audio sources returned from stream
          sources.slice(1).forEach((src, idx) => {
            const norm = normalizeAudioLabel(src);
            const key = norm.cleanName.toLowerCase();
            if (!seenLangs.has(key)) {
              seenLangs.add(key);
              initialAudioTracks.push({
                id: `src-${idx}-${key}`,
                name: norm.cleanName,
                subtext: src.quality || norm.subtext,
                flag: norm.flag,
                url: src.url,
                type: src.type,
                quality: src.quality || '1080p',
              });
            }
          });

          setAudioTracks(initialAudioTracks);
          setActiveAudioTrackId('primary');
          setDirectStreamUrl(primarySrc.url);
          setHealth({ status: 'online', label: 'Streaming Direct HD' });
          setIsResolvingStream(false);

          // Asynchronously enrich audio tracks with dubbed sources in background without blocking video playback
          fetchBingrLanguages({
            type: config?.category || 'movie',
            id: config?.id,
            title: config?.title,
            year: config?.year,
            timeoutMs: 2500,
          }).then(langData => {
            if (isCancelled || !Array.isArray(langData) || langData.length === 0) return;
            setAudioTracks(prev => {
              const currentSeen = new Set(prev.map(p => p.name.toLowerCase()));
              const additional = [];
              langData.forEach((langSrc, idx) => {
                const norm = normalizeAudioLabel(langSrc);
                const key = norm.cleanName.toLowerCase();
                if (!currentSeen.has(key)) {
                  currentSeen.add(key);
                  additional.push({
                    id: `lang-${idx}-${key}`,
                    name: norm.cleanName,
                    subtext: langSrc.quality || '1080p',
                    flag: norm.flag,
                    url: langSrc.url,
                    type: langSrc.type,
                    quality: langSrc.quality || '1080p',
                  });
                }
              });
              return additional.length > 0 ? [...prev, ...additional] : prev;
            });
          }).catch(() => {});
        } else {
          setIsResolvingStream(false);
          setHealth({ status: 'unreachable', label: 'No stream on server' });
          if (autoShiftEnabledRef.current && !userOverriddenRef.current && candidatesRef.current.length > 1) {
            triggerAutoShift(`No stream on ${currentCandidate.label}`);
          }
        }
      } catch (err) {
        if (isCancelled) return;
        setIsResolvingStream(false);
        setHealth({ status: 'unreachable', label: 'Server offline' });
        if (autoShiftEnabledRef.current && !userOverriddenRef.current && candidatesRef.current.length > 1) {
          triggerAutoShift(`Error on ${currentCandidate.label}`);
        }
      }
    };

    resolveStream();

    return () => {
      isCancelled = true;
    };
  }, [currentCandidate, config, isBingrCandidate, triggerAutoShift]);

  // HLS Video Playback Engine
  useEffect(() => {
    if (!directStreamUrl || !videoRef.current) return;
    const video = videoRef.current;

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    const isM3U8 = directStreamUrl.includes('.m3u8') || directStreamUrl.includes('mpegurl');

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsInstanceRef.current = hls;
      hls.loadSource(directStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.playbackRate = playbackSpeed;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              if (autoShiftEnabledRef.current && !userOverriddenRef.current) {
                triggerAutoShift('HLS fatal stream error');
              }
              break;
          }
        }
      });
    } else {
      video.src = directStreamUrl;
      video.playbackRate = playbackSpeed;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [directStreamUrl, playbackSpeed, triggerAutoShift]);

  // Speed change effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Fallback Provider Health Check (for iframe embed servers)
  useEffect(() => {
    if (isBingrCandidate || !sourceUrl) return undefined;
    let cancelled = false;

    setHealth({ status: 'checking', label: 'Connecting to provider...' });

    checkStreamProviderHealth(sourceUrl, { timeoutMs: 3000 }).then(result => {
      if (cancelled) return;
      setHealth(result);
      setHealthMap(prev => new Map(prev).set(sourceUrl, result));

      if (
        result.status === 'unreachable' &&
        autoShiftEnabledRef.current &&
        !userOverriddenRef.current &&
        candidatesRef.current.length > 1
      ) {
        triggerAutoShift('offline');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sourceUrl, isBingrCandidate, triggerAutoShift]);

  // Watchdog timer for iframe embeds
  useEffect(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setShowSlowHint(false);

    loadTimeoutRef.current = setTimeout(() => {
      setShowSlowHint(true);
    }, 8500);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [sourceUrl, frameKey]);

  // Subtitle Cue Sync Timer
  useEffect(() => {
    if (!activeSubtitle || !activeSubtitle.cues || activeSubtitle.cues.length === 0) {
      setCurrentCueText('');
      return undefined;
    }

    let startTime = Date.now();
    const interval = setInterval(() => {
      let currentTime = (Date.now() - startTime) / 1000;
      if (videoRef.current && !isNaN(videoRef.current.currentTime)) {
        currentTime = videoRef.current.currentTime;
      }
      const adjustedTime = currentTime + subtitleSyncOffset;

      const activeCue = activeSubtitle.cues.find(
        cue => adjustedTime >= cue.start && adjustedTime <= cue.end
      );

      setCurrentCueText(activeCue ? activeCue.text : '');
    }, 150);

    return () => clearInterval(interval);
  }, [activeSubtitle, subtitleSyncOffset]);

  // Handle switching audio track
  const handleSelectAudioTrack = (track) => {
    if (!track) return;
    const currentTime = videoRef.current ? videoRef.current.currentTime : 0;
    setActiveAudioTrackId(track.id);

    if (track.url && track.url !== directStreamUrl) {
      setDirectStreamUrl(track.url);
      const video = videoRef.current;
      if (video) {
        const onLoaded = () => {
          video.currentTime = currentTime;
          video.play().catch(() => {});
          video.removeEventListener('loadedmetadata', onLoaded);
        };
        video.addEventListener('loadedmetadata', onLoaded);
      }
    }
  };

  // Handle selecting subtitle from list
  const handleSelectBingrSubtitle = async (sub) => {
    if (!sub) {
      setActiveSubtitle(null);
      setCurrentCueText('');
      return;
    }

    try {
      setAutoShiftNotice(`Applying subtitle: ${sub.label}...`);
      const text = await fetchSubtitleText(sub.url);
      const cues = parseSubtitles(text);
      if (cues.length === 0) {
        setAutoShiftNotice('Subtitle could not be parsed');
        setTimeout(() => setAutoShiftNotice(null), 3000);
        return;
      }
      const blobUrl = cuesToVttBlobUrl(cues);
      setActiveSubtitle({
        label: sub.label,
        blobUrl,
        cues,
        language: sub.lang || sub.label,
        source: 'Bingr',
      });
      setAutoShiftNotice(`CC: ${sub.label} enabled`);
      setTimeout(() => setAutoShiftNotice(null), 3000);
    } catch (err) {
      setAutoShiftNotice(`Subtitle download error: ${err.message}`);
      setTimeout(() => setAutoShiftNotice(null), 3000);
    }
  };

  // User manual provider select
  const selectProvider = (index, e) => {
    if (e) e.stopPropagation();
    userOverriddenRef.current = true;
    const target = candidates[index];
    setProviderIndex(index);
    setFrameKey(v => v + 1);
    setIsSourcesMenuOpen(false);
    setAutoShiftNotice(`⚡ Connected to ${target?.label || `Server ${index + 1}`}`);
    setTimeout(() => setAutoShiftNotice(null), 2500);
  };

  // Next Server quick failover button
  const tryAlternateProvider = (e) => {
    if (e) e.stopPropagation();
    userOverriddenRef.current = true;
    const nextIdx = (providerIndex + 1) % candidates.length;
    const target = candidates[nextIdx];
    setProviderIndex(nextIdx);
    setFrameKey(v => v + 1);
    setAutoShiftNotice(`⚡ Switched to ${target?.label || `Server ${nextIdx + 1}`}`);
    setTimeout(() => setAutoShiftNotice(null), 2500);
  };

  // Reload current provider
  const retryCurrentProvider = (e) => {
    if (e) e.stopPropagation();
    setFrameKey(v => v + 1);
    setHealth({ status: 'checking', label: 'Reloading...' });
    if (directStreamUrl && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  // Subtitle search & file import
  const handleLocalDeviceFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result || '';
        const cues = parseSubtitles(text);
        if (cues.length === 0) {
          alert('Could not parse subtitles from this file. Make sure it is a valid .srt or .vtt file.');
          return;
        }
        const blobUrl = cuesToVttBlobUrl(cues);
        setActiveSubtitle({
          label: file.name,
          blobUrl,
          cues,
          language: 'Device File',
          source: 'Device',
        });
        setAutoShiftNotice(`CC: Imported ${cues.length} cues from ${file.name}`);
        setTimeout(() => setAutoShiftNotice(null), 4000);
        setIsSubtitlesMenuOpen(false);
      } catch (err) {
        alert(`Failed to read file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSearchOnlineSubtitles = async () => {
    setIsSearchingOnlineSubs(true);
    setOnlineSubResults([]);
    try {
      const results = await searchOnlineSubtitles({
        title: onlineSubSearchQuery || config?.title || '',
        id: config?.id || config?.anilistId || config?.tmdbId || '',
        season: config?.season,
        episode: config?.episode,
        category: config?.category || 'movie',
      });
      setOnlineSubResults(results);
    } catch (err) {
      console.error('Online subtitle search error:', err);
    } finally {
      setIsSearchingOnlineSubs(false);
    }
  };

  const handleSelectOnlineSub = async (sub) => {
    try {
      setAutoShiftNotice(`Downloading subtitle (${sub.language})...`);
      const text = await fetchSubtitleText(sub.url);
      const cues = parseSubtitles(text);
      if (cues.length === 0) {
        alert('Downloaded subtitle was empty or could not be parsed.');
        setAutoShiftNotice(null);
        return;
      }
      const blobUrl = cuesToVttBlobUrl(cues);
      setActiveSubtitle({
        label: sub.label,
        blobUrl,
        cues,
        language: sub.language,
        source: sub.source,
      });
      setAutoShiftNotice(`CC: Subtitle applied (${sub.language})`);
      setTimeout(() => setAutoShiftNotice(null), 4000);
      setIsSubtitlesMenuOpen(false);
    } catch (err) {
      alert(`Could not download subtitle: ${err.message}`);
      setAutoShiftNotice(null);
    }
  };

  const handleSaveCustomServer = () => {
    if (!newServerName.trim() || !newServerUrl.trim()) return;
    saveCustomServer({
      id: `custom-${Date.now()}`,
      name: newServerName.trim(),
      flag: newServerFlag || '🇺🇸',
      url: newServerUrl.trim(),
      movieUrlTemplate: newServerUrl.trim(),
      tvUrlTemplate: newServerUrl.trim(),
    });
    setCustomServerList(getCustomServers());
    setIsAddingServerOpen(false);
    setNewServerName('');
    setNewServerUrl('');
  };

  // Filter candidates by category tabs
  const displayedCandidates = useMemo(() => {
    if (serverTab === 'constellation') {
      return candidates.filter(c => c.tier === 'constellation' || c.isBingr || c.isDirectHls);
    }
    if (serverTab === 'web') {
      return candidates.filter(c => c.tier === 'primary' || c.tier === 'mirror' || (!c.isBingr && !c.isCustom));
    }
    if (serverTab === 'custom') {
      return candidates.filter(c => c.isCustom || c.id?.startsWith('custom-'));
    }
    return candidates;
  }, [candidates, serverTab]);

  if (!config) return null;

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
      }}
    >
      {/* Top Left Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
        aria-label="Close player"
        title="Close player"
        style={{
          position: 'fixed',
          top: 'max(14px, env(safe-area-inset-top))',
          left: 'max(14px, env(safe-area-inset-left))',
          zIndex: 2147483647,
          background: 'rgba(15, 15, 20, 0.85)',
          border: '1px solid rgba(255,255,255,0.24)',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          userSelect: 'none',
        }}
      >
        <X size={22} />
      </button>

      {/* Top Right Controls (Max z-index, guaranteed clickable) */}
      <div
        style={{
          position: 'fixed',
          top: 'max(14px, env(safe-area-inset-top))',
          right: 'max(14px, env(safe-area-inset-right))',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'auto',
          touchAction: 'manipulation',
        }}
      >
        {/* Next Server Button */}
        {hasAlternateProvider && (
          <button
            onClick={tryAlternateProvider}
            aria-label="Next working server"
            title="Switch to next working streaming server"
            style={{
              height: 40,
              padding: '0 16px',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 12,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(229,9,20,0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              userSelect: 'none',
              transition: 'transform 0.1s ease',
            }}
          >
            <Shuffle size={15} />
            <span>Next Server</span>
          </button>
        )}

        {/* Current Active Server Pill & Drawer Opener */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSourcesMenuOpen(prev => !prev);
          }}
          title="Click to view & select from Constellation & Web servers"
          aria-label="Stream servers menu"
          style={{
            height: 40,
            background: 'rgba(18, 19, 26, 0.92)',
            border: isBingrCandidate ? '1.5px solid #38BDF8' : '1.5px solid rgba(255,255,255,0.22)',
            borderRadius: 24,
            padding: '0 15px',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            boxShadow: isBingrCandidate ? '0 0 14px rgba(56,189,248,0.35)' : '0 4px 16px rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            userSelect: 'none',
            transition: 'transform 0.1s ease',
          }}
        >
          {currentCandidate.id === 'bingr-aphelion' ? (
            <Sparkles size={15} className="text-cyan-400" />
          ) : (
            <span style={{ fontSize: 15 }}>{currentCandidate.flag || '🌐'}</span>
          )}
          <span>{currentCandidate.label}</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: health.status === 'online' ? '#10B981' : health.status === 'degraded' ? '#FBBF24' : '#EF4444',
              boxShadow: health.status === 'online' ? '0 0 6px #10B981' : 'none',
            }}
          />
        </button>

        {/* Reload Current Source Button */}
        <button
          onClick={retryCurrentProvider}
          aria-label="Reload stream"
          title="Reload current stream"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(18, 19, 26, 0.92)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            userSelect: 'none',
            transition: 'transform 0.1s ease',
          }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Audio & Subtitles Drawer Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSubtitlesMenuOpen(prev => !prev);
          }}
          aria-label="Audio and Subtitles"
          title="Audio Languages & Subtitles"
          style={{
            height: 40,
            background: (activeSubtitle || audioTracks.length > 1) ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'rgba(18, 19, 26, 0.92)',
            border: (activeSubtitle || audioTracks.length > 1) ? '2px solid #60A5FA' : '1px solid rgba(255,255,255,0.22)',
            borderRadius: 24,
            padding: '0 14px',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            boxShadow: activeSubtitle ? '0 0 12px rgba(37,99,235,0.6)' : '0 4px 12px rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            userSelect: 'none',
            transition: 'transform 0.1s ease',
          }}
        >
          <Volume2 size={15} className="text-blue-300" />
          <span>{activeSubtitle ? 'CC On' : 'Audio & Subs'}</span>
        </button>
      </div>

      {/* Hidden Device File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".srt,.vtt,.ass,.txt"
        style={{ display: 'none' }}
        onChange={handleLocalDeviceFileSelect}
      />

      {/* =========================================================================
          SERVER CONSTELLATION & SPEED DRAWER (MATCHING SCREENSHOT 1 & 2)
          ========================================================================= */}
      {isSourcesMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            touchAction: 'manipulation',
            pointerEvents: 'auto',
          }}
          onClick={() => {
            setIsSourcesMenuOpen(false);
            setIsAddingServerOpen(false);
          }}
        >
          <div
            style={{
              width: 'min(94vw, 560px)',
              background: '#0B0C0E',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '24px',
              color: '#fff',
              boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              touchAction: 'manipulation',
              pointerEvents: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header with Category Tabs & Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setServerTab('constellation')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'constellation' ? '#38BDF8' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'constellation' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'constellation' ? '#38BDF8' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={13} />
                  <span>Constellation</span>
                </button>

                <button
                  onClick={() => setServerTab('web')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'web' ? '#A855F7' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'web' ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'web' ? '#A855F7' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Globe size={13} />
                  <span>Web Servers</span>
                </button>

                <button
                  onClick={() => setServerTab('custom')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'custom' ? '#10B981' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'custom' ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'custom' ? '#10B981' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sliders size={13} />
                  <span>Custom</span>
                </button>
              </div>

              <button
                onClick={() => setIsSourcesMenuOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 0,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Two Column Layout (Screenshot 1 & 2): Left QUALITY, Right SERVER */}
            <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 24, minHeight: 280 }}>
              {/* Left Column: QUALITY */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 16 }}>
                <div style={{ color: '#71717A', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
                  QUALITY
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <Check size={16} className="text-sky-400 mt-0.5" strokeWidth={3} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Cinematic</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>Up to 1080p</div>
                  </div>
                </div>
              </div>

              {/* Right Column: SERVER */}
              <div>
                <div style={{ color: '#71717A', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>
                  SERVER
                </div>

                <div
                  style={{
                    maxHeight: 290,
                    overflowY: 'auto',
                    paddingRight: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {displayedCandidates.map(candidate => {
                    const actualIdx = candidate.originalIndex ?? 0;
                    const isActive = actualIdx === providerIndex;

                    return (
                      <button
                        key={`${candidate.label}-${candidate.src}-${actualIdx}`}
                        type="button"
                        onClick={(e) => selectProvider(actualIdx, e)}
                        style={{
                          height: 42,
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '0 12px',
                          borderRadius: 10,
                          border: 0,
                          background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Active Blue Checkmark on the left */}
                        <div style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                          {isActive && <Check size={16} className="text-sky-400" strokeWidth={3} />}
                        </div>

                        {/* Icon: Star for Aphelion, Flag for others */}
                        <div style={{ width: 22, display: 'flex', justifyContent: 'center' }}>
                          {candidate.id === 'bingr-aphelion' || candidate.name === 'Aphelion' ? (
                            <Sparkles size={16} className="text-cyan-400" />
                          ) : (
                            <span style={{ fontSize: 17, lineHeight: 1 }}>{candidate.flag || '🌐'}</span>
                          )}
                        </div>

                        {/* Server Name & Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {candidate.label}
                          </span>
                          {candidate.badge && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: candidate.isPrimary ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.08)',
                                color: candidate.isPrimary ? '#38BDF8' : 'rgba(255,255,255,0.6)',
                                border: candidate.isPrimary ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                letterSpacing: '0.02em',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {candidate.badge}
                            </span>
                          )}
                        </div>

                        {/* Ping / Status dot */}
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: isActive ? '#38BDF8' : 'rgba(255,255,255,0.35)',
                            boxShadow: isActive ? '0 0 6px #38BDF8' : 'none',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Row: SPEED Controls (Screenshot 2) */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ color: '#71717A', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  SPEED
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {SPEED_OPTIONS.map(spd => {
                    const isCurrent = playbackSpeed === spd;
                    return (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setPlaybackSpeed(spd)}
                        style={{
                          background: isCurrent ? '#FFFFFF' : 'transparent',
                          color: isCurrent ? '#000000' : 'rgba(255,255,255,0.7)',
                          border: 0,
                          borderRadius: 9999,
                          padding: isCurrent ? '4px 14px' : '4px 8px',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {spd}x
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                title="Player Settings"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          AUDIO & SUBTITLES DRAWER (MATCHING SCREENSHOT 3)
          ========================================================================= */}
      {isSubtitlesMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            touchAction: 'manipulation',
            pointerEvents: 'auto',
          }}
          onClick={() => setIsSubtitlesMenuOpen(false)}
        >
          <div
            style={{
              width: 'min(94vw, 560px)',
              background: '#0B0C0E',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '24px',
              color: '#fff',
              boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              touchAction: 'manipulation',
              pointerEvents: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Subtitle Search / File Tab toggle & Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setSubModalTab('languages')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid ' + (subModalTab === 'languages' ? '#38BDF8' : 'rgba(255,255,255,0.1)'),
                    background: subModalTab === 'languages' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                    color: subModalTab === 'languages' ? '#38BDF8' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Audio & Subtitles
                </button>

                <button
                  onClick={() => {
                    setSubModalTab('search');
                    if (onlineSubResults.length === 0) handleSearchOnlineSubtitles();
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid ' + (subModalTab === 'search' ? '#38BDF8' : 'rgba(255,255,255,0.1)'),
                    background: subModalTab === 'search' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                    color: subModalTab === 'search' ? '#38BDF8' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Search Online
                </button>
              </div>

              <button
                onClick={() => setIsSubtitlesMenuOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 0,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* TAB 1: AUDIO & SUBTITLES COLUMNS (SCREENSHOT 3) */}
            {subModalTab === 'languages' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, minHeight: 290 }}>
                {/* Column 1: AUDIO */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 16 }}>
                  <div style={{ color: '#71717A', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>
                    AUDIO
                  </div>

                  <div
                    style={{
                      maxHeight: 280,
                      overflowY: 'auto',
                      paddingRight: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {audioTracks.length > 0 ? (
                      audioTracks.map((track) => {
                        const isSelected = track.id === activeAudioTrackId;
                        return (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => handleSelectAudioTrack(track)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: 0,
                              background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                              color: '#fff',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.15s ease',
                              width: '100%',
                            }}
                          >
                            <div style={{ width: 14, display: 'flex', justifyContent: 'center' }}>
                              {isSelected && <Check size={15} className="text-sky-400" strokeWidth={3} />}
                            </div>

                            <span style={{ fontSize: 17, lineHeight: 1 }}>{track.flag}</span>

                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{track.name}</div>
                              {track.subtext && (
                                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{track.subtext}</div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      // Default audio option when no multi-audio returned
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Check size={15} className="text-sky-400" strokeWidth={3} />
                        <span style={{ fontSize: 17 }}>🇺🇸</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>English</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>Original</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: SUBTITLES */}
                <div>
                  <div style={{ color: '#71717A', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>
                    SUBTITLES
                  </div>

                  <div
                    style={{
                      maxHeight: 230,
                      overflowY: 'auto',
                      paddingRight: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {/* Off Option */}
                    <button
                      type="button"
                      onClick={() => handleSelectBingrSubtitle(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: 0,
                        background: activeSubtitle === null ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div style={{ width: 14, display: 'flex', justifyContent: 'center' }}>
                        {activeSubtitle === null && <Check size={15} className="text-sky-400" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>Off</span>
                    </button>

                    {/* Bingr Subtitles List */}
                    {bingrSubtitles.map((sub, idx) => {
                      const isSelected = activeSubtitle?.label === sub.label;
                      return (
                        <button
                          key={`${sub.label}-${idx}`}
                          type="button"
                          onClick={() => handleSelectBingrSubtitle(sub)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 0,
                            background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                          }}
                        >
                          <div style={{ width: 14, display: 'flex', justifyContent: 'center' }}>
                            {isSelected && <Check size={15} className="text-sky-400" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800 }}>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Subtitle Sync Offset Delay Adjuster (When Subtitle is Active) */}
                  {activeSubtitle && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(37,99,235,0.12)',
                        border: '1px solid rgba(37,99,235,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} /> Sync: <strong style={{ color: '#fff' }}>{subtitleSyncOffset >= 0 ? `+${subtitleSyncOffset.toFixed(1)}s` : `${subtitleSyncOffset.toFixed(1)}s`}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => setSubtitleSyncOffset(s => Number((s - 0.5).toFixed(1)))}
                          style={{ background: 'rgba(255,255,255,0.12)', border: 0, borderRadius: 8, width: 22, height: 22, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                        >
                          <Minus size={11} />
                        </button>
                        <button
                          onClick={() => setSubtitleSyncOffset(0)}
                          style={{ background: 'rgba(255,255,255,0.12)', border: 0, borderRadius: 8, padding: '2px 6px', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                        >
                          0
                        </button>
                        <button
                          onClick={() => setSubtitleSyncOffset(s => Number((s + 0.5).toFixed(1)))}
                          style={{ background: 'rgba(255,255,255,0.12)', border: 0, borderRadius: 8, width: 22, height: 22, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Upload Box (Screenshot 3) */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '1.5px dashed rgba(255,255,255,0.22)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      marginTop: 10,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Upload size={14} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Upload Subtitle File (.srt, .vtt)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ONLINE SUBTITLE SEARCH */}
            {subModalTab === 'search' && (
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={onlineSubSearchQuery}
                    onChange={e => setOnlineSubSearchQuery(e.target.value)}
                    placeholder="Search movie/TV subtitle..."
                    onKeyDown={e => e.key === 'Enter' && handleSearchOnlineSubtitles()}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSearchOnlineSubtitles}
                    style={{
                      background: '#2563EB',
                      border: 0,
                      borderRadius: 10,
                      padding: '0 14px',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Search size={14} />
                  </button>
                </div>

                <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                  {isSearchingOnlineSubs ? (
                    <div style={{ textAlign: 'center', padding: '20px', fontSize: 12, color: '#9CA3AF' }}>
                      🔍 Searching subtitles online...
                    </div>
                  ) : onlineSubResults.length > 0 ? (
                    onlineSubResults.map((sub, idx) => (
                      <div
                        key={`${sub.id}-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)',
                          marginBottom: 6,
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{sub.label}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{sub.source} • {sub.language}</div>
                        </div>
                        <button
                          onClick={() => handleSelectOnlineSub(sub)}
                          style={{
                            background: 'rgba(37,99,235,0.8)',
                            border: 0,
                            borderRadius: 16,
                            padding: '5px 12px',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Use Sub
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: '#6B7280' }}>
                      No online subtitles loaded. Enter title and click Search.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
          }}
        >
          {autoShiftNotice}
        </div>
      )}

      {/* On-Screen Active Subtitle Overlay */}
      {currentCueText && (
        <div
          style={{
            position: 'fixed',
            bottom: 'max(40px, env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10002,
            padding: '6px 16px',
            background: 'rgba(0, 0, 0, 0.82)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            color: '#FFFFFF',
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 800,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
            backdropFilter: 'blur(6px)',
            maxWidth: '85vw',
            lineHeight: 1.35,
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
          }}
        >
          {currentCueText}
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
            type="button"
            onClick={retryCurrentProvider}
            style={{
              color: '#fff',
              background: 'rgba(255,255,255,0.15)',
              border: 0,
              borderRadius: 999,
              padding: '6px 14px',
              fontWeight: 800,
              cursor: 'pointer',
              touchAction: 'manipulation',
              pointerEvents: 'auto',
            }}
          >
            Retry
          </button>
          {hasAlternateProvider && (
            <button
              type="button"
              onClick={tryAlternateProvider}
              style={{
                color: '#fff',
                background: 'linear-gradient(135deg, #E50914, #B20710)',
                border: 0,
                borderRadius: 999,
                padding: '6px 14px',
                fontWeight: 800,
                cursor: 'pointer',
                touchAction: 'manipulation',
                pointerEvents: 'auto',
              }}
            >
              Next Server
            </button>
          )}
        </div>
      )}

      {/* Video Surface: Direct HLS Video or Iframe Embed */}
      {isBingrCandidate ? (
        <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
          {isResolvingStream && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                color: '#fff',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '3px solid rgba(56,189,248,0.3)',
                  borderTopColor: '#38BDF8',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF' }}>
                Connecting to {currentCandidate.label}...
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            key={`video-${providerIndex}-${frameKey}`}
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
            {activeSubtitle?.blobUrl && (
              <track
                kind="subtitles"
                src={activeSubtitle.blobUrl}
                srcLang="en"
                label={activeSubtitle.label}
                default
              />
            )}
          </video>
        </div>
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
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        />
      )}
    </div>
  );
}
