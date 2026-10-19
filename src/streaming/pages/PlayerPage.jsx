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
  probeCandidateServer,
  raceAllServersParallel,
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
  const locationState = location.state;

  // Restore active config from location state or session storage to survive page reload / refresh
  const [config, setConfig] = useState(() => {
    if (locationState) {
      try {
        sessionStorage.setItem('streamzone_active_config', JSON.stringify(locationState));
      } catch {}
      return locationState;
    }
    try {
      const saved = sessionStorage.getItem('streamzone_active_config');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (locationState) {
      setConfig(locationState);
      try {
        sessionStorage.setItem('streamzone_active_config', JSON.stringify(locationState));
      } catch {}
    }
  }, [locationState]);

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
    } else if (config?.category === 'anime' && (config?.id || config?.anilistId)) {
      baseList = getAnimeStreamCandidates(config.anilistId || config.id, config.episode || 1, {
        title: config.title,
        anilistId: config.anilistId || config.id,
        dub: config.dub,
      });
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

  // Direct HLS & Multi-Audio States (Declared BEFORE any effects)
  const [directStreamUrl, setDirectStreamUrl] = useState(null);
  const [bingrSources, setBingrSources] = useState([]);
  const [bingrSubtitles, setBingrSubtitles] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState('primary');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isResolvingStream, setIsResolvingStream] = useState(false);
  const hlsInstanceRef = useRef(null);

  // Initialize providerIndex to match requested src or first verified web embed if mode is iframe
  const [providerIndex, setProviderIndex] = useState(() => {
    if (config?.src && Array.isArray(candidates) && candidates.length > 0) {
      const matchIdx = candidates.findIndex(c => c.src === config.src);
      if (matchIdx !== -1) return matchIdx;
    }
    if (config?.mode === 'iframe' && Array.isArray(candidates) && candidates.length > 0) {
      const firstWeb = candidates.findIndex(c => !c.isBingr && !c.isDirectHls && c.src && !c.src.startsWith('/api/'));
      if (firstWeb !== -1) return firstWeb;
    }
    return 0;
  });

  const [frameKey, setFrameKey] = useState(0);
  const [health, setHealth] = useState({ status: 'checking', label: 'Checking provider' });
  const [healthMap, setHealthMap] = useState(() => new Map());
  const [isProbingAll, setIsProbingAll] = useState(false);
  const [serverTab, setServerTab] = useState(() => {
    if (config?.category === 'anime') return 'anime';
    if (config?.mode === 'iframe') return 'web';
    return 'constellation';
  });
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [autoShiftNotice, setAutoShiftNotice] = useState(null);
  const [, setFailedIndices] = useState(new Set());
  const [autoShiftEnabled, setAutoShiftEnabled] = useState(true);
  const [isSourcesMenuOpen, setIsSourcesMenuOpen] = useState(false);

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

  // Real-Time Playback Readiness Trackers
  const streamLoadStartRef = useRef(performance.now());
  const streamReadyNotifiedRef = useRef(false);

  const markStreamAsReady = useCallback((triggerReason = 'media') => {
    setIsStreamReady(true);
    if (!streamReadyNotifiedRef.current) {
      streamReadyNotifiedRef.current = true;
      const elapsedMs = Math.max(1, Math.round(performance.now() - streamLoadStartRef.current));
      const curr = candidatesRef.current[providerIndexRef.current];
      const name = curr?.label || 'Server';
      setAutoShiftNotice(`⚡ Stream Ready & Live: ${name} • Loaded in ${elapsedMs}ms`);
      setTimeout(() => setAutoShiftNotice(null), 3200);
    }
  }, []);

  // Reset stream readiness on provider / frame reload
  useEffect(() => {
    setIsStreamReady(false);
    streamReadyNotifiedRef.current = false;
    streamLoadStartRef.current = performance.now();
  }, [providerIndex, frameKey, directStreamUrl]);

  const currentCandidate = candidates[providerIndex] || { label: 'Source 1' };
  const isBingrCandidate = Boolean(currentCandidate?.isBingr || currentCandidate?.isDirectHls);
  const hasAlternateProvider = candidates.length > 1;

  // Dedicated safe embed URL for <iframe> elements.
  // NEVER passes M3U8 direct stream or /api/streaming/bingr/* endpoint to an iframe.
  const embedUrl = useMemo(() => {
    const curr = candidates[providerIndex];
    if (curr && !curr.isBingr && !curr.isDirectHls && curr.src && !curr.src.startsWith('/api/')) {
      return curr.src;
    }
    const firstWeb = candidates.find(c => !c.isBingr && !c.isDirectHls && c.src && !c.src.startsWith('/api/'));
    if (firstWeb?.src) return firstWeb.src;
    if (config?.src && !config.src.startsWith('/api/')) return config.src;
    if (config?.embedUrl) return config.embedUrl;
    if (config?.category === 'tv' && config?.id) {
      return `https://www.2embed.cc/embedtv/${config.id}&s=${config.season || 1}&e=${config.episode || 1}`;
    }
    if (config?.id) {
      return `https://www.2embed.cc/embed/${config.id}`;
    }
    return '';
  }, [candidates, config, providerIndex]);

  // Function to swiftly auto-shift to next healthy, lowest-latency verified provider
  const triggerAutoShift = useCallback((reason = 'unreachable') => {
    if (!autoShiftEnabledRef.current) return;
    if (userOverriddenRef.current) return;
    const currentCandidates = candidatesRef.current;
    if (currentCandidates.length <= 1) return;

    const currIdx = providerIndexRef.current;
    setFailedIndices(prev => {
      const nextFailed = new Set(prev);
      nextFailed.add(currIdx);

      // 1. Prioritize tested online servers with the lowest ping
      let bestIndex = -1;
      let lowestPing = Infinity;

      currentCandidates.forEach((cand, idx) => {
        if (nextFailed.has(idx)) return;
        const candHealth = healthMapRef.current.get(cand.id) || healthMapRef.current.get(cand.src);
        if (candHealth?.status === 'online') {
          const ping = candHealth.ping || 400;
          if (ping < lowestPing) {
            lowestPing = ping;
            bestIndex = idx;
          }
        }
      });

      // 2. Fallback to next non-failed, non-dead server
      if (bestIndex === -1) {
        let nextIndex = (currIdx + 1) % currentCandidates.length;
        let attempts = 0;
        while (attempts < currentCandidates.length) {
          const cand = currentCandidates[nextIndex];
          const candHealth = cand ? (healthMapRef.current.get(cand.id) || healthMapRef.current.get(cand.src)) : null;
          const isKnownDead = candHealth?.status === 'unreachable';
          if (!nextFailed.has(nextIndex) && !isKnownDead) {
            bestIndex = nextIndex;
            break;
          }
          nextIndex = (nextIndex + 1) % currentCandidates.length;
          attempts++;
        }
      }

      if (bestIndex === -1) {
        bestIndex = (currIdx + 1) % currentCandidates.length;
      }

      const prevLabel = currentCandidates[currIdx]?.label || `Source ${currIdx + 1}`;
      const nextLabel = currentCandidates[bestIndex]?.label || `Source ${bestIndex + 1}`;

      prewarmStreamUrl(currentCandidates[bestIndex]?.src);

      setProviderIndex(bestIndex);
      setFrameKey(v => v + 1);
      setAutoShiftNotice(`⚡ Swift Failover: ${prevLabel} (${reason}) → ${nextLabel}`);
      setTimeout(() => setAutoShiftNotice(null), 3500);

      return nextFailed;
    });
  }, []);

  // Real-Time Parallel Server Race Engine (< 10 seconds)
  // Concurrently benchmarks Constellation & Web servers, auto-locks onto the first working stream
  const triggerServerRace = useCallback(() => {
    const currentCandidates = candidatesRef.current;
    if (!currentCandidates || currentCandidates.length === 0 || !config) return;
    setIsProbingAll(true);

    raceAllServersParallel(currentCandidates, config, {
      timeoutMs: 3200,
      onCandidateTested: (_idx, candidate, healthResult) => {
        setHealthMap(prev => {
          const next = new Map(prev);
          if (candidate.id) next.set(candidate.id, healthResult);
          if (candidate.src) next.set(candidate.src, healthResult);
          return next;
        });
      },
      onFirstWinner: (winIdx, winCandidate, winHealth) => {
        if (!userOverriddenRef.current) {
          setProviderIndex(winIdx);
          setFrameKey(v => v + 1);
          setAutoShiftNotice(`⚡ Auto-Selected Fastest Server: ${winCandidate.label} (${winHealth.ping}ms)`);
          setTimeout(() => setAutoShiftNotice(null), 3000);
        }
      },
    }).finally(() => {
      setIsProbingAll(false);
    });
  }, [config]);

  // Initial candidate pre-warming, parallel server race & device setup
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

    // Launch Real-Time Parallel Server Race
    triggerServerRace();

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
        let streamData = null;
        if (currentCandidate.id === 'animesalt-hls') {
          const title = config?.title || config?.id || '';
          const ep = config?.episode || 1;
          const res = await fetch(`/api/streaming/bingr/animesalt?title=${encodeURIComponent(title)}&ep=${ep}&season=1`);
          if (res.ok) {
            const anData = await res.json();
            if (anData && Array.isArray(anData.streams) && anData.streams.length > 0) {
              streamData = {
                sources: anData.streams.map(s => ({
                  url: s.url,
                  quality: `${s.quality || 1080}p`,
                  type: 'application/x-mpegurl',
                  name: s.server || 'AnimeSalt',
                })),
                subtitles: anData.subtitles || [],
              };
            }
          }
        } else {
          streamData = await fetchBingrStream({
            srv: currentCandidate.srv || 's70',
            type: config?.category || 'movie',
            id: config?.id,
            title: config?.title,
            year: config?.year,
            season: config?.season,
            episode: config?.episode,
            timeoutMs: 1800,
          });
        }

        if (isCancelled) return;

        const sources = streamData?.sources || [];
        const subtitles = streamData?.subtitles || [];

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
        markStreamAsReady('hls-manifest');
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
      markStreamAsReady('native-video');
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
    if (isBingrCandidate || !embedUrl) return undefined;
    let cancelled = false;

    setHealth({ status: 'checking', label: 'Connecting to provider...' });

    checkStreamProviderHealth(embedUrl, { timeoutMs: 3000 }).then(result => {
      if (cancelled) return;
      setHealth(result);
      setHealthMap(prev => new Map(prev).set(embedUrl, result));

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
  }, [embedUrl, isBingrCandidate, triggerAutoShift]);

  // Stream Readiness Auto-Failover Watchdog:
  // If a server has NOT loaded and started streaming within 7.5 seconds, auto-shift to next verified ready server!
  useEffect(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setShowSlowHint(false);

    loadTimeoutRef.current = setTimeout(() => {
      setShowSlowHint(true);
      if (!isStreamReady && autoShiftEnabledRef.current && !userOverriddenRef.current && candidatesRef.current.length > 1) {
        triggerAutoShift('stream slow to load');
      }
    }, 7500);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [embedUrl, directStreamUrl, frameKey, isStreamReady, triggerAutoShift]);

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
      return candidates.filter(c => c.tier === 'constellation' || c.isBingr || (c.isDirectHls && !c.isAnime));
    }
    if (serverTab === 'web') {
      return candidates.filter(c => (c.tier === 'primary' || c.tier === 'mirror') && !c.isHindi && !c.isAnime);
    }
    if (serverTab === 'hindi') {
      return candidates.filter(c => c.tier === 'hindi' || c.isHindi || c.id === 'bingr-bastion' || c.id === 'bingr-polaris');
    }
    if (serverTab === 'anime') {
      return candidates.filter(c => c.tier === 'anime' || c.isAnime || c.id?.includes('anime'));
    }
    if (serverTab === 'custom') {
      return candidates.filter(c => c.isCustom || c.id?.startsWith('custom-'));
    }
    return candidates;
  }, [candidates, serverTab]);

  if (!config) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#0B0F19',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          zIndex: 99999,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: '#60A5FA',
          }}
        >
          <Server size={32} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Stream Selected</h2>
        <p style={{ color: '#9CA3AF', fontSize: 14, maxWidth: 360, marginBottom: 24, lineHeight: 1.5 }}>
          Please select a movie, TV show, or anime title to launch the StreamZone video player.
        </p>
        <button
          onClick={() => navigate('/streaming')}
          style={{
            padding: '10px 24px',
            backgroundColor: '#2563EB',
            color: '#fff',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Return to Browse
        </button>
      </div>
    );
  }

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
              backgroundColor: isStreamReady ? '#10B981' : health.status === 'online' ? '#38BDF8' : health.status === 'degraded' ? '#FBBF24' : '#EF4444',
              boxShadow: isStreamReady ? '0 0 8px #10B981' : health.status === 'online' ? '0 0 6px #38BDF8' : 'none',
            }}
            title={isStreamReady ? 'Stream Ready & Loaded' : health.label || 'Checking'}
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
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setServerTab('constellation')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'constellation' ? '#38BDF8' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'constellation' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'constellation' ? '#38BDF8' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Sparkles size={12} />
                  <span>Constellation</span>
                </button>

                <button
                  onClick={() => setServerTab('web')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'web' ? '#A855F7' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'web' ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'web' ? '#A855F7' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Globe size={12} />
                  <span>Web</span>
                </button>

                <button
                  onClick={() => setServerTab('hindi')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'hindi' ? '#F97316' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'hindi' ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'hindi' ? '#FB923C' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>🇮🇳</span>
                  <span>Hindi Audio</span>
                </button>

                <button
                  onClick={() => setServerTab('anime')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'anime' ? '#EC4899' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'anime' ? 'rgba(236,72,153,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'anime' ? '#F472B6' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Zap size={12} />
                  <span>Anime</span>
                </button>

                <button
                  onClick={() => setServerTab('custom')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid ' + (serverTab === 'custom' ? '#10B981' : 'rgba(255,255,255,0.1)'),
                    background: serverTab === 'custom' ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
                    color: serverTab === 'custom' ? '#10B981' : 'rgba(255,255,255,0.7)',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Sliders size={12} />
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ color: '#71717A', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    SERVER ({displayedCandidates.length})
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerServerRace();
                    }}
                    disabled={isProbingAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: isProbingAll ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid ' + (isProbingAll ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.12)'),
                      borderRadius: 14,
                      padding: '3px 10px',
                      color: isProbingAll ? '#38BDF8' : '#D1D5DB',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: isProbingAll ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Zap size={12} className={isProbingAll ? 'animate-pulse text-cyan-400' : 'text-amber-400'} />
                    <span>{isProbingAll ? 'Testing...' : 'Test All Speeds'}</span>
                  </button>
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
                    const candHealth = healthMap.get(candidate.id) || healthMap.get(candidate.src);
                    const isOnline = candHealth?.status === 'online';
                    const isDegraded = candHealth?.status === 'degraded';
                    const isFailed = candHealth?.status === 'unreachable';
                    const pingText = candHealth?.ping ? `${candHealth.ping}ms` : candHealth?.label || null;

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

                        {/* Live Ping & Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {pingText && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 10,
                                background: isOnline ? 'rgba(16,185,129,0.15)' : isDegraded ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: isOnline ? '#34D399' : isDegraded ? '#FBBF24' : '#F87171',
                                border: '1px solid ' + (isOnline ? 'rgba(16,185,129,0.3)' : isDegraded ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'),
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {pingText}
                            </span>
                          )}
                          {isProbingAll && !candHealth && (
                            <span style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>
                              testing...
                            </span>
                          )}
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: isOnline ? '#10B981' : isDegraded ? '#F59E0B' : isFailed ? '#EF4444' : isActive ? '#38BDF8' : 'rgba(255,255,255,0.3)',
                              boxShadow: (isOnline || isActive) ? '0 0 6px ' + (isOnline ? '#10B981' : '#38BDF8') : 'none',
                            }}
                          />
                        </div>
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
      {isBingrCandidate && (directStreamUrl || isResolvingStream) ? (
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
            poster={config?.posterUrl}
            onLoadedData={() => markStreamAsReady('video-loadeddata')}
            onCanPlay={() => markStreamAsReady('video-canplay')}
            onPlaying={() => markStreamAsReady('video-playing')}
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
          title={config?.title || 'StreamZone player'}
          src={embedUrl}
          loading="eager"
          fetchPriority="high"
          onLoad={() => markStreamAsReady('iframe-onload')}
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
