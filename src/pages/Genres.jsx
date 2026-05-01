import { lazy, Suspense, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Trash2, LayoutGrid, Settings, ChevronRight, ChevronLeft } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import { shouldUseCompactNativeLayout, shouldUseNeumorphicLayout } from '../lib/platform'
import { netflixNeumorphic, netflixPageStyle, netflixRaisedStyle, netflixRedButtonStyle, netflixSurfaceStyle, netflixInsetStyle } from '../styles/netflixNeumorphic'

const isNative = shouldUseCompactNativeLayout()
const useDesktopNeumorphic = shouldUseNeumorphicLayout() && !isNative

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
                    background: netflixNeumorphic.pageBackground,
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
                        background: 'radial-gradient(circle, rgba(229,9,20,0.24) 0%, transparent 70%)',
                        filter: 'blur(72px)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '15%',
                        right: '5%',
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(122,18,28,0.22) 0%, transparent 70%)',
                        filter: 'blur(76px)',
                    }} />
                </div>

                {/* ── Simplified Native Header ── */}
                <div className="flex-shrink-0 relative z-20 px-4 pt-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/category')}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
                        style={{ 
                            ...netflixRaisedStyle,
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronLeft size={22} style={{ color: netflixNeumorphic.textSoft }} />
                    </button>
                    
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: netflixNeumorphic.text, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
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
                        <h1 style={{ fontSize: 26, fontWeight: 600, color: netflixNeumorphic.text, letterSpacing: '0.12em', margin: 0 }}>{selectedYear}</h1>
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
                                        ...(isSelected ? netflixInsetStyle : netflixRaisedStyle),
                                        borderRadius: 24,
                                        border: isSelected ? `1px solid ${netflixNeumorphic.borderStrong}` : `1px solid ${netflixNeumorphic.border}`,
                                        minHeight: 130,
                                    }}
                                >
                                    <div
                                        className="absolute top-3 right-3 transition-opacity duration-300"
                                        style={{ opacity: isSelected ? 1 : 0, color: netflixNeumorphic.red }}
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
                                            ...netflixInsetStyle,
                                            color: isSelected ? netflixNeumorphic.red : netflixNeumorphic.textSoft,
                                        }}
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: 28 }}>{g.icon || 'star_border'}</span>
                                    </div>

                                    <span
                                        className="text-center transition-colors"
                                        style={{
                                            fontSize: 14,
                                            fontWeight: isSelected ? 600 : 500,
                                            color: isSelected ? netflixNeumorphic.text : netflixNeumorphic.textSoft,
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
                            className="pressable relative flex flex-col items-center justify-center p-5 gap-2 rounded-3xl opacity-75"
                            style={{ ...netflixInsetStyle, minHeight: 130, border: '1px dashed rgba(255,255,255,0.16)' }}
                        >
                            <span className="material-icons-outlined text-neutral-500" style={{ fontSize: 32 }}>add</span>
                            <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Custom</span>
                        </Motion.button>
                    </div>

                    {/* ── Continue Button (Embedded) ── */}
                    <div className="mt-12 mb-10 px-6 max-w-sm mx-auto">
                        <button
                            onClick={() => navigate('/calendar')}
                            disabled={selectedGenres.length === 0}
                            className="pressable w-full disabled:opacity-50"
                            style={{
                                ...netflixRedButtonStyle,
                                borderRadius: '24px',
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
                                color: '#FFFFFF',
                            }}>
                                Continue
                            </span>
                            <ChevronRight size={18} style={{ color: '#FFFFFF' }} />
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
                                className="w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative"
                                style={netflixSurfaceStyle}
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold text-white tracking-tight">New Genre</h3>
                                    <button onClick={() => setShowCustomModal(false)} className="p-2 rounded-full text-neutral-400" style={netflixRaisedStyle}>
                                        <span className="material-icons-outlined">close</span>
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    value={customGenreName}
                                    onChange={(e) => setCustomGenreName(e.target.value)}
                                    placeholder="Enter genre name..."
                                    className="w-full rounded-2xl p-5 mb-8 text-white focus:outline-none placeholder:text-neutral-500"
                                    style={netflixInsetStyle}
                                    autoFocus
                                />

                                <button
                                    onClick={handleAddCustom}
                                    className="pressable w-full text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm"
                                    style={netflixRedButtonStyle}
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
    if (useDesktopNeumorphic) {
        const theme = netflixNeumorphic
        return (
            <div className="min-h-screen w-full relative overflow-hidden" style={netflixPageStyle}>
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div style={{ position: 'absolute', left: '7%', top: '10%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,9,20,0.22) 0%, transparent 70%)', filter: 'blur(72px)' }} />
                    <div style={{ position: 'absolute', right: '6%', bottom: '8%', width: 310, height: 310, borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,18,28,0.2) 0%, transparent 70%)', filter: 'blur(76px)' }} />
                </div>
                <header className="relative z-10 max-w-7xl mx-auto px-8 pt-8 flex items-center justify-between">
                    <button onClick={() => navigate('/category')} className="pressable flex items-center justify-center" style={{ ...netflixRaisedStyle, width: 54, height: 54, borderRadius: 22, color: theme.textSoft }}>
                        <ChevronLeft size={22} />
                    </button>
                    <UserBadge />
                </header>

                <main className="relative z-10 max-w-7xl mx-auto px-8 py-9 grid grid-cols-[330px_1fr] gap-8">
                    <aside style={{ ...netflixSurfaceStyle, borderRadius: 36, padding: 30, alignSelf: 'start' }}>
                        <p style={{ fontSize: 12, color: theme.muted, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>{selectedCategory || 'All Media'}</p>
                        <h1 style={{ marginTop: 16, fontSize: 50, color: theme.text, fontWeight: 750, letterSpacing: '0.08em' }}>{selectedYear}</h1>
                        <p style={{ marginTop: 14, color: theme.textSoft, lineHeight: 1.8, fontSize: 14 }}>Pick one or more genres. The grid is sized for desktop scanning instead of mobile tapping.</p>
                        <button onClick={() => navigate('/calendar')} disabled={selectedGenres.length === 0} className="pressable w-full mt-8 disabled:opacity-50" style={{ ...(selectedGenres.length ? netflixRedButtonStyle : netflixInsetStyle), color: selectedGenres.length ? '#FFFFFF' : theme.muted, borderRadius: 24, minHeight: 58, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12 }}>
                            Continue ({selectedGenres.length})
                        </button>
                    </aside>

                    <section className="grid grid-cols-4 gap-5">
                        {allGenres.map((g, idx) => {
                            const isSelected = selectedGenres.includes(g.id)
                            const isCustom = !DEFAULT_GENRES.some(dg => dg.id === g.id)

                            return (
                                <Motion.button key={g.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.025, duration: 0.28 }} onClick={() => toggleGenre(g.id)} className="pressable relative flex flex-col items-start justify-between text-left" style={{ ...(isSelected ? netflixInsetStyle : netflixRaisedStyle), borderRadius: 28, border: isSelected ? `1px solid ${theme.borderStrong}` : `1px solid ${theme.border}`, minHeight: 170, padding: 24 }}>
                                    {isCustom && (
                                        <span onClick={(e) => handleDeleteCustom(e, g.id)} className="absolute top-4 right-4 text-red-400">
                                            <Trash2 size={15} />
                                        </span>
                                    )}
                                    <div className="flex items-center justify-center" style={{ ...netflixInsetStyle, width: 52, height: 52, borderRadius: 20, color: isSelected ? theme.red : theme.textSoft }}>
                                        <span className="material-icons-outlined" style={{ fontSize: 25 }}>{g.icon || 'star_border'}</span>
                                    </div>
                                    <div>
                                        <h2 style={{ color: theme.text, fontSize: 18, fontWeight: 750 }}>{g.label}</h2>
                                        <p style={{ color: theme.textSoft, fontSize: 12, marginTop: 5 }}>{g.desc || 'Custom genre'}</p>
                                    </div>
                                    {isSelected && <CheckCircle className="absolute top-4 right-4 text-red-500" size={18} />}
                                </Motion.button>
                            )
                        })}
                        <button onClick={() => setShowCustomModal(true)} className="pressable flex flex-col items-center justify-center gap-3" style={{ ...netflixInsetStyle, borderRadius: 28, border: '1px dashed rgba(255,255,255,0.16)', minHeight: 170, color: theme.textSoft }}>
                            <span className="material-icons-outlined" style={{ fontSize: 30 }}>add</span>
                            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Custom Genre</span>
                        </button>
                    </section>
                </main>

                <AnimatePresence>
                    {showCustomModal && (
                        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4">
                            <Motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="w-full max-w-md rounded-[36px] p-8 shadow-2xl relative" style={netflixSurfaceStyle}>
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>New Genre</h3>
                                    <button onClick={() => setShowCustomModal(false)} className="p-2 rounded-full" style={{ ...netflixRaisedStyle, color: theme.textSoft }}>
                                        <span className="material-icons-outlined">close</span>
                                    </button>
                                </div>
                                <input type="text" value={customGenreName} onChange={(e) => setCustomGenreName(e.target.value)} placeholder="Enter genre name..." className="w-full rounded-2xl p-5 mb-8 focus:outline-none placeholder:text-neutral-500" style={{ ...netflixInsetStyle, color: theme.text }} autoFocus />
                                <button onClick={handleAddCustom} className="pressable w-full font-bold py-4 rounded-2xl uppercase tracking-widest text-sm" style={netflixRedButtonStyle}>
                                    Add Genre
                                </button>
                            </Motion.div>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

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
