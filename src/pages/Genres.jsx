import { lazy, Suspense, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Trash2, LayoutGrid, Settings, ChevronRight, ChevronLeft } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import { shouldUseNeumorphicLayout } from '../lib/platform'

const isNative = shouldUseNeumorphicLayout()

// Lazy load 3D component - only fetched on web
const Background3D = lazy(() => import('../components/canvas/Background3D'))

const DEFAULT_GENRES = [
    { id: 'Action', label: 'Action', desc: 'High energy and physical stunts', icon: 'bolt' },
    { id: 'Drama', label: 'Drama', desc: 'Character-driven stories', icon: 'theater_comedy' },
    { id: 'Comedy', label: 'Comedy', desc: 'Humor and amusement', icon: 'sentiment_very_satisfied' },
    { id: 'Horror', label: 'Horror', desc: 'Fear and suspense', icon: 'psychology' },
    { id: 'Romance', label: 'Romance', desc: 'Love and relationships', icon: 'favorite_border' },
    { id: 'Sci-Fi', label: 'Sci-Fi', desc: 'Futuristic and science-based', icon: 'rocket_launch' },
    { id: 'Fantasy', label: 'Fantasy', desc: 'Magic and supernatural', icon: 'auto_fix_high' },
    { id: 'Thriller', label: 'Thriller', desc: 'Excitement and suspense', icon: 'visibility' },
]

// ──────────────────────────────────────────────
// Shared font injection (Montserrat)
// ──────────────────────────────────────────────
if (typeof document !== 'undefined') {
  if (!document.getElementById('montserrat-font')) {
    const link = document.createElement('link')
    link.id = 'montserrat-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }
}

export default function Genres() {
    const {
        selectedYear, selectedCategory, selectedGenres, toggleGenre,
        customGenres, fetchCustomGenres, addCustomGenre, deleteCustomGenre,
    } = useStore()
    const navigate = useNavigate()
    const [showSettings, setShowSettings] = useState(false)
    const [showCustomModal, setShowCustomModal] = useState(false)
    const [customGenreName, setCustomGenreName] = useState('')

    useEffect(() => {
        fetchCustomGenres()
    }, [fetchCustomGenres])

    const categoryCustomGenres = customGenres.filter(
        g => g.category === selectedCategory || (!g.category && selectedCategory === 'Movies')
    )

    const allGenres = [...DEFAULT_GENRES, ...categoryCustomGenres]

    const handleAddCustom = () => {
        if (!customGenreName.trim()) return
        const newId = customGenreName.toLowerCase().replace(/\s+/g, '-')
        if (allGenres.some(g => g.id === newId)) {
            alert("Genre already exists!")
            return
        }
        addCustomGenre({ id: newId, label: customGenreName, desc: 'Custom User Genre', icon: 'star_border' })
        setCustomGenreName('')
        setShowCustomModal(false)
    }

    const handleDeleteCustom = (e, id) => {
        e.stopPropagation()
        if (confirm('Delete this custom genre?')) {
            deleteCustomGenre(id)
        }
    }

    // ── Native (Android) — Light Neumorphic Layout ──
    if (isNative) {
        return (
            <div
                className="min-h-screen w-full relative overflow-hidden flex flex-col"
                style={{
                    background: '#ECEEF2',
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    fontFamily: "'Montserrat', 'Raleway', sans-serif",
                }}
            >
                {/* Subtle light radials for depth */}
                <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
                    <div style={{
                        position: 'absolute',
                        top: '5%',
                        left: '10%',
                        width: 280,
                        height: 280,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(200,210,240,0.35) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '15%',
                        right: '5%',
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(180,200,230,0.25) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                    }} />
                </div>

                {/* ── Simplified Native Header ── */}
                <div className="flex-shrink-0 relative z-20 px-4 pt-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/category')}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
                        style={{ 
                            background: '#E8EAED', 
                            boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                            border: '1px solid rgba(255,255,255,0.95)',
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronLeft size={22} style={{ color: '#4B5563' }} />
                    </button>
                    
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                        Select Genre
                    </h1>

                    <UserBadge />
                </div>

                {/* ── Title Section ── */}
                <div
                    className="flex-shrink-0 text-center relative z-10"
                    style={{ marginTop: 24, marginBottom: 12, paddingHorizontal: 16 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <h1 style={{ fontSize: 26, fontWeight: 600, color: '#2D3748', letterSpacing: '0.12em', margin: 0 }}>{selectedYear}</h1>
                    </div>
                </div>


                {/* ── Genre Grid ── */}
                <main className="flex-1 overflow-y-auto relative z-10 px-4 pb-20">
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        {allGenres.map((g, idx) => {
                            const isSelected = selectedGenres.includes(g.id)
                            const isCustom = !DEFAULT_GENRES.some(dg => dg.id === g.id)

                            return (
                                <Motion.div
                                    key={g.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                                    onClick={() => toggleGenre(g.id)}
                                    className="pressable relative flex flex-col items-center justify-center p-5 gap-3 transition-all duration-300"
                                    style={{
                                        // Neumorphic Styling: Recessed when selected, Raised when not
                                        background: '#E8EAED',
                                        borderRadius: 24,
                                        boxShadow: isSelected
                                            ? 'inset 4px 4px 10px rgba(180,190,210,0.5), inset -2px -2px 6px rgba(255,255,255,0.95)'
                                            : '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                                        border: '1px solid rgba(255,255,255,0.95)',
                                        minHeight: 130,
                                    }}
                                >
                                    <div
                                        className="absolute top-3 right-3 transition-opacity duration-300"
                                        style={{ opacity: isSelected ? 1 : 0, color: '#4F46E5' }}
                                    >
                                        <CheckCircle size={18} />
                                    </div>

                                    {isCustom && (
                                        <button
                                            onClick={(e) => handleDeleteCustom(e, g.id)}
                                            className="absolute top-2 left-2 p-2 opacity-50 text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}

                                    <div
                                        className="flex items-center justify-center rounded-2xl transition-all duration-300"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                                            color: isSelected ? '#4F46E5' : '#64748B',
                                            boxShadow: isSelected ? 'inset 1px 1px 3px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: 28 }}>{g.icon || 'star_border'}</span>
                                    </div>

                                    <span
                                        className="text-center transition-colors"
                                        style={{
                                            fontSize: 14,
                                            fontWeight: isSelected ? 600 : 500,
                                            color: isSelected ? '#1E293B' : '#475569',
                                            fontFamily: "'Montserrat', sans-serif"
                                        }}
                                    >
                                        {g.label}
                                    </span>
                                </Motion.div>
                            )
                        })}

                        {/* Add Custom Button */}
                        <Motion.button
                            onClick={() => setShowCustomModal(true)}
                            className="pressable relative flex flex-col items-center justify-center p-5 gap-2 border-2 border-dashed border-slate-300 rounded-3xl opacity-60"
                            style={{ minHeight: 130 }}
                        >
                            <span className="material-icons-outlined text-slate-400" style={{ fontSize: 32 }}>add</span>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Custom</span>
                        </Motion.button>
                    </div>

                    {/* ── Continue Button (Embedded) ── */}
                    <div className="mt-12 mb-10 px-6 max-w-sm mx-auto">
                        <button
                            onClick={() => navigate('/calendar')}
                            disabled={selectedGenres.length === 0}
                            className="pressable w-full disabled:opacity-50"
                            style={{
                                background: '#E8EAED',
                                borderRadius: '24px',
                                boxShadow: '4px 4px 12px rgba(180,190,210,0.6), -4px -4px 12px rgba(255,255,255,1)',
                                border: '1px solid rgba(255,255,255,0.95)',
                                padding: '18px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                            }}
                        >
                            <span style={{ 
                                fontSize: 14, 
                                fontWeight: 700, 
                                letterSpacing: '0.2em', 
                                textTransform: 'uppercase', 
                                color: '#1E293B',
                            }}>
                                Continue
                            </span>
                            <ChevronRight size={18} style={{ color: '#4B5563' }} />
                        </button>
                    </div>
                </main>

                {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}

                {/* ── Custom Genre Modal — Redesigned for light theme ── */}
                <AnimatePresence>
                    {showCustomModal && (
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-12"
                        >
                            <Motion.div
                                initial={{ y: 300, scale: 0.95 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={{ y: 300, scale: 0.95 }}
                                className="bg-[#ECEEF2] w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative border border-white/80"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">New Genre</h3>
                                    <button onClick={() => setShowCustomModal(false)} className="p-2 bg-white/50 rounded-full text-slate-400">
                                        <span className="material-icons-outlined">close</span>
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    value={customGenreName}
                                    onChange={(e) => setCustomGenreName(e.target.value)}
                                    placeholder="Enter genre name..."
                                    className="w-full bg-[#E8EAED] rounded-2xl p-5 mb-8 text-slate-800 focus:outline-none placeholder:text-slate-400 shadow-inner"
                                    autoFocus
                                />

                                <button
                                    onClick={handleAddCustom}
                                    className="pressable w-full bg-slate-800 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm shadow-xl"
                                >
                                    Add Genre
                                </button>
                            </Motion.div>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // ── Web Layout (Dark theme maintained) ──
    return (
        <div className="min-h-screen flex flex-col transition-colors duration-300 font-sans relative text-white">
            <div className="fixed inset-0 z-0">
                <Suspense fallback={<div className="absolute inset-0 bg-slate-900" />}>
                    <Background3D />
                </Suspense>
            </div>

            <header className="w-full px-8 py-8 md:px-16 flex justify-between items-end relative z-20">
                <div className="flex flex-col">
                    <div className="flex items-baseline space-x-3 mb-1">
                        <h1 className="font-bold tracking-tight text-[36px]">{selectedYear}</h1>
                        <span className="font-light uppercase text-[18px] border-l border-white/20 pl-3">{selectedCategory}</span>
                    </div>
                    <p className="font-medium tracking-widest uppercase text-[11px] text-white/40">Select your favorite genres</p>
                </div>
                <button
                    onClick={() => navigate('/calendar')}
                    className="pressable bg-white text-black px-8 py-3 rounded-full font-bold text-[13px] tracking-wide"
                >
                    CONTINUE ({selectedGenres.length})
                </button>
            </header>

            <main className="flex-grow px-8 md:px-16 py-8 relative z-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mx-auto max-w-7xl">
                    {allGenres.map((g, idx) => {
                        const isSelected = selectedGenres.includes(g.id)
                        return (
                            <Motion.div
                                key={g.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04, duration: 0.35 }}
                                onClick={() => toggleGenre(g.id)}
                                className={`pressable relative group cursor-pointer rounded-2xl p-8 h-48 flex flex-col items-center justify-center gap-3 border transition-all ${isSelected ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5'}`}
                            >
                                <div className={`absolute top-3 right-3 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                    <CheckCircle size={20} className="text-white" />
                                </div>
                                <span className="material-icons-outlined text-[32px] text-white/60">{g.icon || 'star_border'}</span>
                                <span className="font-medium tracking-wide text-white/90">{g.label}</span>
                            </Motion.div>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}
