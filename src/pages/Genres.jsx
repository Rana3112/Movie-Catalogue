import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, Trash2, User, Plus, X, Zap, Heart, Rocket, Eye, Sparkles, Flame, Theater, Ghost, RotateCcw } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import { shouldUseCompactNativeLayout } from '../lib/platform'
import { netflixNeumorphic, nativeFastRaisedStyle, nativeFastInsetStyle, nativeFastRedButtonStyle } from '../styles/netflixNeumorphic'
import './GenresHub.css'

const isNative = shouldUseCompactNativeLayout()

const DEFAULT_GENRES = [
  { id: 'Action', label: 'Action', desc: 'High energy and physical stunts', icon: Zap },
  { id: 'Drama', label: 'Drama', desc: 'Character-driven stories', icon: Theater },
  { id: 'Comedy', label: 'Comedy', desc: 'Humor and amusement', icon: Flame },
  { id: 'Horror', label: 'Horror', desc: 'Fear and suspense', icon: Ghost },
  { id: 'Romance', label: 'Romance', desc: 'Love and relationships', icon: Heart },
  { id: 'Sci-Fi', label: 'Sci-Fi', desc: 'Futuristic and science-based', icon: Rocket },
  { id: 'Fantasy', label: 'Fantasy', desc: 'Magic and supernatural', icon: Sparkles },
  { id: 'Thriller', label: 'Thriller', desc: 'Excitement and suspense', icon: Eye },
]

export default function Genres() {
  const {
    selectedYear,
    selectedCategory,
    selectedGenres,
    toggleGenre,
    customGenres,
    fetchCustomGenres,
    addCustomGenre,
    deleteCustomGenre,
    user,
    isGuest,
  } = useStore()

  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customGenreName, setCustomGenreName] = useState('')
  const [resetKey, setResetKey] = useState(0)

  const containerRef = useRef(null)
  const centralNodeRef = useRef(null)
  const cardNodeRefs = useRef([])
  const isDraggingRef = useRef(false)

  const [lines, setLines] = useState([])

  useEffect(() => {
    fetchCustomGenres()
  }, [fetchCustomGenres])

  const categoryCustomGenres = customGenres.filter(
    g => g.category === selectedCategory || (!g.category && selectedCategory === 'Movies')
  )

  const allGenres = [...DEFAULT_GENRES, ...categoryCustomGenres]
  const totalItemsCount = allGenres.length // strictly genre cards in grid

  // Dynamic layout calculations based on node count
  const layoutMetrics = useMemo(() => {
    if (totalItemsCount <= 8) {
      return { cols: 4, gap: '1.25rem', height: '165px', ring: '44px', title: '16px', desc: '11px', padding: '1.25rem 1rem' }
    } else if (totalItemsCount <= 12) {
      return { cols: 4, gap: '1rem', height: '145px', ring: '38px', title: '15px', desc: '10.5px', padding: '1rem 0.85rem' }
    } else if (totalItemsCount <= 16) {
      return { cols: 6, gap: '0.85rem', height: '130px', ring: '34px', title: '14px', desc: '10px', padding: '0.85rem 0.75rem' }
    } else {
      return { cols: 6, gap: '0.75rem', height: '118px', ring: '30px', title: '13px', desc: '9.5px', padding: '0.75rem 0.65rem' }
    }
  }, [totalItemsCount])

  // Calculate dynamic SVG connecting lines between central top node & each bottom genre card node
  const updateLines = () => {
    if (!containerRef.current || !centralNodeRef.current || cardNodeRefs.current.length === 0) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const centralNodeRect = centralNodeRef.current.getBoundingClientRect()

    const startX = centralNodeRect.left + centralNodeRect.width / 2 - containerRect.left
    const startY = centralNodeRect.top + centralNodeRect.height / 2 - containerRect.top

    const newLines = cardNodeRefs.current.map((nodeEl) => {
      if (!nodeEl) return null
      const nodeRect = nodeEl.getBoundingClientRect()

      const endX = nodeRect.left + nodeRect.width / 2 - containerRect.left
      const endY = nodeRect.top + nodeRect.height / 2 - containerRect.top

      // Drop straight down then curve smoothly to each child node
      const deltaY = endY - startY
      const dropY = startY + Math.min(45, deltaY * 0.45)
      const pathD = `M ${startX} ${startY} L ${startX} ${dropY} C ${startX} ${dropY + (endY - dropY) * 0.5}, ${endX} ${dropY + 10}, ${endX} ${endY}`

      return pathD
    }).filter(Boolean)

    setLines(newLines)
  }

  // 60 FPS animation frame loop to keep SVG strings locked to card nodes during drag, zoom, or adding custom genres
  useLayoutEffect(() => {
    let animId
    const loop = () => {
      updateLines()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [allGenres.length, selectedCategory, selectedYear, resetKey])

  useEffect(() => {
    window.addEventListener('resize', updateLines)
    return () => window.removeEventListener('resize', updateLines)
  }, [allGenres.length])

  const handleAddCustom = () => {
    if (!customGenreName.trim()) return
    const newId = customGenreName.toLowerCase().replace(/\s+/g, '-')
    if (allGenres.some(g => g.id === newId)) {
      alert('Genre already exists!')
      return
    }
    addCustomGenre({ id: newId, label: customGenreName, desc: 'Custom User Genre', icon: 'Sparkles' })
    setCustomGenreName('')
    setShowCustomModal(false)
  }

  const handleDeleteCustom = (e, id) => {
    e.stopPropagation()
    if (confirm('Delete this custom genre?')) {
      deleteCustomGenre(id)
      cardNodeRefs.current = cardNodeRefs.current.filter(Boolean)
    }
  }

  const handleResetNodes = () => {
    setResetKey(prev => prev + 1)
  }

  // Native (Capacitor Mobile App)
  if (isNative) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-[#050505] text-white">
        <div className="flex-shrink-0 relative z-20 px-4 pt-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/category')}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold uppercase tracking-wider">Select Genre</h1>
          <div className="w-10" />
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
          {allGenres.map((g) => {
            const isSelected = selectedGenres.includes(g.id)
            return (
              <button
                key={g.id}
                onClick={() => toggleGenre(g.id)}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center border ${
                  isSelected ? 'border-red-500 bg-red-500/20' : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="font-bold text-sm text-white">{g.label}</span>
                <span className="text-xs text-white/60 mt-1">{g.desc || 'Genre'}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      className="genres-hub-page"
      ref={containerRef}
      style={{
        '--grid-cols': layoutMetrics.cols,
        '--grid-gap': layoutMetrics.gap,
        '--card-height': layoutMetrics.height,
        '--icon-ring-size': layoutMetrics.ring,
        '--title-font-size': layoutMetrics.title,
        '--desc-font-size': layoutMetrics.desc,
        '--card-padding': layoutMetrics.padding,
      }}
    >
      {/* Background Atmosphere */}
      <div className="genres-bg-glow" aria-hidden="true" />
      <div className="genres-floor-reflection" aria-hidden="true" />

      {/* Floating Ambient Dust */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {[...Array(14)].map((_, i) => (
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
      <header className="genres-header">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/category')}
          className="genres-back-btn"
          aria-label="Back to Category"
        >
          <ArrowLeft size={22} />
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="genres-user-pill cursor-pointer"
          onClick={() => (!isGuest ? navigate('/myspace') : navigate('/signup'))}
        >
          <div className="genres-user-avatar">
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
      </header>

      {/* ── CENTRAL TOP CARD (STATIC TREE ROOT) ── */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="genres-central-card neon-glimpse-border"
      >
        <span className="genres-category-label">{selectedCategory || 'ALL MEDIA'}</span>
        <h1 className="genres-year-title">{selectedYear}</h1>
        <p className="genres-desc-text">
          Pick one or more genres. The grid is sized for desktop scanning instead of mobile tapping.
        </p>

        <button
          onClick={() => navigate('/calendar')}
          disabled={selectedGenres.length === 0}
          className="genres-continue-btn"
        >
          CONTINUE ({selectedGenres.length})
        </button>

        {/* Central Bottom Connecting Node */}
        <div className="genres-central-node" ref={centralNodeRef} />
      </motion.div>

      {/* ── SVG CONNECTOR STRINGS LAYER ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <filter id="neonGlowRedGenres" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {lines.map((dPath, index) => (
          <g key={index}>
            {/* Outer Glow Path */}
            <path
              d={dPath}
              fill="none"
              stroke="#ff2d2d"
              strokeWidth="4"
              strokeOpacity="0.45"
              filter="url(#neonGlowRedGenres)"
            />
            {/* Core Crisp Path */}
            <path
              d={dPath}
              fill="none"
              stroke="#FF2D2D"
              strokeWidth="2.4"
            />
          </g>
        ))}
      </svg>

      {/* ── BOTTOM ADAPTIVE GENRE CARDS GRID (DRAGGABLE CHILD NODES) ── */}
      <div className="genres-grid-container">
        {allGenres.map((g, idx) => {
          const isSelected = selectedGenres.includes(g.id)
          const isCustom = !DEFAULT_GENRES.some(dg => dg.id === g.id)
          const IconComp = g.icon || Sparkles

          return (
            <motion.div
              key={`${g.id}-${resetKey}`}
              drag
              dragConstraints={containerRef}
              dragElastic={0.08}
              onDragStart={() => { isDraggingRef.current = true }}
              onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false }, 100) }}
              whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: '0 0 40px rgba(255, 45, 45, 0.7)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.03 }}
              onClick={() => {
                if (!isDraggingRef.current) {
                  toggleGenre(g.id)
                }
              }}
              className={`genre-card-item ${isSelected ? 'genre-card-selected' : ''}`}
            >
              {/* Node for SVG String connection */}
              <div className="genre-card-node" ref={(el) => (cardNodeRefs.current[idx] = el)} />

              {/* Top Action / Indicator */}
              <div className="flex items-center justify-between w-full">
                <div className="genre-icon-ring">
                  {typeof IconComp === 'function' || typeof IconComp === 'object' ? (
                    <IconComp size={20} strokeWidth={2} />
                  ) : (
                    <Sparkles size={20} />
                  )}
                </div>
                {isCustom ? (
                  <button
                    onClick={(e) => handleDeleteCustom(e, g.id)}
                    className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete Custom Genre Node"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : isSelected ? (
                  <CheckCircle size={19} className="text-red-500" />
                ) : null}
              </div>

              {/* Text Content */}
              <div>
                <h3 className="genre-card-title">{g.label}</h3>
                <p className="genre-card-desc">{g.desc || 'Custom User Genre'}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── BOTTOM ACTION CONTROLS BAR (ADD GENRE & RESET NODES) ── */}
      <div className="genres-bottom-bar">
        <button
          onClick={() => setShowCustomModal(true)}
          className="genres-action-btn"
          title="Add a new custom genre node to the tree"
        >
          <Plus size={16} />
          <span>+ Add Genre</span>
        </button>

        <button
          onClick={handleResetNodes}
          className="genres-action-btn"
          title="Reset dragged cards to default tree layout"
        >
          <RotateCcw size={15} />
          <span>Reset Nodes</span>
        </button>
      </div>

      {/* ── CUSTOM GENRE MODAL ── */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-[92%] max-w-[460px] rounded-[28px] p-5 sm:p-6 shadow-2xl relative border border-white/20 text-white overflow-hidden my-auto z-10"
              style={{
                ...nativeFastRaisedStyle,
                background: `linear-gradient(145deg, ${netflixNeumorphic.panelRaised}, ${netflixNeumorphic.panel})`,
                fontFamily: "'Montserrat', sans-serif"
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider" style={{ color: netflixNeumorphic.text }}>New Custom Genre</h3>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ ...nativeFastRaisedStyle, color: netflixNeumorphic.textSoft }}
                >
                  <X size={18} />
                </button>
              </div>

              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-0.5" style={{ color: netflixNeumorphic.textSoft }}>Genre Name</label>
              <input
                type="text"
                value={customGenreName}
                onChange={(e) => setCustomGenreName(e.target.value)}
                placeholder="Enter custom genre name..."
                className="w-full rounded-2xl p-3 mb-5 text-xs sm:text-sm font-medium focus:outline-none placeholder:text-neutral-500"
                style={{ ...nativeFastInsetStyle, color: netflixNeumorphic.text }}
                autoFocus
              />

              <button
                onClick={handleAddCustom}
                className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 shadow-lg"
                style={nativeFastRedButtonStyle}
              >
                Add Genre & Connect Node
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
