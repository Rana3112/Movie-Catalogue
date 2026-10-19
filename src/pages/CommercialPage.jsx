import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Share2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  Film,
  Zap,
  Shield,
  Layers,
  Bot,
  Copy,
  Check,
  Tv,
  Globe,
  Radio,
  ExternalLink
} from 'lucide-react'
import './CommercialPage.css'

const CHAPTERS = [
  { id: 1, time: 0, title: 'The Problem', subtitle: 'Streaming Chaos & Hidden Costs', icon: Film },
  { id: 2, time: 9.8, title: 'The Reveal', subtitle: 'Enter CinePulse Powerhouse', icon: Sparkles },
  { id: 3, time: 19.6, title: 'Universal Catalog', subtitle: 'Movies, Series, Anime, Sports', icon: Globe },
  { id: 4, time: 29.4, title: 'Constellation Engine', subtitle: '<10s Auto-Failover Benchmarking', icon: Zap },
  { id: 5, time: 39.2, title: '1-Click .MKV Downloads', subtitle: '16x Multi-Thread Range Acceleration', icon: Download },
  { id: 6, time: 49.0, title: 'Hindi Hubs & CineBot AI', subtitle: 'Zero Popups + AI Concierge', icon: Bot },
  { id: 7, time: 58.8, title: 'The Future of Streaming', subtitle: 'Experience CinePulse Today', icon: Radio },
]

const COMPARISON = [
  {
    feature: 'Universal Catalog (Movies, TV, Anime, Sports)',
    cinepulse: true,
    netflix: 'Movies & TV Only (Fragmented)',
    stremio: 'Requires complex add-on setup',
    piracy: 'Popups, broken links, unsafe',
  },
  {
    feature: 'Constellation Server Failover (<10s auto-switch)',
    cinepulse: true,
    netflix: false,
    stremio: 'Manual stream hopping',
    piracy: 'Dead links, frequent 404s',
  },
  {
    feature: 'Universal 1-Click .MKV Downloads',
    cinepulse: true,
    netflix: 'DRM-locked app only',
    stremio: 'Torrent / Debrid dependent',
    piracy: 'Deceptive fake download buttons',
  },
  {
    feature: 'Multi-Thread Range Download Acceleration',
    cinepulse: true,
    netflix: false,
    stremio: false,
    piracy: 'Throttled 200KB/s speeds',
  },
  {
    feature: 'Dedicated Hindi Dub & Regional Hubs',
    cinepulse: true,
    netflix: 'Limited regional catalog',
    stremio: 'Rarely organized by language',
    piracy: 'Ad-infested cam-rips',
  },
  {
    feature: 'Built-in CineBot AI Movie Concierge',
    cinepulse: true,
    netflix: 'Generic recommendation algorithm',
    stremio: false,
    piracy: false,
  },
  {
    feature: 'Zero Intrusive Popups or Malware Redirects',
    cinepulse: true,
    netflix: true,
    stremio: true,
    piracy: false,
  },
]

export default function CommercialPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)

  const [quality, setQuality] = useState('1080p')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(69.48)
  const [activeChapter, setActiveChapter] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview | comparison | storyboard | prompts

  const videoSource = quality === '1080p'
    ? '/commercial/cinepulse_ad_1080p.mp4'
    : '/commercial/cinepulse_ad_720p.mp4'

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      // Determine active chapter
      let currentIdx = 0
      for (let i = CHAPTERS.length - 1; i >= 0; i--) {
        if (video.currentTime >= CHAPTERS[i].time - 0.5) {
          currentIdx = i
          break
        }
      }
      setActiveChapter(currentIdx)
    }

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [quality])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  const jumpToChapter = (time) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    videoRef.current.play()
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen()
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/commercial`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="commercial-page">
      {/* Background Glow */}
      <div className="commercial-ambient-glow glow-red" />
      <div className="commercial-ambient-glow glow-blue" />

      {/* Top Header */}
      <header className="commercial-header">
        <button
          onClick={() => navigate(-1)}
          className="commercial-back-btn"
          title="Back to Previous Page"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="commercial-brand">
          <span className="brand-dot" />
          <span className="brand-title">CINEPULSE</span>
          <span className="brand-pill">OFFICIAL COMMERCIAL</span>
        </div>

        <div className="commercial-header-actions">
          <button
            onClick={() => navigate('/streaming')}
            className="commercial-launch-btn"
          >
            <Sparkles size={16} />
            <span>Open StreamZone</span>
          </button>
        </div>
      </header>

      {/* Main Theater Showcase */}
      <main className="commercial-container">
        <div className="commercial-hero-banner">
          <div className="hero-tag">
            <Sparkles size={14} />
            <span>GLOBAL PRODUCT SHOWCASE</span>
          </div>
          <h1 className="hero-title">
            The Next Generation of <span className="text-gradient">Cinematic Streaming</span>
          </h1>
          <p className="hero-subtitle">
            Universal Streaming · Constellation Server Network · Universal 1-Click .MKV Downloads · Zero Popups
          </p>
        </div>

        {/* Video Theater Box */}
        <div className="commercial-theater">
          <div className="theater-screen-wrapper">
            <video
              ref={videoRef}
              src={videoSource}
              className="theater-video"
              playsInline
              preload="metadata"
              poster="/commercial/assets/movies_ui.png"
              onClick={togglePlay}
            />

            {/* Play Overlay Button if paused */}
            {!isPlaying && (
              <button
                className="theater-overlay-play"
                onClick={togglePlay}
                aria-label="Play Video"
              >
                <div className="play-pulse-ring" />
                <Play size={36} fill="white" className="ml-1" />
              </button>
            )}

            {/* Active Chapter Watermark */}
            <div className="theater-chapter-pill">
              <span className="chapter-indicator-dot" />
              <span>Chapter {activeChapter + 1}: {CHAPTERS[activeChapter].title}</span>
            </div>
          </div>

          {/* Video Control Bar */}
          <div className="theater-controls">
            <div className="controls-left">
              <button onClick={togglePlay} className="ctrl-btn" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button onClick={toggleMute} className="ctrl-btn" title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span className="time-divider">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Timeline Bar */}
            <div
              className="timeline-track"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const clickPos = (e.clientX - rect.left) / rect.width
                if (videoRef.current) {
                  videoRef.current.currentTime = clickPos * duration
                }
              }}
            >
              <div
                className="timeline-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {CHAPTERS.map((ch) => (
                <div
                  key={ch.id}
                  className="timeline-marker"
                  style={{ left: `${(ch.time / duration) * 100}%` }}
                  title={`${ch.title} (${formatTime(ch.time)})`}
                />
              ))}
            </div>

            <div className="controls-right">
              {/* Quality Switcher */}
              <div className="quality-pills">
                <button
                  className={`quality-btn ${quality === '1080p' ? 'active' : ''}`}
                  onClick={() => setQuality('1080p')}
                >
                  1080p HD
                </button>
                <button
                  className={`quality-btn ${quality === '720p' ? 'active' : ''}`}
                  onClick={() => setQuality('720p')}
                >
                  720p
                </button>
              </div>

              <button onClick={handleFullscreen} className="ctrl-btn" title="Fullscreen">
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          {/* Action Row Under Video */}
          <div className="theater-action-bar">
            <div className="download-group">
              <a
                href="/commercial/cinepulse_ad_1080p.mp4"
                download="CinePulse_Official_Advertisement_1080p.mp4"
                className="action-btn download-primary"
              >
                <Download size={16} />
                <span>Download 1080p Master (9.7 MB)</span>
              </a>

              <a
                href="/commercial/cinepulse_ad_720p.mp4"
                download="CinePulse_Advertisement_720p.mp4"
                className="action-btn download-secondary"
              >
                <Download size={16} />
                <span>Download 720p Mobile (6.1 MB)</span>
              </a>
            </div>

            <div className="share-group">
              <button onClick={handleCopyLink} className="action-btn share-btn">
                {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Chapters Carousel */}
        <section className="commercial-section">
          <div className="section-header">
            <h2>Interactive Scene Breakdown</h2>
            <p>Click any scene to jump to that moment in the video</p>
          </div>

          <div className="chapters-grid">
            {CHAPTERS.map((ch, idx) => {
              const Icon = ch.icon
              const isActive = activeChapter === idx
              return (
                <div
                  key={ch.id}
                  onClick={() => jumpToChapter(ch.time)}
                  className={`chapter-card ${isActive ? 'is-active' : ''}`}
                >
                  <div className="chapter-card-top">
                    <span className="chapter-badge">0{idx + 1}</span>
                    <span className="chapter-time">{formatTime(ch.time)}</span>
                  </div>
                  <div className="chapter-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <h3 className="chapter-title">{ch.title}</h3>
                  <p className="chapter-sub">{ch.subtitle}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Navigation Tabs for Deep Dive Information */}
        <div className="info-tabs-nav">
          <button
            className={`info-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Sparkles size={16} />
            <span>Core Innovations</span>
          </button>
          <button
            className={`info-tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            <Layers size={16} />
            <span>Competitive Matrix</span>
          </button>
          <button
            className={`info-tab-btn ${activeTab === 'storyboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('storyboard')}
          >
            <Film size={16} />
            <span>Director's Script</span>
          </button>
          <button
            className={`info-tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompts')}
          >
            <Zap size={16} />
            <span>AI Video Prompt Kit</span>
          </button>
        </div>

        {/* TAB 1: Core Innovations */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon bg-red-gradient">
                  <Globe size={24} />
                </div>
                <h3>Universal Unified Catalog</h3>
                <p>
                  No more juggling 5 subscriptions. Access Hollywood blockbusters, Netflix originals, HBO classics, anime with Japanese subs & Hindi dubs, and live sports in one seamless dashboard.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-cyan-gradient">
                  <Zap size={24} />
                </div>
                <h3>Constellation Failover Network</h3>
                <p>
                  Never see a dead link again. CinePulse benchmarks multiple high-speed global CDN providers in real-time. If a stream buffers or stalls, our intelligent auto-failover switches sources in under 10 seconds.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-purple-gradient">
                  <Download size={24} />
                </div>
                <h3>Universal 1-Click .MKV Downloads</h3>
                <p>
                  Save high-definition 1080p media directly to your local storage. Equipped with 16-connection multi-threaded HTTP Range acceleration for instant downloads at maximum ISP wire speed.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-emerald-gradient">
                  <Bot size={24} />
                </div>
                <h3>CineBot AI Concierge</h3>
                <p>
                  Powered by advanced language models. Ask CineBot for mood recommendations, plot deep-dives, trivia, release schedules, or direct stream links right inside the player.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-amber-gradient">
                  <Shield size={24} />
                </div>
                <h3>Zero Popups or Malicious Redirects</h3>
                <p>
                  Unlike messy streaming websites filled with intrusive malware popups and redirects, CinePulse provides a clean, sandboxed, distraction-free theatre environment.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-pink-gradient">
                  <Tv size={24} />
                </div>
                <h3>Web + Native Android Sync</h3>
                <p>
                  Built with React and Capacitor. Stream seamlessly on your desktop browser or take your library on the go with full Android mobile and tablet APK support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Competitive Comparison */}
        {activeTab === 'comparison' && (
          <div className="tab-pane">
            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature & Capability</th>
                    <th className="highlight-column">
                      <span className="brand-dot" /> CinePulse / StreamZone
                    </th>
                    <th>Netflix / Prime / Disney+</th>
                    <th>Stremio</th>
                    <th>Standard Free Streaming Sites</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, idx) => (
                    <tr key={idx}>
                      <td className="feature-name">{row.feature}</td>
                      <td className="highlight-column">
                        <div className="check-cell text-emerald-400">
                          <CheckCircle2 size={18} />
                          <span>Included</span>
                        </div>
                      </td>
                      <td>
                        {row.netflix === false ? (
                          <div className="cross-cell text-red-400"><XCircle size={16} /> <span>No</span></div>
                        ) : row.netflix === true ? (
                          <div className="check-cell text-white/80"><CheckCircle2 size={16} /> <span>Yes</span></div>
                        ) : (
                          <span className="text-white/60 text-xs">{row.netflix}</span>
                        )}
                      </td>
                      <td>
                        {row.stremio === false ? (
                          <div className="cross-cell text-red-400"><XCircle size={16} /> <span>No</span></div>
                        ) : row.stremio === true ? (
                          <div className="check-cell text-white/80"><CheckCircle2 size={16} /> <span>Yes</span></div>
                        ) : (
                          <span className="text-white/60 text-xs">{row.stremio}</span>
                        )}
                      </td>
                      <td>
                        {row.piracy === false ? (
                          <div className="cross-cell text-red-400"><XCircle size={16} /> <span>No</span></div>
                        ) : row.piracy === true ? (
                          <div className="check-cell text-white/80"><CheckCircle2 size={16} /> <span>Yes</span></div>
                        ) : (
                          <span className="text-white/60 text-xs">{row.piracy}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Storyboard & Script */}
        {activeTab === 'storyboard' && (
          <div className="tab-pane">
            <div className="storyboard-list">
              <div className="script-card">
                <div className="script-header">
                  <span className="scene-num">SCENE 1 (00:00 - 00:09)</span>
                  <span className="scene-name">The Streaming Dilemma</span>
                </div>
                <div className="script-body">
                  <p className="voiceover-text">
                    "Tired of streaming chaos? Fragmented subscriptions, buffering wheels, and broken links getting in the way of your favorite movies?"
                  </p>
                  <p className="visual-cue">
                    <strong>Visual:</strong> Cinematic dark intro, glitching subscription icons, dramatic typography highlighting frustration and buffering.
                  </p>
                </div>
              </div>

              <div className="script-card">
                <div className="script-header">
                  <span className="scene-num">SCENE 2 (00:10 - 00:19)</span>
                  <span className="scene-name">The Reveal</span>
                </div>
                <div className="script-body">
                  <p className="voiceover-text">
                    "Meet CinePulse. The next-generation cinematic streaming powerhouse built for true film enthusiasts and sports lovers."
                  </p>
                  <p className="visual-cue">
                    <strong>Visual:</strong> CinePulse glowing logo reveal with neon red and cyan light rays, sleek glassmorphic UI showcase.
                  </p>
                </div>
              </div>

              <div className="script-card">
                <div className="script-header">
                  <span className="scene-num">SCENE 3 (00:20 - 00:29)</span>
                  <span className="scene-name">The Universal Catalog</span>
                </div>
                <div className="script-body">
                  <p className="voiceover-text">
                    "One unified catalogue. Hollywood blockbusters, trending TV series, anime in Japanese and Hindi dubs, plus live global sports like IPL, UEFA, and NBA."
                  </p>
                  <p className="visual-cue">
                    <strong>Visual:</strong> 3D perspective display of Movies, Anime, TV Shows, and Live Sports streaming interfaces.
                  </p>
                </div>
              </div>

              <div className="script-card">
                <div className="script-header">
                  <span className="scene-num">SCENE 4 (00:30 - 00:39)</span>
                  <span className="scene-name">Constellation Engine</span>
                </div>
                <div className="script-body">
                  <p className="voiceover-text">
                    "Powered by our Constellation Server Network. Real-time parallel benchmarking automatically switches to the fastest server in under ten seconds if a stream buffers."
                  </p>
                  <p className="visual-cue">
                    <strong>Visual:</strong> Constellation Server Matrix UI showing low-latency server benchmarks and failover status.
                  </p>
                </div>
              </div>

              <div className="script-card">
                <div className="script-header">
                  <span className="scene-num">SCENE 5 (00:40 - 00:49)</span>
                  <span className="scene-name">Universal 1-Click .MKV Downloads</span>
                </div>
                <div className="script-body">
                  <p className="voiceover-text">
                    "Download any movie or episode with a single click. High-speed multi-threaded acceleration delivers crystal-clear full HD in high quality MKV format for offline viewing."
                  </p>
                  <p className="visual-cue">
                    <strong>Visual:</strong> 1-Click download interface with 1080p MKV badge, 16-connection acceleration graphic.
                  </p>
                </div>
              </div>

              <div className="script-card">
                <div className="script-header">
                  <span className="scene-num">SCENE 6 (00:50 - 00:58)</span>
                  <span className="scene-name">Regional Hubs & CineBot AI</span>
                </div>
                <div className="script-body">
                  <p className="voiceover-text">
                    "Zero popups. Zero malware redirects. Dedicated Hindi audio hubs, and CineBot AI, your personal intelligent movie concierge."
                  </p>
                  <p className="visual-cue">
                    <strong>Visual:</strong> Regional languages hub, Hindi streamers, and interactive CineBot AI concierge assistant chat.
                  </p>
                </div>
              </div>

              <div className="script-card">
                <div className="script-header">
                  <span className="scene-num">SCENE 7 (00:59 - 01:09)</span>
                  <span className="scene-name">Call to Action</span>
                </div>
                <div className="script-body">
                  <p className="voiceover-text">
                    "Stream smarter. Download faster. Experience CinePulse today on web and Android. Your cinematic universe awaits."
                  </p>
                  <p className="visual-cue">
                    <strong>Visual:</strong> CinePulse wordmark with "Available on Web & Android", vibrant neon CTA button.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Generative AI Video Prompt Kit */}
        {activeTab === 'prompts' && (
          <div className="tab-pane">
            <div className="prompt-kit-intro">
              <Sparkles size={20} className="text-cyan-400" />
              <div>
                <h4>CinePulse Cinema Prompt Kit for AI Video Models</h4>
                <p>
                  Use these exact director prompts in tools like <strong>Runway Gen-3 Alpha</strong>, <strong>OpenAI Sora</strong>, <strong>Kling AI</strong>, <strong>Luma Dream Machine</strong>, or <strong>Google Veo</strong> to generate ultra-realistic cinematic footage.
                </p>
              </div>
            </div>

            <div className="prompts-grid">
              <div className="prompt-card">
                <div className="prompt-header">
                  <span className="prompt-tag">SCENE 1 · B-ROLL</span>
                  <h5>Frustrated Viewer in Modern Cyberpunk Apartment</h5>
                </div>
                <pre className="prompt-code">
{`Cinematic close-up of a modern home theater in a moody dark living room. Neon city reflections on window. A person holding a sleek remote looking frustrated as a circular glowing buffering icon spins on an ultra-wide OLED screen. 35mm film grain, anamorphic lens flare, photorealistic, 8k resolution, cinematic lighting, shallow depth of field --ar 16:9 --style raw`}
                </pre>
              </div>

              <div className="prompt-card">
                <div className="prompt-header">
                  <span className="prompt-tag">SCENE 2 · LOGO REVEAL</span>
                  <h5>Holographic Quantum Film Core</h5>
                </div>
                <pre className="prompt-code">
{`A glowing hyper-futuristic glass emblem shaped like a film reel and neon play button floating in zero-gravity. Beams of crimson red and cybernetic cyan light illuminate metallic particles. Camera smoothly dollies forward in high-speed motion blur. IMAX 70mm style, dramatic contrast, unreal engine 5 render, cinematic masterwork --ar 16:9`}
                </pre>
              </div>

              <div className="prompt-card">
                <div className="prompt-header">
                  <span className="prompt-tag">SCENE 4 · SERVER NETWORK</span>
                  <h5>Constellation Data Highways & Fiber Optics</h5>
                </div>
                <pre className="prompt-code">
{`Overhead camera gliding over a high-tech quantum server farm at night. Millions of fiber optic light pulses traveling through glass cables connecting global nodes. A glowing digital constellation map forming overhead with green server latency indicators showing instant connection. Hyper-detailed, Blade Runner 2049 aesthetic --ar 16:9`}
                </pre>
              </div>

              <div className="prompt-card">
                <div className="prompt-header">
                  <span className="prompt-tag">SCENE 5 · 1-CLICK DOWNLOAD</span>
                  <h5>Lightning-Speed Data Ingestion</h5>
                </div>
                <pre className="prompt-code">
{`Macro shot of a glowing futuristic storage crystal absorbing radiant cyan light streams representing ultra-fast gigabit video download packets. A sleek transparent UI counter rapidly filling from 0 to 100% in pure crystal-clear clarity. Sci-fi high tech, Octane Render, 4k 60fps --ar 16:9`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Banner */}
      <footer className="commercial-footer">
        <div className="footer-content">
          <div>
            <h3>Ready to Experience CinePulse?</h3>
            <p>Stream your favorite movies, anime, and live sports with zero interruptions.</p>
          </div>
          <div className="footer-btns">
            <button
              onClick={() => navigate('/streaming')}
              className="footer-primary-btn"
            >
              <Play size={16} fill="currentColor" />
              <span>Launch StreamZone</span>
            </button>
            <button
              onClick={() => navigate('/home')}
              className="footer-ghost-btn"
            >
              <span>Back to Catalogue</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
