import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, X, Trash2, CalendarDays } from 'lucide-react'
import UserBadge from '../components/ui/UserBadge'
import '../components/mobile/MobileBackground.css'
import { shouldUseNeumorphicLayout } from '../lib/platform'

const isNative = shouldUseNeumorphicLayout()
const NATIVE_GRID_COLUMNS = 2
const NATIVE_GRID_GAP = 16
const NATIVE_GRID_OVERSCAN_ROWS = 3
const INITIAL_NATIVE_ROWS = 6

const getScoreColor = (score) => {
    if (!score) return ''
    const val = String(score).replace(/[^0-9.]/g, '')
    const num = Number(val)
    return num > 50
        ? 'text-green-400 bg-green-500/10 border-green-500/20'
        : 'text-red-400 bg-red-500/10 border-red-500/20'
}

const MovieCard = React.memo(({ entry, onClick, onNavigate, onRemove }) => {
    const cardStyle = isNative
        ? {
            background: '#F4F7FB',
            boxShadow: '0 10px 24px rgba(148, 163, 184, 0.18)',
            border: '1px solid rgba(255,255,255,0.9)',
            aspectRatio: '2/3',
        }
        : {
            boxShadow: '8px 8px 16px #d1d9e6, -4px -4px 12px #ffffff',
            border: '1px solid rgba(255,255,255,0.8)',
            aspectRatio: '2/3',
            transform: 'translateZ(0)',
            willChange: 'transform',
            contentVisibility: 'auto',
            contain: 'layout style paint'
        }

    const actionButtonStyle = isNative
        ? {
            background: 'rgba(244, 247, 251, 0.94)',
            boxShadow: '0 4px 10px rgba(148, 163, 184, 0.16)',
            border: '1px solid rgba(255,255,255,0.9)',
        }
        : {
            background: '#F0F4F8',
            boxShadow: '3px 3px 6px rgba(0,0,0,0.1), -2px -2px 5px rgba(255,255,255,0.7)',
        }

    return (
        <div
            onClick={() => onClick(entry)}
            className={`group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-slate-100 ${
                isNative 
                    ? 'transition-transform active:scale-[0.985]' 
                    : 'transition-all hover:scale-[1.02] hover:shadow-xl'
            }`}
            style={cardStyle}
        >
            <div className="absolute inset-0 bg-[#F0F4F8]" />
            {entry.poster ? (
                <img src={entry.poster} className="w-full h-full object-cover relative z-10" loading="lazy" decoding="async" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <div className="text-center p-4">
                        <div className="text-4xl mb-2">🎬</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">No Poster</div>
                    </div>
                </div>
            )}

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent transition-opacity ${
                isNative ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'
            }`} />

            {/* Play Icon - Mobile always, Web on hover */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 z-30 pointer-events-none ${
                isNative ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'
            }`}>
                <div
                    className={`p-3.5 rounded-full border shadow-xl ${isNative ? 'bg-white/90 border-white/90' : 'bg-white/20 backdrop-blur-md border-white/20'}`}
                    style={isNative ? { boxShadow: '0 8px 18px rgba(15, 23, 42, 0.14)' } : undefined}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`absolute top-3 right-3 flex items-center gap-2 ${isNative ? 'z-40' : 'z-20 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Delete "${entry.title}"?`)) onRemove(entry._id, entry.date)
                    }}
                    style={actionButtonStyle}
                    className="text-red-500 p-2 rounded-xl active:scale-90 transition-transform"
                    title="Delete Entry"
                >
                    <Trash2 size={13} strokeWidth={2.5} />
                </button>
                <button
                    onClick={(e) => onNavigate(e, entry)}
                    style={actionButtonStyle}
                    className="text-indigo-600 p-2 rounded-xl active:scale-90 transition-transform"
                    title="View in Calendar"
                >
                    <CalendarDays size={13} strokeWidth={2.5} />
                </button>
            </div>

            {/* Info Content */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-5 transform transition-transform ${
                isNative ? 'translate-y-0' : 'translate-y-1 group-hover:translate-y-0'
            }`}>
                <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1.5 py-0.5 rounded ${isNative ? 'bg-black/20' : 'bg-white/10 backdrop-blur-sm'}`}>
                        {entry.year}
                    </span>
                    {entry.rating > 0 && (
                        <span className={`text-[9px] font-bold text-yellow-500 flex items-center gap-0.5 px-1.5 py-0.5 rounded ${isNative ? 'bg-black/20' : 'bg-white/10 backdrop-blur-sm'}`}>
                            ★ {entry.rating}
                        </span>
                    )}
                </div>
                <h3 className="text-white font-bold leading-tight mb-2 line-clamp-2 drop-shadow-lg text-sm md:text-base">{entry.title}</h3>
                <div className={`flex flex-wrap gap-1 mt-2 transition-opacity duration-300 ${
                    isNative ? 'opacity-80' : 'opacity-0 group-hover:opacity-100'
                }`}>
                    {(entry.genres || []).slice(0, 2).map(g => (
                        <span key={g} className={`text-[8px] font-bold text-white/80 uppercase tracking-tighter border px-1.5 py-0.5 rounded ${isNative ? 'bg-indigo-500/45 border-white/10' : 'bg-indigo-500/30 border-white/20 backdrop-blur-sm'}`}>
                            {g}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
})

const NativeVirtualizedGrid = React.memo(({ entries, onClick, onNavigate, onRemove }) => {
    const containerRef = useRef(null)
    const frameRef = useRef(0)
    const [containerWidth, setContainerWidth] = useState(0)
    const [visibleRows, setVisibleRows] = useState({ start: 0, end: INITIAL_NATIVE_ROWS })

    const totalRows = Math.ceil(entries.length / NATIVE_GRID_COLUMNS)

    const measureVisibleRows = useCallback(() => {
        const container = containerRef.current
        if (!container) return

        const width = container.clientWidth
        if (!width) return

        setContainerWidth((prev) => (prev === width ? prev : width))

        const cardWidth = (width - NATIVE_GRID_GAP) / NATIVE_GRID_COLUMNS
        const nextRowHeight = (cardWidth * 1.5) + NATIVE_GRID_GAP
        const totalHeight = Math.max(0, (totalRows * nextRowHeight) - NATIVE_GRID_GAP)
        const rect = container.getBoundingClientRect()
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
        const visibleTop = Math.max(0, -rect.top)
        const visibleBottom = Math.max(0, Math.min(totalHeight, viewportHeight - rect.top))
        const start = Math.max(0, Math.floor(visibleTop / nextRowHeight) - NATIVE_GRID_OVERSCAN_ROWS)
        const end = Math.min(
            totalRows,
            Math.max(
                start + INITIAL_NATIVE_ROWS,
                Math.ceil(visibleBottom / nextRowHeight) + NATIVE_GRID_OVERSCAN_ROWS
            )
        )

        setVisibleRows((prev) => (
            prev.start === start && prev.end === end ? prev : { start, end }
        ))
    }, [totalRows])

    useEffect(() => {
        const scheduleMeasure = () => {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = window.requestAnimationFrame(measureVisibleRows)
        }

        scheduleMeasure()

        window.addEventListener('scroll', scheduleMeasure, { passive: true })
        window.addEventListener('resize', scheduleMeasure)

        let resizeObserver
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            resizeObserver = new ResizeObserver(scheduleMeasure)
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            cancelAnimationFrame(frameRef.current)
            window.removeEventListener('scroll', scheduleMeasure)
            window.removeEventListener('resize', scheduleMeasure)
            resizeObserver?.disconnect()
        }
    }, [measureVisibleRows, entries.length])

    const rowHeight = useMemo(() => {
        if (!containerWidth) return 0
        const cardWidth = (containerWidth - NATIVE_GRID_GAP) / NATIVE_GRID_COLUMNS
        return (cardWidth * 1.5) + NATIVE_GRID_GAP
    }, [containerWidth])

    const totalHeight = useMemo(() => {
        if (!rowHeight || totalRows === 0) return 0
        return Math.max(0, (totalRows * rowHeight) - NATIVE_GRID_GAP)
    }, [rowHeight, totalRows])

    const visibleEntries = useMemo(() => {
        const startIndex = visibleRows.start * NATIVE_GRID_COLUMNS
        const endIndex = visibleRows.end * NATIVE_GRID_COLUMNS
        return entries.slice(startIndex, endIndex)
    }, [entries, visibleRows])

    const topSpacerHeight = rowHeight ? visibleRows.start * rowHeight : 0
    const renderedRows = Math.max(0, visibleRows.end - visibleRows.start)
    const renderedHeight = renderedRows > 0 && rowHeight
        ? Math.max(0, (renderedRows * rowHeight) - NATIVE_GRID_GAP)
        : 0
    const bottomSpacerHeight = Math.max(0, totalHeight - topSpacerHeight - renderedHeight)

    return (
        <div ref={containerRef} className="w-full">
            {topSpacerHeight > 0 && <div style={{ height: topSpacerHeight }} aria-hidden="true" />}
            <div className="grid grid-cols-2 gap-4">
                {visibleEntries.map((entry) => (
                    <MovieCard
                        key={entry._id + entry.date}
                        entry={entry}
                        onClick={onClick}
                        onNavigate={onNavigate}
                        onRemove={onRemove}
                    />
                ))}
            </div>
            {bottomSpacerHeight > 0 && <div style={{ height: bottomSpacerHeight }} aria-hidden="true" />}
        </div>
    )
})

export default function MySpace() {

    const {
        calendarEntries,
        removeEntry,
        setYear,
        setCategory,
        setSelectedGenres: setGlobalSelectedGenres,
        setSelectedMonth,
        fetchEntries,
        isEntriesLoading,
        entriesError,
    } = useStore()
    const navigate = useNavigate()

    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedStatus, setSelectedStatus] = useState('All')
    const [selectedGenres, setSelectedGenres] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    const allEntries = useMemo(() => {
        let entries = []
        if (!calendarEntries) return []
        Object.entries(calendarEntries).forEach(([dateStr, dayEntries]) => {
            const year = parseInt(dateStr.split('-')[0])
            if (year >= 1900 && year <= 2050) {
                const entriesWithDate = dayEntries.map(e => ({ ...e, date: dateStr, year }))
                entries = [...entries, ...entriesWithDate]
            }
        })
        return entries.sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [calendarEntries])

    const availableGenres = useMemo(() => {
        const genres = new Set()
        allEntries.forEach(e => {
            if (e.genres) e.genres.forEach(g => genres.add(g))
            if (e.genre) genres.add(e.genre)
        })
        return Array.from(genres).sort()
    }, [allEntries])

    const filteredEntries = useMemo(() => {
        return allEntries.filter(entry => {
            if (searchQuery.length > 0) {
                const q = searchQuery.toLowerCase()
                if (!entry.title?.toLowerCase().includes(q)) return false
            }
            if (selectedCategory !== 'All') {
                const cat = entry.category || 'Movies'
                if (cat !== selectedCategory) return false
            }
            if (selectedStatus !== 'All') {
                const stat = (entry.status || 'watched').toLowerCase()
                const filterStat = selectedStatus.toLowerCase()
                if (stat !== filterStat) return false
            }
            if (selectedGenres.length > 0) {
                const entryGenres = entry.genres || [entry.genre] || []
                const hasMatch = selectedGenres.some(g => entryGenres.includes(g))
                if (!hasMatch) return false
            }
            return true
        })
    }, [allEntries, searchQuery, selectedCategory, selectedStatus, selectedGenres])

    const toggleGenre = (genre) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        )
    }

    const [selectedTrailerEntry, setSelectedTrailerEntry] = useState(null)
    const [trailerVideoId, setTrailerVideoId] = useState(null)
    const [isLoadingTrailer, setIsLoadingTrailer] = useState(false)
    const loadingPlaceholderCount = isNative ? 6 : 8

    useEffect(() => {
        fetchEntries().catch(() => {})
    }, [fetchEntries])

    const surfaceStyle = useMemo(() => (
        isNative
            ? {
                background: '#F4F7FB',
                boxShadow: '0 8px 20px rgba(148, 163, 184, 0.14)',
                border: '1px solid rgba(255,255,255,0.9)',
            }
            : {
                background: '#F0F4F8',
                boxShadow: '4px 4px 8px #d1d9e6, -2px -2px 6px #ffffff',
            }
    ), [])

    const pressedSurfaceStyle = useMemo(() => (
        isNative
            ? {
                background: '#E8EEF6',
                boxShadow: 'inset 0 2px 6px rgba(148, 163, 184, 0.18)',
                border: '1px solid rgba(255,255,255,0.85)',
            }
            : {
                background: '#F0F4F8',
                boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -2px -2px 5px #ffffff'
            }
    ), [])

    const handleEntryClick = useCallback(async (entry) => {
        setSelectedTrailerEntry(entry)
        setTrailerVideoId(null)
        setIsLoadingTrailer(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const res = await fetch(`${API_URL}/api/trailer?q=${encodeURIComponent(entry.title)}`)
            const data = await res.json()
            if (data.videoId) {
                setTrailerVideoId(data.videoId)
            }
        } catch (error) {
            console.error("Failed to fetch trailer ID", error)
        } finally {
            setIsLoadingTrailer(false)
        }
    }, [])

    const closeTrailerModal = useCallback(() => {
        setSelectedTrailerEntry(null)
        setTrailerVideoId(null)
    }, [])

    const handleNavigateToCalendar = useCallback((e, entry) => {
        e.stopPropagation()
        setYear(entry.year)
        setCategory(entry.category || 'Movies')
        const genres = entry.genres && entry.genres.length > 0 ? entry.genres : [entry.genre || 'General']
        setGlobalSelectedGenres(genres)
        if (entry.date) {
            const parts = entry.date.split('-')
            if (parts.length === 3) {
                const monthIndex = parseInt(parts[1]) - 1
                setSelectedMonth(monthIndex)
            }
        }
        navigate('/calendar')
    }, [navigate, setCategory, setGlobalSelectedGenres, setSelectedMonth, setYear])

    return (
        <div className="min-h-screen w-full relative font-sans selection:bg-indigo-500/30" style={{ background: '#F0F4F8' }}>
            {/* Background Ambience - Disabled on mobile for performance */}
            {!isNative && (
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div 
                        className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-60" 
                        style={{ background: 'radial-gradient(circle, rgba(200,220,255,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }}
                    />
                    <div 
                        className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full opacity-50" 
                        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }}
                    />
                </div>
            )}

            {/* Light mobile background gradient */}
            {isNative && (
                <div 
                    className="fixed inset-0 z-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 100%)' }}
                />
            )}

            {/* Header / Nav */}
            <header 
                className={`sticky top-0 z-50 ${isNative ? '' : 'backdrop-blur-md'}`}
                style={{ 
                    background: isNative ? '#F4F7FB' : 'rgba(240, 244, 248, 0.8)', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: isNative
                        ? '0 4px 12px rgba(148, 163, 184, 0.10)'
                        : '0 4px 12px rgba(180, 190, 210, 0.15)'
                }}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 rounded-2xl transition-all active:scale-90"
                            style={{ ...surfaceStyle, color: '#1E293B' }}
                        >
                            <ArrowLeft size={22} strokeWidth={2.5} />
                        </button>
                        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-[#1E293B]">My Space</h1>
                    </div>
                    <UserBadge />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start">

                {/* Sidebar Filters - collapsible on mobile */}
                <aside className="w-full md:w-72 flex-shrink-0 space-y-6 md:space-y-8 md:sticky md:top-24">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search collection..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={isNative ? pressedSurfaceStyle : {
                                background: '#F0F4F8',
                                boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
                            }}
                            className="w-full border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-700 font-medium focus:outline-none transition-all"
                        />
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Category</h3>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
                            {['All', 'Movies', 'Series', 'Anime'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={selectedCategory === cat
                                        ? { ...pressedSurfaceStyle, color: '#4F46E5' }
                                        : { ...surfaceStyle, color: '#64748B' }
                                    }
                                    className={`text-left px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Status</h3>
                        <div className="flex flex-wrap gap-2.5">
                            {['All', 'Upcoming', 'Watching', 'Watched'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    style={selectedStatus === status
                                        ? { ...pressedSurfaceStyle, color: '#0F172A' }
                                        : { ...surfaceStyle, color: '#64748B' }
                                    }
                                    className={`px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genres */}
                    <div>
                        <div className="flex justify-between items-center mb-4 ml-1">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Genres</h3>
                            {selectedGenres.length > 0 && (
                                <button onClick={() => setSelectedGenres([])} className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline">
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableGenres.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    style={selectedGenres.includes(genre)
                                        ? {
                                            ...pressedSurfaceStyle,
                                            color: '#4F46E5',
                                            border: '1px solid rgba(79,70,229,0.2)'
                                        }
                                        : {
                                            ...surfaceStyle,
                                            color: '#64748B',
                                            border: '1px solid transparent'
                                        }
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content Grid */}
                <div className="flex-1 min-h-[50vh]">
                    <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-5">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                                {selectedCategory === 'All' ? 'My Collection' : selectedCategory}
                                <span className="text-slate-400 ml-3 text-lg font-medium opacity-60">
                                    {selectedStatus !== 'All' && `/ ${selectedStatus}`}
                                </span>
                            </h2>
                            <p className="text-slate-500 font-medium text-xs mt-1.5 uppercase tracking-widest">
                                {isEntriesLoading && filteredEntries.length === 0
                                    ? 'Loading collection...'
                                    : `${filteredEntries.length} items found`
                                }
                                {isEntriesLoading && filteredEntries.length > 0 && (
                                    <span className="ml-3 text-indigo-500">Refreshing...</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {isEntriesLoading && filteredEntries.length === 0 ? (
                        <div className={`grid ${isNative ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'} gap-4 md:gap-6`}>
                            {Array.from({ length: loadingPlaceholderCount }).map((_, index) => (
                                <div
                                    key={`loading-card-${index}`}
                                    className="aspect-[2/3] rounded-2xl overflow-hidden animate-pulse"
                                    style={{
                                        background: '#E7ECF3',
                                        boxShadow: isNative
                                            ? '0 8px 18px rgba(148, 163, 184, 0.12)'
                                            : '8px 8px 16px #d1d9e6, -4px -4px 12px #ffffff',
                                        border: '1px solid rgba(255,255,255,0.9)',
                                    }}
                                >
                                    <div className="h-full w-full bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200" />
                                </div>
                            ))}
                        </div>
                    ) : entriesError && filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                            <div
                                style={{ boxShadow: '6px 6px 12px #d1d9e6, -4px -4px 10px #ffffff' }}
                                className="p-8 rounded-full mb-6 bg-[#F0F4F8]"
                            >
                                <Filter size={48} className="opacity-40" />
                            </div>
                            <p className="text-lg font-bold text-slate-500 text-center max-w-md">{entriesError}</p>
                            <button
                                onClick={() => fetchEntries({ force: true }).catch(() => {})}
                                className="mt-4 text-xs font-bold text-indigo-500 uppercase tracking-widest hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                            <div 
                                style={{ boxShadow: '6px 6px 12px #d1d9e6, -4px -4px 10px #ffffff' }}
                                className="p-8 rounded-full mb-6 bg-[#F0F4F8]"
                            >
                                <Filter size={48} className="opacity-40" />
                            </div>
                            <p className="text-lg font-bold text-slate-400">Nothing found here...</p>
                            <button
                                onClick={() => { setSelectedCategory('All'); setSelectedStatus('All'); setSelectedGenres([]); setSearchQuery(''); }}
                                className="mt-4 text-xs font-bold text-indigo-500 uppercase tracking-widest hover:underline"
                            >
                                Reset all filters
                            </button>
                        </div>
                    ) : (
                        isNative ? (
                            <NativeVirtualizedGrid
                                entries={filteredEntries}
                                onClick={handleEntryClick}
                                onNavigate={handleNavigateToCalendar}
                                onRemove={removeEntry}
                            />
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {filteredEntries.map((entry) => (
                                    <MovieCard 
                                        key={entry._id + entry.date}
                                        entry={entry}
                                        onClick={handleEntryClick}
                                        onNavigate={handleNavigateToCalendar}
                                        onRemove={removeEntry}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </main>

            {/* Trailer Modal */}
            {selectedTrailerEntry && (
                <div
                    className={`fixed inset-0 z-[100] bg-slate-900/40 flex items-center justify-center p-4 md:p-10 ${isNative ? '' : 'backdrop-blur-md'}`}
                    onClick={closeTrailerModal}
                >
                    <div
                        className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col transition-all"
                        style={{ background: '#F0F4F8', border: '1px solid rgba(255,255,255,0.8)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-slate-800 max-w-md truncate">{selectedTrailerEntry.title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                                    {isLoadingTrailer ? 'Searching Trailer...' : 'Official Trailer'}
                                </p>
                            </div>
                            <button 
                                onClick={closeTrailerModal} 
                                style={surfaceStyle}
                                className="p-2.5 rounded-2xl text-slate-600 transition-all active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="relative aspect-video w-full bg-slate-100 group flex items-center justify-center">
                            {isLoadingTrailer ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching YouTube...</span>
                                </div>
                            ) : trailerVideoId ? (
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&origin=${window.location.origin}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="text-center p-10">
                                    <div className="text-5xl mb-6">🏜️</div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">No Trailer Found</h4>
                                    <p className="text-slate-500 text-sm mb-8">Could not locate an embeddable video for this title.</p>
                                    <a
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTrailerEntry.title + " official trailer")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-95"
                                    >
                                        Open on YouTube ↗
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="p-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-200">
                            <div className="flex gap-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>{selectedTrailerEntry.year}</span>
                                <span>{selectedTrailerEntry.category || 'Movie'}</span>
                            </div>
                            {(selectedTrailerEntry.rtCriticScore || selectedTrailerEntry.rtAudienceScore) && (
                                <div className="flex gap-3">
                                    {selectedTrailerEntry.rtCriticScore && (
                                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${getScoreColor(selectedTrailerEntry.rtCriticScore)}`}>
                                            {selectedTrailerEntry.rtCriticScore}% CRITICS
                                        </span>
                                    )}
                                    {selectedTrailerEntry.rtAudienceScore && (
                                        <span className="text-[10px] text-orange-600 font-bold px-2.5 py-1 rounded-lg border border-orange-200 bg-orange-50">
                                            {selectedTrailerEntry.rtAudienceScore}% AUDIENCE
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
