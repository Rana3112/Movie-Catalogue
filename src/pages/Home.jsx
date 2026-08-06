import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Calendar as CalendarIcon, Clapperboard, Clock, Film, LayoutGrid, LogOut, Play, Settings, Sparkles, Tv, User, UserPlus } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import './TimeArchive.css'

// Shared font injection (Montserrat)
if (typeof document !== 'undefined') {
  if (!document.getElementById('montserrat-font')) {
    const link = document.createElement('link')
    link.id = 'montserrat-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap'
    document.head.appendChild(link)
  }
}

// Smooth Animated Counter Component
function AnimatedCounter({ value }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value, 10) || 0
    if (start === end) {
      setDisplayValue(end)
      return undefined
    }

    const duration = 1200
    const frameRate = 30
    const totalFrames = Math.round((duration / 1000) * frameRate)
    let frame = 0

    const timer = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      const current = Math.floor(end * (1 - Math.pow(1 - progress, 3)))
      setDisplayValue(current)

      if (frame >= totalFrames) {
        setDisplayValue(end)
        clearInterval(timer)
      }
    }, 1000 / frameRate)

    return () => clearInterval(timer)
  }, [value])

  return <span>{displayValue.toLocaleString()}</span>
}

export default function Home() {
  const { user, logout, isGuest, selectedYear, setYear, calendarEntries } = useStore()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

  const currentYear = new Date().getFullYear()
  // Generate 25-year grid
  const desktopYears = useMemo(() => {
    const startYear = currentYear - 12
    return Array.from({ length: 25 }, (_, index) => startYear + index)
  }, [currentYear])

  // Compute statistics from calendar entries or fallback defaults
  const stats = useMemo(() => {
    let movies = 0
    let tv = 0
    let anime = 0
    let episodes = 0
    const datesSet = new Set()

    if (calendarEntries && typeof calendarEntries === 'object') {
      Object.entries(calendarEntries).forEach(([date, list]) => {
        if (Array.isArray(list) && list.length > 0) {
          datesSet.add(date)
          list.forEach(item => {
            const cat = (item.category || '').toLowerCase()
            if (cat.includes('anime')) {
              anime++
            } else if (cat.includes('tv') || cat.includes('show') || cat.includes('series')) {
              tv++
            } else {
              movies++
            }
            const epNum = parseInt(item.episode || item.episodes || item.count || 1, 10)
            episodes += isNaN(epNum) ? 1 : epNum
          })
        }
      })
    }

    return {
      movies: movies > 0 ? movies : 742,
      tv: tv > 0 ? tv : 91,
      anime: anime > 0 ? anime : 146,
      episodes: episodes > 0 ? episodes : 2381,
      daysWatched: datesSet.size > 0 ? datesSet.size : 148,
    }
  }, [calendarEntries])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleMySpace = () => {
    if (isGuest) {
      if (confirm("Create an account to save your personal space!")) {
        navigate('/signup')
      }
    } else {
      navigate('/myspace')
    }
  }

  const handleYearSelect = (year) => {
    setYear(year)
    navigate('/category')
  }

  return (
    <div className="time-archive-page">
      {/* ── BACKGROUND LAYERS ── */}
      <div className="time-archive-glow-1" aria-hidden="true" />
      <div className="time-archive-glow-2" aria-hidden="true" />
      <div className="time-archive-noise" aria-hidden="true" />
      <div className="time-archive-vignette" aria-hidden="true" />

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-red-500/30"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: '0 0 8px rgba(255,45,45,0.6)',
            }}
            animate={{
              y: [0, -120, 0],
              opacity: [0.1, 0.65, 0.1],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 8 + (i % 7) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* ── TOP NAVIGATION BAR ── */}
      <header className="time-archive-header">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="time-archive-nav neon-glimpse-border"
        >
          {/* User Profile Info */}
          <div className="flex items-center gap-3">
            <div className="time-archive-avatar-ring">
              <div className="time-archive-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-white/80" />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-bold tracking-wide text-white leading-tight">
                {user?.name || user?.displayName || (isGuest ? 'Guest User' : 'Utkarsh Rana')}
              </span>
              <span className="text-[10px] font-semibold tracking-[0.15em] text-[#ff2d2d] uppercase">
                {isGuest ? 'GUEST EXPLORER' : 'MOVIE ENTHUSIAST'}
              </span>
            </div>
          </div>

          {/* Nav Actions */}
          <nav className="flex items-center gap-2 md:gap-3">
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMySpace}
              className="time-archive-nav-btn myspace-highlight-btn"
            >
              <LayoutGrid size={15} className="text-[#00e5ff]" />
              <span className="hidden sm:inline">My Space</span>
            </motion.button>

            {!isGuest && (
              <motion.button
                whileHover={{ y: -2, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/75 hover:border-red-500/40 transition-colors"
                aria-label="Settings"
              >
                <Settings size={17} />
              </motion.button>
            )}

            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="time-archive-exit-btn"
            >
              {isGuest ? (
                <>
                  <UserPlus size={15} />
                  <span>Sign Up</span>
                </>
              ) : (
                <>
                  <LogOut size={15} />
                  <span>Exit</span>
                </>
              )}
            </motion.button>
          </nav>
        </motion.div>
      </header>

      {/* ── MAIN CONTENT GRID ── */}
      <main className="time-archive-main">
        {/* ── LEFT HERO PANEL (WITH GENERATED BACKGROUND IMAGE & NEON BORDER) ── */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="time-archive-hero-card neon-glimpse-border"
        >
          {/* User Generated Hero Background Image */}
          <img
            src="/time-archive-hero.png"
            alt="Time Archive Hero"
            className="time-archive-hero-img"
          />

          {/* Left Dark Gradient Overlay for Typography Readability */}
          <div className="time-archive-hero-overlay" />

          {/* Hero Typography & Primary CTA */}
          <div className="relative z-10 space-y-4 md:space-y-6">
            <div>
              <span className="text-[11px] font-extrabold tracking-[0.24em] text-[#ff2d2d] uppercase block mb-3">
                EVERY STORY. EVERY MOMENT.
              </span>
              <h1 className="font-black uppercase tracking-wider leading-none select-none">
                <span className="block text-5xl md:text-7xl font-black text-white drop-shadow-md">
                  TIME
                </span>
                <span className="block text-5xl md:text-7xl font-black time-archive-red-gradient-text">
                  ARCHIVE
                </span>
              </h1>
            </div>

            <p className="text-sm md:text-base leading-relaxed text-white/70 max-w-md font-normal">
              Your personal cinematic universe. Relive every movie, episode, and anime you've ever watched. All in one place.
            </p>

            {/* Primary Action CTA Button */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/streaming')}
                className="time-archive-cta-btn group"
              >
                <Play size={18} fill="#ffffff" className="transition-transform group-hover:scale-110" />
                <span>Enter StreamZone</span>
                <div
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                  }}
                />
              </button>
            </div>
          </div>

          {/* Hero Bottom: Statistics Bar with Animated Counters */}
          <div className="time-archive-stats-row">
            <div className="time-archive-stats-container">
              {/* Movies */}
              <div className="time-archive-stat-card">
                <Film size={16} className="text-[#ff2d2d] mb-1.5" />
                <span className="text-sm md:text-lg font-black text-white leading-none">
                  <AnimatedCounter value={stats.movies} />
                </span>
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase mt-1">
                  MOVIES
                </span>
              </div>

              {/* TV Shows */}
              <div className="time-archive-stat-card">
                <Tv size={16} className="text-[#ff2d2d] mb-1.5" />
                <span className="text-sm md:text-lg font-black text-white leading-none">
                  <AnimatedCounter value={stats.tv} />
                </span>
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase mt-1">
                  TV SHOWS
                </span>
              </div>

              {/* Anime */}
              <div className="time-archive-stat-card">
                <Sparkles size={16} className="text-[#ff2d2d] mb-1.5" />
                <span className="text-sm md:text-lg font-black text-white leading-none">
                  <AnimatedCounter value={stats.anime} />
                </span>
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase mt-1">
                  ANIME
                </span>
              </div>

              {/* Episodes */}
              <div className="time-archive-stat-card">
                <Clapperboard size={16} className="text-[#ff2d2d] mb-1.5" />
                <span className="text-sm md:text-lg font-black text-white leading-none">
                  <AnimatedCounter value={stats.episodes} />
                </span>
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase mt-1">
                  EPISODES
                </span>
              </div>

              {/* Days Watched */}
              <div className="time-archive-stat-card">
                <Clock size={16} className="text-[#ff2d2d] mb-1.5" />
                <span className="text-sm md:text-lg font-black text-white leading-none">
                  <AnimatedCounter value={stats.daysWatched} />
                </span>
                <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase mt-1">
                  DAYS WATCHED
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL (SELECT YEAR & TIMELINE) ── */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="time-archive-right-card neon-glimpse-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-extrabold tracking-[0.22em] text-[#ff2d2d] uppercase block mb-1">
                TIME ARCHIVE
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-wider text-white uppercase">
                SELECT YEAR
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, border: '1px solid rgba(255,45,45,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-[#ff2d2d] shadow-lg cursor-pointer"
              aria-label="Time Settings"
            >
              <CalendarIcon size={20} />
            </motion.button>
          </div>

          {/* 5x5 Year Selection Grid */}
          <div className="time-archive-year-grid">
            {desktopYears.map((year) => {
              const isSelected = year === selectedYear
              return (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`time-archive-year-tile ${isSelected ? 'time-archive-year-tile-selected' : ''}`}
                >
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-[18px] border border-[#ff2d2d]"
                      animate={{ scale: [1, 1.08, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <span>{year}</span>
                </button>
              )
            })}
          </div>

          {/* Bottom Timeline Control */}
          <div className="mt-8 pt-4 relative">
            <div className="flex items-center gap-3">
              <Film size={20} className="text-white/40 flex-shrink-0" />

              <div className="time-archive-timeline-track">
                <div className="time-archive-timeline-line" />

                {desktopYears.filter((_, idx) => idx % 4 === 0 || desktopYears[idx] === selectedYear).map((yr) => {
                  const isNodeSelected = yr === selectedYear
                  return (
                    <div key={yr} className="relative z-10 flex flex-col items-center">
                      <motion.div
                        whileHover={{ scale: 1.3 }}
                        onClick={() => handleYearSelect(yr)}
                        className="cursor-pointer rounded-full transition-all"
                        style={{
                          width: isNodeSelected ? '14px' : '8px',
                          height: isNodeSelected ? '14px' : '8px',
                          backgroundColor: isNodeSelected ? '#ff2d2d' : 'rgba(255, 255, 255, 0.3)',
                          boxShadow: isNodeSelected ? '0 0 16px #ff2d2d' : 'none',
                          border: isNodeSelected ? '2px solid #ffffff' : 'none',
                        }}
                      />
                      {isNodeSelected && (
                        <motion.span
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-6 text-[9px] font-black tracking-[0.18em] text-[#ff2d2d] uppercase whitespace-nowrap"
                        >
                          YOU ARE HERE
                        </motion.span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── FOOTER QUOTE ── */}
      <footer className="time-archive-footer">
        <p className="text-xs md:text-sm font-semibold tracking-[0.2em] text-white/45 uppercase">
          <span className="text-[#ff2d2d] mr-2">“</span>
          CINEMA IS TIME TRAVEL YOU CAN FEEL.
          <span className="text-[#ff2d2d] ml-2">”</span>
        </p>
      </footer>

      {/* Time Settings Modal */}
      {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
