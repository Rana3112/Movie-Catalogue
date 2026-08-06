import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ArrowLeft, Calendar as CalendarIcon, Film, Sparkles, Tv, User, Drama, RotateCcw } from 'lucide-react'
import MobileCategoryBarrel from '../components/mobile/MobileCategoryBarrel'
import { shouldUseCompactNativeLayout } from '../lib/platform'
import { motion } from 'framer-motion'
import './CategoryHub.css'

const isNative = shouldUseCompactNativeLayout()

export default function Category() {
  const year = useStore(state => state.selectedYear) || new Date().getFullYear()
  const setCategory = useStore(state => state.setCategory)
  const setSelectedGenres = useStore(state => state.setSelectedGenres)
  const { user, isGuest } = useStore()
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const topCardRef = useRef(null)
  const centralNodeRef = useRef(null)
  const cardRefs = useRef([])
  const cardNodeRefs = useRef([])
  const isDraggingRef = useRef(false)

  const [lines, setLines] = useState([])
  const [resetKey, setResetKey] = useState(0)

  // Calculate exact SVG connecting lines between central node & card top nodes
  const updateLines = () => {
    if (!containerRef.current || !centralNodeRef.current || cardNodeRefs.current.length < 4) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const centralNodeRect = centralNodeRef.current.getBoundingClientRect()

    // Central node center relative to SVG container
    const startX = centralNodeRect.left + centralNodeRect.width / 2 - containerRect.left
    const startY = centralNodeRect.top + centralNodeRect.height / 2 - containerRect.top

    const newLines = cardNodeRefs.current.slice(0, 4).map((nodeEl) => {
      if (!nodeEl) return null
      const nodeRect = nodeEl.getBoundingClientRect()
      
      // Card node center relative to SVG container
      const endX = nodeRect.left + nodeRect.width / 2 - containerRect.left
      const endY = nodeRect.top + nodeRect.height / 2 - containerRect.top

      // Smooth Bezier path calculation
      const deltaY = endY - startY
      const dropY = startY + Math.max(30, deltaY * 0.4)
      const pathD = `M ${startX} ${startY} L ${startX} ${dropY} C ${startX} ${dropY + (endY - dropY) * 0.6}, ${endX} ${dropY}, ${endX} ${endY}`

      return pathD
    }).filter(Boolean)

    setLines(newLines)
  }

  // Continuous 60 FPS loop so SVG connector lines dynamically follow cards during drag, resize, or zoom
  useLayoutEffect(() => {
    let animId
    const loop = () => {
      updateLines()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [year, resetKey])

  useEffect(() => {
    window.addEventListener('resize', updateLines)
    return () => window.removeEventListener('resize', updateLines)
  }, [year])

  const handleResetNodes = () => {
    setResetKey(prev => prev + 1)
  }

  const featureCards = [
    {
      id: 'MyCalendar',
      title: 'My Calendar',
      subtitle: 'Open your complete watch plan',
      icon: CalendarIcon,
      typeClass: 'hub-card-calendar',
      onClick: () => {
        if (isDraggingRef.current) return
        setCategory(null)
        setSelectedGenres([])
        navigate('/calendar')
      },
    },
    {
      id: 'Movies',
      title: 'Movies',
      subtitle: 'Feature films and cinema',
      icon: Film,
      typeClass: 'hub-card-media',
      onClick: () => {
        if (isDraggingRef.current) return
        setCategory('Movies')
        setSelectedGenres([])
        navigate('/genres')
      },
    },
    {
      id: 'Series',
      title: 'Series',
      subtitle: 'TV shows and web series',
      icon: Tv,
      typeClass: 'hub-card-media',
      onClick: () => {
        if (isDraggingRef.current) return
        setCategory('Series')
        setSelectedGenres([])
        navigate('/genres')
      },
    },
    {
      id: 'Anime',
      title: 'Anime',
      subtitle: 'Animation and Japanese titles',
      icon: Sparkles,
      typeClass: 'hub-card-media',
      onClick: () => {
        if (isDraggingRef.current) return
        setCategory('Anime')
        setSelectedGenres([])
        navigate('/genres')
      },
    },
  ]

  // Native (Capacitor Mobile App)
  if (isNative) {
    return (
      <div className="h-screen w-full relative overflow-hidden flex flex-col bg-[#050505] text-white">
        <div className="flex-shrink-0 relative z-20 px-4 pt-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold uppercase tracking-wider">Select Category</h1>
          <div className="w-10" />
        </div>
        <div className="flex-1 relative z-10 w-full mt-4">
          <MobileCategoryBarrel />
        </div>
      </div>
    )
  }

  return (
    <div className="category-hub-page" ref={containerRef}>
      {/* Background Ambient Glows & Particles */}
      <div className="hub-bg-glow" aria-hidden="true" />
      <div className="hub-floor-reflection" aria-hidden="true" />

      {/* Floating Ambient Dust */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
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
              y: [0, -100, 0],
              opacity: [0.15, 0.7, 0.15],
            }}
            transition={{
              duration: 7 + (i % 5) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* ── TOP BAR ── */}
      <header className="hub-header">
        {/* Circular Back Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/home')}
          className="hub-back-btn"
          aria-label="Back to Home"
        >
          <ArrowLeft size={22} />
        </motion.button>

        {/* Header Right Action Area: Reset Nodes + User Profile Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetNodes}
            className="hub-reset-btn"
            title="Reset dragged cards to default layout"
          >
            <RotateCcw size={15} />
            <span>Reset Nodes</span>
          </button>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="hub-user-pill cursor-pointer"
            onClick={() => (!isGuest ? navigate('/myspace') : navigate('/signup'))}
          >
            <div className="hub-user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">
              {user?.name || user?.displayName || (isGuest ? 'Guest User' : 'Utkarsh Rana')}
            </span>
          </motion.div>
        </div>
      </header>

      {/* ── CENTRAL YEAR CARD (STATIC) ── */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        ref={topCardRef}
        className="hub-central-card neon-glimpse-border"
      >
        <span className="hub-year-label">SELECTED YEAR</span>
        <h1 className="hub-year-title">{year}</h1>
        <p className="hub-year-desc">
          Choose where you want to go next. The web layout keeps the same tactile surfaces without using the narrow mobile stack.
        </p>

        {/* Glowing Central Node */}
        <div className="hub-central-node" ref={centralNodeRef} />
      </motion.div>

      {/* ── CONNECTOR LINES (SVG CANVAS LAYER) ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <filter id="neonGlowRed" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonGlowCyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {lines.map((dPath, index) => {
          const isCalendarLine = index === 0
          const strokeColor = isCalendarLine ? '#00e5ff' : '#ff2d2d'
          const filterId = isCalendarLine ? 'url(#neonGlowCyan)' : 'url(#neonGlowRed)'
          return (
            <g key={index}>
              {/* Outer Glow Path */}
              <path
                d={dPath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="4.5"
                strokeOpacity="0.5"
                filter={filterId}
              />
              {/* Core Crisp Path */}
              <path
                d={dPath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
              />
            </g>
          )
        })}
      </svg>

      {/* ── FEATURE CARDS GRID (4 MOVABLE / DRAGGABLE CARDS) ── */}
      <div className="hub-cards-container">
        {featureCards.map((card, idx) => {
          const IconComponent = card.icon
          return (
            <motion.div
              key={`${card.id}-${resetKey}`}
              ref={(el) => (cardRefs.current[idx] = el)}
              drag
              dragConstraints={containerRef}
              dragElastic={0.08}
              onDragStart={() => { isDraggingRef.current = true }}
              onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false }, 100) }}
              whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: card.id === 'MyCalendar' ? '0 0 45px rgba(0, 229, 255, 0.7)' : '0 0 45px rgba(255, 45, 45, 0.7)' }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 + idx * 0.08, ease: 'easeOut' }}
              onClick={card.onClick}
              className={`hub-feature-card ${card.typeClass} group`}
            >
              {/* Top Connection Node */}
              <div className="hub-card-node" ref={(el) => (cardNodeRefs.current[idx] = el)} />

              {/* Icon Ring */}
              <div className="hub-icon-ring mt-1">
                <IconComponent size={30} strokeWidth={2} />
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="hub-card-title">{card.title}</h3>
                <p className="hub-card-subtitle">{card.subtitle}</p>
              </div>

              {/* Floor Radial Glow */}
              <div className="hub-card-floor-glow" />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
