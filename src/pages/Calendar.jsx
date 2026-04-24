import { lazy, Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Capacitor } from '@capacitor/core'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Upload, Calendar as CalIcon, ChevronLeft, ChevronRight, Trash, LayoutGrid, Settings, LogOut } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import { useNavigate } from 'react-router-dom'

const isNative = Capacitor.isNativePlatform()

// Lazy import - only fetched on web
const Background3D = lazy(() => import('../components/canvas/Background3D'))

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "TV Movie", "Thriller", "War", "Western", "General"]

// ──────────────────────────────────────────────
// Shared font injection (Montserrat)
// ──────────────────────────────────────────────
const montserratLink = typeof document !== 'undefined' && (() => {
  if (!document.getElementById('montserrat-font')) {
    const link = document.createElement('link')
    link.id = 'montserrat-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }
})()

export default function Calendar() {
    const getScoreColor = (score) => {
        if (!score) return ''
        const val = String(score).replace(/[^0-9.]/g, '')
        const num = Number(val)
        return num > 50
            ? 'text-green-400 bg-green-500/10 border-green-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
    }

    const { 
        selectedYear, selectedCategory, selectedGenres, calendarEntries, 
        addEntry, removeEntry, updateEntry, setYear, fetchEntries, 
        customGenres, fetchCustomGenres, selectedMonth, setSelectedMonth, 
        isGuest, cineBotPendingEntry, clearCineBotPendingEntry, logout 
    } = useStore()

    const navigate = useNavigate()
    const [showSettings, setShowSettings] = useState(false)
    const isReadOnly = !selectedCategory
    const [currentMonthIndex, setCurrentMonthIndex] = useState((selectedMonth !== null && selectedMonth >= 0 && selectedMonth <= 11) ? selectedMonth : 0)

    const [longPressData, setLongPressData] = useState(null)
    const longPressRef = useRef(false)
    const pressTimer = useRef(null)

    const handlePointerDown = (day, entries) => {
        longPressRef.current = false;
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = setTimeout(() => {
            longPressRef.current = true;
            setLongPressData({ day, entries });
        }, 550);
    }

    const clearPress = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    }

    const onDayClick = (day) => {
        if (longPressRef.current) return;
        if (!isReadOnly) handleDateClick(day);
    }

    useEffect(() => {
        if (selectedMonth !== null && selectedMonth >= 0 && selectedMonth <= 11) {
            setCurrentMonthIndex(selectedMonth)
        }
    }, [selectedMonth])

    useEffect(() => {
        fetchEntries()
        fetchCustomGenres()
    }, [fetchEntries, fetchCustomGenres])

    const allUniqueGenres = (() => {
        const uniqueMap = new Map();
        const sources = [...GENRES, ...(Array.isArray(customGenres) ? customGenres : []).map(cg => cg?.name).filter(n => typeof n === 'string'), ...selectedGenres];
        sources.forEach(g => {
            const lower = g.toLowerCase();
            if (!uniqueMap.has(lower) || GENRES.includes(g)) {
                uniqueMap.set(lower, g);
            }
        });
        return Array.from(uniqueMap.values());
    })();

    const [imdbLinkValue, setImdbLinkValue] = useState('')

    useEffect(() => {
        if (cineBotPendingEntry) {
            const targetMonth = cineBotPendingEntry.month ?? 0
            setCurrentMonthIndex(targetMonth)
            setSelectedMonth(targetMonth)
            const day = cineBotPendingEntry.day || 1
            const dateStr = `${cineBotPendingEntry.year}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            setSelectedDate({ monthIndex: targetMonth, day, dateStr })
            setShowModal(true)
            setEditingId(null)
            setFormData({
                title: cineBotPendingEntry.title || '',
                status: cineBotPendingEntry.status || 'watched',
                rating: 0,
                rtCriticScore: cineBotPendingEntry.rtCriticScore || '',
                rtAudienceScore: cineBotPendingEntry.rtAudienceScore || '',
                poster: null,
                genres: cineBotPendingEntry.genres || selectedGenres.length > 0 ? [...(cineBotPendingEntry.genres || selectedGenres)] : ['General']
            })
            if (cineBotPendingEntry.imdbLink) {
                setImdbLinkValue(cineBotPendingEntry.imdbLink)
                setTimeout(() => {
                    handleFetchPoster(cineBotPendingEntry.imdbLink)
                }, 500)
            }
            clearCineBotPendingEntry()
        }
    }, [cineBotPendingEntry])

    const [selectedDate, setSelectedDate] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        status: 'watched',
        rating: 0,
        rtCriticScore: '',
        rtAudienceScore: '',
        poster: null,
        genres: selectedGenres.length > 0 ? [...selectedGenres] : ['General']
    })
    const [isFetching, setIsFetching] = useState(false)

    const handleDateClick = (day) => {
        if (isGuest) {
            if (confirm("Sign up to build your own catalogue!")) {
                navigate('/signup')
            }
            return
        }
        const dateStr = `${selectedYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        setSelectedDate({ monthIndex: currentMonthIndex, day, dateStr })
        setShowModal(true)
        setEditingId(null)
        setFormData({
            title: '',
            status: 'watched',
            rating: 0,
            rtCriticScore: '',
            rtAudienceScore: '',
            poster: null,
            genres: selectedGenres.length > 0 ? [...selectedGenres] : ['General']
        })
        setIsFetching(false)
        setImdbLinkValue('')
    }

    const handleEditClick = (entry) => {
        if (isGuest) {
            alert("Read Only Mode: Sign up to edit entries.")
            return
        }
        setEditingId(entry._id)
        setFormData({
            title: entry.title,
            status: entry.status,
            rating: entry.rating || 0,
            rtCriticScore: entry.rtCriticScore || entry.rottenTomatoesScore || '',
            rtAudienceScore: entry.rtAudienceScore || '',
            poster: entry.poster,
            genres: entry.genres && entry.genres.length > 0 ? entry.genres : [entry.genre || 'General']
        })
    }

    const handleSubmit = () => {
        if (!formData.title) return
        if (editingId) {
            updateEntry(editingId, selectedDate.dateStr, formData)
        } else {
            addEntry(selectedDate.dateStr, formData)
        }
        setShowModal(false)
        setEditingId(null)
    }

    const handleFetchPoster = async (link) => {
        if (!link) return
        setIsFetching(true)
        try {
            let newTitle = null
            let posterUrl = null
            const imdbIdMatch = link.match(/tt\d+/)
            if (imdbIdMatch) {
                const imdbId = imdbIdMatch[0]
                const apiEndpoint = `https://v2.sg.media-imdb.com/suggestion/${imdbId[0]}/${imdbId}.json`
                const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiEndpoint)}`
                try {
                    const apiRes = await fetch(proxyUrl)
                    if (apiRes.ok) {
                        const data = await apiRes.json()
                        const result = data.d?.find(item => item.id === imdbId)
                        if (result) {
                            if (result.i?.imageUrl) posterUrl = result.i.imageUrl
                            if (result.l) newTitle = result.l
                        }
                    }
                    const omdbKey = import.meta.env.VITE_OMDB_API_KEY;
                    if (omdbKey && imdbId) {
                        try {
                            const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`);
                            const omdbData = await omdbRes.json();
                            let rtScoreFromOMDB = null;
                            if (omdbData.Ratings) {
                                const rt = omdbData.Ratings.find(r => r.Source === "Rotten Tomatoes");
                                if (rt) {
                                    rtScoreFromOMDB = rt.Value.replace('%', '');
                                    setFormData(prev => ({ ...prev, rtCriticScore: rtScoreFromOMDB }));
                                }
                            }
                            
                            // Rotten Tomatoes scraping (Fallback for Critic, Primary for Audience)
                            if (omdbData.Title || newTitle) {
                                try {
                                    const movieTitle = omdbData.Title || newTitle;
                                    const slug = movieTitle.toLowerCase()
                                        .replace(/[^a-z0-9\s-]/g, '')
                                        .replace(/\s+/g, '_');
                                    const rtUrl = `https://www.rottentomatoes.com/m/${slug}`;
                                    // Use allorigins to bypass basic CORS and some anti-bot protections
                                    const rtProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(rtUrl)}`;
                                    
                                    fetch(rtProxy).then(res => res.text()).then(html => {
                                        let updates = {};
                                        const audMatch = html.match(/audience-score="(\d+)"/);
                                        if (audMatch && audMatch[1]) {
                                            updates.rtAudienceScore = audMatch[1];
                                        }
                                        // If OMDB didn't have RT Critic score, try to scrape it here
                                        const criticMatch = html.match(/tomatometerscore="(\d+)"/);
                                        if (!rtScoreFromOMDB && criticMatch && criticMatch[1]) {
                                            updates.rtCriticScore = criticMatch[1];
                                        }
                                        
                                        if (Object.keys(updates).length > 0) {
                                            setFormData(prev => ({ ...prev, ...updates }));
                                        }
                                    }).catch(e => console.log("RT Scrape background check failed", e));
                                } catch (e) {
                                    console.log("RT URL generation failed", e);
                                }
                            }
                        } catch (err) {
                            console.warn("OMDB Fetch failed", err);
                        }
                    }
                } catch (e) {
                    console.warn("API fetch failed, falling back to scraping", e)
                }
            }
            if (!posterUrl && !newTitle) {
                const scrapeProxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(link)}`
                const response = await fetch(scrapeProxyUrl)
                if (!response.ok) throw new Error('Proxy error')
                const html = await response.text()
                const parser = new DOMParser()
                const doc = parser.parseFromString(html, 'text/html')
                posterUrl = doc.querySelector('meta[property="og:image"]')?.content
                newTitle = doc.querySelector('meta[property="og:title"]')?.content?.replace(' - IMDb', '') || doc.title.replace(' - IMDb', '')
            }
            if (posterUrl || newTitle) {
                setFormData(prev => ({
                    ...prev,
                    poster: posterUrl || null,
                    title: newTitle || prev.title
                }))
                if (!posterUrl) {
                    alert('Poster not found, but Title extracted. Entry will use blank background.')
                }
            } else {
                alert('Could not find a poster image or title. IMDb may be blocking access.')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to fetch. Try manually uploading.')
        } finally {
            setIsFetching(false)
        }
    }

    const getDaysInMonth = (monthIndex, year) => new Date(year, monthIndex + 1, 0).getDate()
    const getFirstDayOfMonth = (monthIndex, year) => new Date(year, monthIndex, 1).getDay()

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData({ ...formData, poster: reader.result })
            }
            reader.readAsDataURL(file)
        }
    }

    const changeMonth = (direction) => {
        if (direction === 'prev') {
            if (currentMonthIndex > 0) {
                const newIndex = currentMonthIndex - 1
                setCurrentMonthIndex(newIndex)
                setSelectedMonth(newIndex)
            }
        } else {
            if (currentMonthIndex < 11) {
                const newIndex = currentMonthIndex + 1
                setCurrentMonthIndex(newIndex)
                setSelectedMonth(newIndex)
            }
        }
    }

    const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const getDayOfWeek = (year, monthIndex, day) => {
        return new Date(year, monthIndex, day).getDay()
    }

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentMonthIndex, selectedYear)
        const firstDay = getFirstDayOfMonth(currentMonthIndex, selectedYear)
        const days = []

        if (!isNative) {
            // --- WEB: Original 7-column grid ---
            for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="aspect-[3/4] bg-white/5 border border-white/5 rounded-lg opacity-20" />)
            }
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            let rawEntries = calendarEntries[dateStr] || []
            let dayEntries = [...rawEntries]

            if (selectedCategory) {
                dayEntries = dayEntries.filter(e => e.category === selectedCategory)
            }

            if (selectedGenres.length > 0) {
                dayEntries = dayEntries.filter(e => {
                    const eGenres = (e.genres || [e.genre || 'General']).map(g => g.toLowerCase())
                    const sGenres = selectedGenres.map(g => g.toLowerCase())
                    const standardGenresList = GENRES.map(g => g.toLowerCase())
                    const hasCustom = sGenres.some(g => !standardGenresList.includes(g))
                    const isMulti = sGenres.length > 1
                    const isUniqueMode = isMulti || hasCustom
                    if (isUniqueMode) {
                        if (eGenres.length !== sGenres.length) return false
                        return sGenres.every(sg => eGenres.includes(sg))
                    } else {
                        return sGenres.some(sg => eGenres.includes(sg))
                    }
                })
            }

            const entryCount = dayEntries.length
            const dayOfWeek = getDayOfWeek(selectedYear, currentMonthIndex, day)
            const posterEntry = dayEntries.find(e => e.poster)
            const isMulti = dayEntries.length > 1

            if (isNative) {
                // --- NATIVE: Large 2-column neumorphic card layout ---
                days.push(
                    <div
                        key={day}
                        onClick={() => onDayClick(day)}
                        onPointerDown={() => handlePointerDown(day, dayEntries)}
                        onPointerUp={clearPress}
                        onPointerLeave={clearPress}
                        onPointerCancel={clearPress}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`
                            relative group transition-all duration-300 rounded-[32px] overflow-hidden flex flex-col
                            select-none touch-auto active:scale-[0.98]
                            ${!isReadOnly ? 'cursor-pointer' : 'cursor-default'}
                        `}
                        style={{ 
                            minHeight: 220,
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            background: '#E8EAED',
                            boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                            border: '1px solid rgba(255,255,255,0.95)',
                        }}
                    >
                        {entryCount > 0 ? (
                            <>
                                {isMulti ? (
                                    <div className="flex flex-col h-full bg-white/30 backdrop-blur-sm">
                                        <div className="relative z-10 flex flex-col h-full p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-2xl font-bold" style={{ color: '#2D3748' }}>{day}</span>
                                                    <span className="text-[10px] uppercase font-bold" style={{ color: '#9CA3AF', letterSpacing: '0.1em' }}>{DAYS_SHORT[dayOfWeek]}</span>
                                                </div>
                                            </div>
                                            
                                            {/* overlapping poster stack */}
                                            <div className="flex-1 flex items-center justify-center relative mt-2">
                                                {dayEntries.slice(0, 3).map((entry, idx) => {
                                                    // Rotation fan effect: -10, 0, 10 degrees. Z-index drops for lower items.
                                                    const rot = idx === 0 ? '-6deg' : idx === 1 ? '4deg' : '10deg';
                                                    const xOff = idx === 0 ? '-15px' : idx === 1 ? '10px' : '25px';
                                                    const yOff = idx === 0 ? '5px' : idx === 1 ? '-5px' : '8px';
                                                    const zIdx = 10 - idx;
                                                    return (
                                                        <div 
                                                            key={entry._id || idx}
                                                            className="absolute rounded-xl overflow-hidden"
                                                            style={{
                                                                width: 72, 
                                                                height: 104,
                                                                transform: `translate(${xOff}, ${yOff}) rotate(${rot})`,
                                                                zIndex: zIdx,
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 2px rgba(255,255,255,0.8)',
                                                                background: '#E8EAED'
                                                            }}
                                                        >
                                                            {entry.poster ? (
                                                                <img src={entry.poster} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                    <CalIcon size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="mt-4 flex justify-center z-20 relative">
                                                <div 
                                                    className="px-4 py-1.5 rounded-full flex items-center gap-2"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.8)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
                                                        border: '1px solid rgba(255,255,255,1)'
                                                    }}
                                                >
                                                    <span className="text-xs font-bold" style={{ color: '#6366F1' }}>{entryCount} Entries</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                                            {posterEntry ? (
                                                <>
                                                    <img
                                                        src={posterEntry.poster}
                                                        alt="Poster"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center" style={{ background: '#E8EAED', color: '#9CA3AF' }}>
                                                    <CalIcon size={32} strokeWidth={1.5} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-4 left-5 z-10 flex items-baseline gap-2">
                                            <span className="text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{day}</span>
                                            <span className="text-[10px] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{DAYS_SHORT[dayOfWeek]}</span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1.5">
                                            <h4
                                                className="font-semibold text-[13px] leading-snug line-clamp-2"
                                                style={{
                                                    color: 'rgba(255,255,255,0.92)',
                                                    textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                                                    letterSpacing: '0.01em'
                                                }}
                                            >
                                                {dayEntries[0].title}
                                            </h4>
                                            <div className="flex flex-wrap gap-1">
                                                {(dayEntries[0].genres || [dayEntries[0].genre || 'General']).slice(0, 2).map(g => (
                                                    <span
                                                        key={g}
                                                        className="text-[8px] px-2 py-0.5 rounded-full truncate max-w-[80px]"
                                                        style={{
                                                            background: 'rgba(0,0,0,0.35)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            color: 'rgba(255,255,255,0.75)',
                                                            backdropFilter: 'blur(4px)'
                                                        }}
                                                    >
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                                                        dayEntries[0].status === 'watched'
                                                            ? 'bg-green-500/30 text-green-300'
                                                            : 'bg-amber-500/30 text-amber-300'
                                                    }`}
                                                    style={{ border: `1px solid ${dayEntries[0].status === 'watched' ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}` }}
                                                >
                                                    {dayEntries[0].status}
                                                </span>
                                                <div className="flex">
                                                    {Array.from({ length: dayEntries[0].rating || 0 }).map((_, i) => (
                                                        <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {!isReadOnly && (
                                            <div className="absolute top-4 right-4 z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (confirm(`Delete "${dayEntries[0].title}"?`)) {
                                                            removeEntry(dayEntries[0]._id, dateStr)
                                                        }
                                                    }}
                                                    className="p-2 bg-white/40 text-slate-500 rounded-full border border-white/60 active:bg-red-50 active:text-red-500"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 py-8">
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-3xl font-bold" style={{ color: 'rgba(45, 55, 72, 0.2)' }}>{day}</span>
                                    <span className="text-[10px] uppercase font-semibold" style={{ color: 'rgba(156, 163, 175, 0.3)' }}>{DAYS_SHORT[dayOfWeek]}</span>
                                </div>
                                {!isReadOnly && (
                                    <div className="flex flex-col items-center gap-1.5 mt-2">
                                        <div 
                                            className="w-10 h-10 rounded-full flex items-center justify-center" 
                                            style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.8)' }}
                                        >
                                            <CalIcon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400/80">Add Entry</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            } else {
                // --- WEB: Original 7-column cell ---
                days.push(
                    <div
                        key={day}
                        onClick={() => !isReadOnly && handleDateClick(day)}
                        className={`
                            aspect-[3/4] rounded-lg relative group transition-all duration-300 ${!isReadOnly ? 'cursor-pointer' : 'cursor-default'}
                            ${entryCount > 0 ? 'border-blue-500/50' : isReadOnly ? 'bg-white/5 border border-white/10' : 'bg-white/5 border border-white/10 hover:bg-white/10'}
                        `}
                    >
                        {entryCount > 0 && (
                            <>
                                {isMulti ? (
                                    <div className="absolute inset-0 flex flex-col pt-10 px-2 pb-2 bg-gradient-to-br from-gray-900 to-black rounded-lg">
                                        <div className="flex-1 flex flex-col gap-1 overflow-hidden relative z-10">
                                            {dayEntries.slice(0, 3).map((entry, idx) => (
                                                <div key={entry._id || idx} className="bg-white/10 px-2 py-1 rounded text-[10px] text-white/90 border border-white/5 truncate">
                                                    {entry.title}
                                                </div>
                                            ))}
                                            {dayEntries.length > 3 && (
                                                <div className="text-[9px] text-white/40 pl-1">+{dayEntries.length - 3} more</div>
                                            )}
                                        </div>
                                        <div className="mt-auto pt-2 border-t border-white/10">
                                            <div className="text-xs text-center font-bold text-blue-400">{entryCount} Entries</div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 overflow-hidden rounded-lg">
                                            {posterEntry ? (
                                                <>
                                                    <img
                                                        src={posterEntry.poster}
                                                        alt="Poster"
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white/20">
                                                    <CalIcon size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1">
                                            <h4 className="font-bold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
                                                {dayEntries[0].title}
                                            </h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(dayEntries[0].genres || [dayEntries[0].genre || 'General']).slice(0, 4).map(g => (
                                                    <span key={g} className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-200 border border-blue-500/20 truncate max-w-[80px]">
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className="flex">
                                                    {Array.from({ length: dayEntries[0].rating || 0 }).map((_, i) => (
                                                        <Star key={i} size={8} className="fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                </div>
                                                {dayEntries[0].rtCriticScore && (
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ml-auto ${getScoreColor(dayEntries[0].rtCriticScore)}`}>
                                                        {dayEntries[0].rtCriticScore}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {!isReadOnly && (
                                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (confirm(`Delete "${dayEntries[0].title}"?`)) {
                                                            removeEntry(dayEntries[0]._id, dateStr)
                                                        }
                                                    }}
                                                    className="p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500"
                                                >
                                                    <Trash size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {entryCount === 0 && !isReadOnly && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CalIcon className="text-white/20 w-8 h-8 mb-1" />
                                <span className="text-[10px] text-white/30 uppercase tracking-widest">Add</span>
                            </div>
                        )}

                        <span className={`absolute top-2 left-3 font-bold text-lg z-[90] pointer-events-none ${entryCount > 0 ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-white/70'}`}>
                            {day}
                        </span>
                    </div>
                )
            }
        }
        return days
    }

    // ──────────────────────────────────────────────
    // Native Perspective Background & Header (Neumorphic)
    // ──────────────────────────────────────────────
    if (isNative) {
        return (
            <div className="min-h-screen w-full relative font-sans overflow-x-hidden" style={{ background: "#ECEEF2", fontFamily: "'Montserrat', sans-serif" }}>
                {/* ── Simplified Native Header ── */}
                <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
                    <div className="flex items-center justify-between max-w-lg mx-auto">
                        <button
                            onClick={() => navigate('/genres')}
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
                            {selectedCategory ? 'Calendar' : 'My Calendar'}
                        </h1>

                        <UserBadge />
                    </div>
                </header>

                <main className="px-5 pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 90px)' }}>
                    {/* ── Page Title & Month Switcher ── */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                             <h1 className="text-2xl font-bold uppercase tracking-tight" style={{ color: '#1E293B' }}>
                                 {selectedCategory || "My Calendar"}
                             </h1>
                             <div className="flex items-center gap-3">
                                <button
                                    onClick={() => changeMonth('prev')}
                                    disabled={currentMonthIndex === 0}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                                    style={{ background: '#E8EAED', boxShadow: '3px 3px 6px rgba(180,190,210,0.4), -2px -2px 5px rgba(255,255,255,0.9)' }}
                                >
                                    <ChevronLeft size={20} style={{ color: '#4B5563' }} />
                                </button>
                                <button
                                    onClick={() => changeMonth('next')}
                                    disabled={currentMonthIndex === 11}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                                    style={{ background: '#E8EAED', boxShadow: '3px 3px 6px rgba(180,190,210,0.4), -2px -2px 5px rgba(255,255,255,0.9)' }}
                                >
                                    <ChevronRight size={20} style={{ color: '#4B5563' }} />
                                </button>
                             </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold" style={{ color: '#4F46E5' }}>{MONTHS[currentMonthIndex]}</span>
                            <span className="text-xl font-medium" style={{ color: '#9CA3AF' }}>{selectedYear}</span>
                        </div>
                        {selectedGenres.length > 0 && (
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                {selectedGenres.map(g => (
                                    <span key={g} className="text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wider" style={{ background: '#D1D5DB', color: '#4B5563' }}>
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {renderCalendarGrid()}
                    </div>
                </main>

                {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}
                
                {/* ── Entry Modal (Light Theme) ── */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:p-4">
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] px-6 pt-8 shadow-2xl overflow-y-auto max-h-[90vh] sm:max-h-[90vh]"
                                style={{ 
                                    background: '#ECEEF2', 
                                    fontFamily: "'Montserrat', sans-serif", 
                                    paddingBottom: 'calc(env(safe-area-inset-bottom, 100px) + 120px)' 
                                }}
                            >
                                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-8 opacity-50 block sm:hidden" />
                                
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold" style={{ color: '#1E293B' }}>
                                        <span style={{ color: '#4F46E5' }}>{selectedDate?.day}</span> {MONTHS[selectedDate?.monthIndex]}
                                    </h2>
                                    <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 text-slate-500 active:scale-90"><X size={20} /></button>
                                </div>

                                {/* Existing Entries */}
                                <div className="space-y-4 mb-10">
                                    {(calendarEntries[selectedDate?.dateStr] || [])
                                        .filter(entry => {
                                            if (selectedCategory && entry.category !== selectedCategory) return false
                                            if (selectedGenres.length === 0) return true
                                            const entryGenres = entry.genres || [entry.genre || 'General']
                                            return selectedGenres.some(sg => entryGenres.map(eg => eg.toLowerCase()).includes(sg.toLowerCase()))
                                        })
                                        .map((entry, i) => (
                                            <div
                                                key={entry._id}
                                                className="p-4 rounded-[32px] flex gap-4 transition-all active:scale-[0.98] group relative"
                                                style={{ background: '#E8EAED', boxShadow: 'inset 2px 2px 5px rgba(180,190,210,0.3), inset -2px -2px 5px rgba(255,255,255,0.7)' }}
                                                onClick={() => handleEditClick(entry)}
                                            >
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEditClick(entry)
                                                        }}
                                                        className="p-2 bg-white/60 text-indigo-500 rounded-full shadow-sm active:scale-90"
                                                    >
                                                        <Upload size={14} className="rotate-90" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (confirm('Delete this entry?')) {
                                                                removeEntry(entry._id, selectedDate.dateStr)
                                                            }
                                                        }}
                                                        className="p-2 bg-white/60 text-red-500 rounded-full shadow-sm active:scale-90"
                                                    >
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                                {entry.poster ? (
                                                    <img src={entry.poster} alt={entry.title} className="w-16 h-24 object-cover rounded-2xl flex-shrink-0" />
                                                ) : (
                                                    <div className="w-16 h-24 bg-white/50 rounded-2xl flex items-center justify-center text-[10px] text-center p-2 text-slate-400">No Poster</div>
                                                )}
                                                <div className="flex-1 min-w-0 pr-12">
                                                    <h4 className="font-bold text-base truncate" style={{ color: '#1E293B' }}>{entry.title}</h4>
                                                    <div className="flex flex-wrap gap-1 mt-1.5 mb-2">
                                                        {(entry.genres || [entry.genre || 'General']).map(g => (
                                                            <span key={g} className="text-[9px] bg-white/80 px-2 py-0.5 rounded-full border border-white" style={{ color: '#64748B' }}>
                                                                {g}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${entry.status === 'watched' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {entry.status}
                                                        </span>
                                                        <div className="flex">
                                                            {Array.from({ length: 5 }).map((_, starI) => (
                                                                <Star key={starI} size={11} fill={starI < entry.rating ? "#F59E0B" : "none"} className={starI < entry.rating ? "text-amber-500" : "text-slate-300"} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                <div className="border-t border-slate-200 pt-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg" style={{ color: '#475569' }}>{editingId ? "Edit Details" : "Add Entry"}</h3>
                                        {editingId && (
                                            <button
                                                onClick={() => {
                                                    setEditingId(null)
                                                    setFormData({
                                                        title: '',
                                                        status: 'watched',
                                                        rating: 0,
                                                        rtCriticScore: '',
                                                        rtAudienceScore: '',
                                                        poster: null,
                                                        genres: selectedGenres.length > 0 ? [...selectedGenres] : ['General']
                                                    })
                                                }}
                                                className="text-xs font-bold text-indigo-500 uppercase tracking-wider"
                                            >
                                                New Entry
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Title</label>
                                            <div className="relative">
                                                <input
                                                    className="w-full rounded-2xl p-4 focus:outline-none transition-all text-slate-700 font-medium"
                                                    style={{ background: '#E8EAED', boxShadow: 'inset 2px 2px 5px rgba(180,190,210,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)' }}
                                                    value={formData.title}
                                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="Enter name..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Genres</label>
                                            <div className="flex flex-wrap gap-2">
                                                {allUniqueGenres.map(g => {
                                                    const isSelected = formData.genres.some(fg => fg.toLowerCase() === g.toLowerCase());
                                                    return (
                                                        <button
                                                            key={g}
                                                            onClick={() => {
                                                                setFormData(annot => {
                                                                    const currentlySelected = annot.genres.some(fg => fg.toLowerCase() === g.toLowerCase());
                                                                    const newGenres = currentlySelected
                                                                        ? annot.genres.filter(bg => bg.toLowerCase() !== g.toLowerCase())
                                                                        : [...annot.genres, g];
                                                                    return { ...annot, genres: newGenres.length > 0 ? newGenres : ['General'] };
                                                                });
                                                            }}
                                                            className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all scale-100 active:scale-95 ${isSelected
                                                                ? 'bg-indigo-50 text-indigo-600'
                                                                : 'bg-white/60 text-slate-400'
                                                            }`}
                                                            style={{
                                                                boxShadow: isSelected 
                                                                    ? 'inset 1px 1px 3px rgba(0,0,0,0.05), inset -1px -1px 3px rgba(255,255,255,0.5)'
                                                                    : '2px 2px 4px rgba(180,190,210,0.3), -2px -2px 4px rgba(255,255,255,0.8)',
                                                                border: isSelected ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid transparent'
                                                            }}
                                                        >
                                                            {g}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Critic %</label>
                                                <input
                                                    className="w-full rounded-2xl p-4 focus:outline-none text-slate-700 font-bold"
                                                    style={{ background: '#E8EAED', boxShadow: 'inset 2px 2px 5px rgba(180,190,210,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)' }}
                                                    value={formData.rtCriticScore}
                                                    onChange={e => setFormData({ ...formData, rtCriticScore: e.target.value })}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Audience %</label>
                                                <input
                                                    className="w-full rounded-2xl p-4 focus:outline-none text-slate-700 font-bold"
                                                    style={{ background: '#E8EAED', boxShadow: 'inset 2px 2px 5px rgba(180,190,210,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)' }}
                                                    value={formData.rtAudienceScore}
                                                    onChange={e => setFormData({ ...formData, rtAudienceScore: e.target.value })}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">IMDb Link (Poster Fetch)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 rounded-2xl p-4 focus:outline-none text-slate-700 text-xs"
                                                    style={{ background: '#E8EAED', boxShadow: 'inset 2px 2px 5px rgba(180,190,210,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)' }}
                                                    value={imdbLinkValue}
                                                    onChange={e => setImdbLinkValue(e.target.value)}
                                                    placeholder="Paste URL..."
                                                />
                                                <button
                                                    onClick={() => handleFetchPoster(imdbLinkValue)}
                                                    disabled={isFetching}
                                                    className="w-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                                                    style={{ background: '#E8EAED', boxShadow: '3px 3px 6px rgba(180,190,210,0.4), -2px -2px 5px rgba(255,255,255,0.9)' }}
                                                >
                                                    <Upload size={18} className={isFetching ? 'animate-bounce' : 'text-indigo-500'} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 py-2">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Rating</label>
                                                <div className="flex gap-2 bg-white/50 p-3 rounded-2xl border border-white shadow-inner">
                                                    {[1, 2, 3, 4, 5].map(num => (
                                                        <button
                                                            key={num}
                                                            onClick={() => setFormData({ ...formData, rating: num })}
                                                            className="transition-transform active:scale-125"
                                                        >
                                                            <Star 
                                                                size={24} 
                                                                fill={num <= formData.rating ? "#F59E0B" : "none"} 
                                                                className={num <= formData.rating ? "text-amber-500" : "text-slate-300"} 
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-24">
                                                 <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Status</label>
                                                 <button
                                                     onClick={() => setFormData({ ...formData, status: formData.status === 'watched' ? 'watchlist' : 'watched' })}
                                                     className="w-full py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95"
                                                     style={{ 
                                                         background: formData.status === 'watched' ? '#DCFCE7' : '#FEF3C7',
                                                         color: formData.status === 'watched' ? '#166534' : '#92400E',
                                                         borderColor: 'transparent'
                                                     }}
                                                 >
                                                     {formData.status}
                                                 </button>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                             <button
                                                 onClick={() => setShowModal(false)}
                                                 className="flex-1 py-4 rounded-3xl text-sm font-bold uppercase tracking-widest text-slate-500 transition-all active:scale-95"
                                                 style={{ background: '#E8EAED', boxShadow: '3px 3px 6px rgba(180,190,210,0.4), -2px -2px 5px rgba(255,255,255,0.9)' }}
                                             >
                                                 Back
                                             </button>
                                             <button
                                                 onClick={handleSubmit}
                                                 className="flex-[2] py-4 rounded-3xl text-sm font-bold uppercase tracking-widest text-white transition-all active:scale-95"
                                                 style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)' }}
                                             >
                                                 {editingId ? "Update Entry" : "Save Entry"}
                                             </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // ──────────────────────────────────────────────
    // Web Perspective (Original Dark Design)
    // ──────────────────────────────────────────────
    return (
        <div className="min-h-screen w-full relative text-white font-sans overflow-x-hidden " style={{ background: "linear-gradient(160deg, #0c0c1d 0%, #0a0a14 30%, #08080f 60%, #0d0d1a 100%)" }}>
            {/* Background */}
            {isNative ? (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    {/* Grain texture */}
                    <div className="absolute inset-0" style={{
                        opacity: 0.015,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="1"/%3E%3C/svg%3E")`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "128px 128px",
                    }} />
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2" style={{ background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.03) 0%, transparent 70%)", filter: "blur(80px)" }} />
                    <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2" style={{ background: "radial-gradient(ellipse, rgba(200, 210, 255, 0.02) 0%, transparent 70%)", filter: "blur(80px)" }} />
                </div>
            ) : (
                <Suspense fallback={<div className="fixed inset-0 z-0 bg-[#121212]" />}>
                    <Background3D />
                </Suspense>
            )}

            {/* Header */}
            <header className="px-4 md:px-8 py-4 md:py-6 border-b border-white/10 backdrop-blur-md sticky top-0 z-20 bg-black/50" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
                <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 tracking-wide flex flex-wrap items-baseline gap-2 md:gap-3 uppercase">
                            <span>{selectedCategory ? `${selectedCategory}` : "My Calendar"}</span>
                            <span className="text-white/50 text-lg md:text-2xl font-light">| {MONTHS[currentMonthIndex]} {selectedYear}</span>
                        </h1>
                        {selectedGenres.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {selectedGenres.map(g => (
                                    <span key={g} className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/70 border border-white/20 uppercase tracking-wider">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => changeMonth('prev')}
                            disabled={currentMonthIndex === 0}
                            className="flex items-center px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-full text-sm font-medium transition-colors border border-white/10 backdrop-blur-sm"
                        >
                            <ChevronLeft size={16} className="mr-1" /> Prev
                        </button>
                        <button
                            onClick={() => changeMonth('next')}
                            disabled={currentMonthIndex === 11}
                            className="flex items-center px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-full text-sm font-medium transition-colors border border-white/10 backdrop-blur-sm"
                        >
                            Next <ChevronRight size={16} className="ml-1" />
                        </button>
                    </div>
                </div>
            </header>

            <main className={`${isNative ? 'px-3 pt-4' : 'p-4 md:p-8 pb-20 container mx-auto'}`}>
                {isNative ? (
                    /* --- NATIVE: 2-column large card grid --- */
                    <div className="grid grid-cols-2 gap-3">
                        {renderCalendarGrid()}
                    </div>
                ) : (
                    /* --- WEB: Traditional 7-column calendar --- */
                    <div className="bg-black/40 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 mb-4 border-b border-white/5 pb-4">
                            {DAYS_OF_WEEK.map(day => (
                                <div key={day} className="text-center text-blue-400/70 font-bold uppercase text-[10px] md:text-xs tracking-widest py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-4">
                            {renderCalendarGrid()}
                        </div>
                    </div>
                )}
            </main>

            {/* Entry Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a1a] border border-white/20 p-6 md:p-8 rounded-2xl md:rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <button onClick={() => setShowModal(false)} className="absolute top-4 md:top-6 right-4 md:right-6 text-white/50 hover:text-white"><X /></button>

                            <h2 className="text-xl md:text-2xl font-bold mb-6">
                                {selectedDate?.day} {MONTHS[selectedDate?.monthIndex]}
                            </h2>

                            {/* Existing Entries */}
                            <div className="space-y-4 mb-8">
                                {(calendarEntries[selectedDate?.dateStr] || [])
                                    .filter(entry => {
                                        if (selectedCategory && entry.category !== selectedCategory) return false
                                        if (selectedGenres.length === 0) return true
                                        const entryGenres = entry.genres || [entry.genre || 'General']
                                        return selectedGenres.some(sg => entryGenres.map(eg => eg.toLowerCase()).includes(sg.toLowerCase()))
                                    })
                                    .map((entry, i) => (
                                        <div
                                            key={entry._id}
                                            className="bg-white/5 p-4 rounded-xl flex gap-4 hover:bg-white/10 transition-colors cursor-pointer group relative"
                                            onClick={() => handleEditClick(entry)}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditClick(entry)
                                                }}
                                                className="absolute top-2 right-10 p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                            >
                                                <Upload size={14} className="rotate-90" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm('Delete this entry?')) {
                                                        removeEntry(entry._id, selectedDate.dateStr)
                                                    }
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                            >
                                                <Trash size={14} />
                                            </button>
                                            {entry.poster ? (
                                                <img src={entry.poster} alt={entry.title} className="w-16 h-24 object-cover rounded-md" />
                                            ) : (
                                                <div className="w-16 h-24 bg-white/10 rounded-md flex items-center justify-center text-xs text-center">No Poster</div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-lg pr-6">{entry.title}</h4>
                                                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                                    {(entry.genres || [entry.genre || 'General']).map(g => (
                                                        <span key={g} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/70 border border-white/20">
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-white/70">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${entry.status === 'watched' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {entry.status}
                                                    </span>
                                                    <div className="flex">
                                                        {Array.from({ length: 5 }).map((_, starI) => (
                                                            <Star key={starI} size={12} fill={starI < entry.rating ? "currentColor" : "none"} className={starI < entry.rating ? "text-yellow-400" : "text-gray-600"} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex mt-2 gap-3">
                                                    {(entry.rtCriticScore || entry.rottenTomatoesScore) && (
                                                        <span className={`text-[10px] flex items-center gap-1 font-bold px-1.5 py-0.5 rounded border ${getScoreColor(entry.rtCriticScore || entry.rottenTomatoesScore)}`}>
                                                            {entry.rtCriticScore || entry.rottenTomatoesScore}%
                                                        </span>
                                                    )}
                                                    {entry.rtAudienceScore && (
                                                        <span className="text-[10px] flex items-center gap-1 text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 font-bold">
                                                            {entry.rtAudienceScore}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white/80">{editingId ? "Edit Entry" : "Add New Entry"}</h3>
                                    {editingId && (
                                        <button
                                            onClick={() => {
                                                setEditingId(null)
                                                setFormData({
                                                    title: '',
                                                    status: 'watched',
                                                    rating: 0,
                                                    rtCriticScore: '',
                                                    rtAudienceScore: '',
                                                    poster: null,
                                                    genres: selectedGenres.length > 0 ? [...selectedGenres] : ['General']
                                                })
                                            }}
                                            className="text-xs text-white/50 hover:text-white"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase text-white/50 mb-1">Title</label>
                                        <input
                                            className="w-full bg-black/50 border border-white/20 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Movie or Series Name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs uppercase text-white/50 mb-2">Genres</label>
                                        <div className="flex flex-wrap gap-2">
                                            {allUniqueGenres.map(g => {
                                                const isSelected = formData.genres.some(fg => fg.toLowerCase() === g.toLowerCase())
                                                return (
                                                    <button
                                                        key={g}
                                                        onClick={() => {
                                                            setFormData(annot => {
                                                                const currentlySelected = annot.genres.some(fg => fg.toLowerCase() === g.toLowerCase())
                                                                const newGenres = currentlySelected
                                                                    ? annot.genres.filter(bg => bg.toLowerCase() !== g.toLowerCase())
                                                                    : [...annot.genres, g]
                                                                return { ...annot, genres: newGenres }
                                                            })
                                                        }}
                                                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isSelected
                                                            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30 shadow-lg'
                                                            : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {g}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs uppercase text-white/50 mb-1">Status</label>
                                            <select
                                                className="w-full bg-black/50 border border-white/20 rounded-xl p-3 focus:outline-none focus:border-blue-500 appearance-none text-white"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="watched">Watched</option>
                                                <option value="watching">Watching</option>
                                                <option value="upcoming">Upcoming</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase text-white/50 mb-1">Rating</label>
                                            <div className="flex items-center gap-1 bg-black/50 border border-white/20 rounded-xl p-3">
                                                {[1, 2, 3, 4, 5].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setFormData({ ...formData, rating: i + 1 })}
                                                        className="focus:outline-none"
                                                    >
                                                        <Star
                                                            size={16}
                                                            fill={i < formData.rating ? "currentColor" : "none"}
                                                            className={i < formData.rating ? "text-yellow-400" : "text-gray-600 hover:text-gray-400"}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs uppercase text-white/50 mb-2">Scores (Auto-Fetched)</label>
                                        <div className="flex gap-4 p-3 bg-black/50 border border-white/20 rounded-xl min-h-[50px] items-center">
                                            {formData.rtCriticScore ? (
                                                <span className={`flex items-center gap-2 font-bold px-3 py-1 rounded border ${getScoreColor(formData.rtCriticScore)}`}>
                                                    {formData.rtCriticScore}% (Critic)
                                                </span>
                                            ) : (
                                                <span className="text-white/30 text-xs italic">No Critic Score</span>
                                            )}
                                            {formData.rtAudienceScore ? (
                                                <span className="flex items-center gap-2 text-orange-400 font-bold bg-orange-500/10 px-3 py-1 rounded border border-orange-500/20">
                                                    {formData.rtAudienceScore}% (Audience)
                                                </span>
                                            ) : (
                                                <span className="text-white/30 text-xs italic">No Audience Score</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs uppercase text-white/50 mb-1">Paste IMDb Link</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-black/50 border border-white/20 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-sm"
                                                placeholder="https://www.imdb.com/title/tt..."
                                                value={imdbLinkValue}
                                                onChange={(e) => setImdbLinkValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFetchPoster(imdbLinkValue)
                                                }}
                                            />
                                            <button
                                                onClick={() => handleFetchPoster(imdbLinkValue)}
                                                disabled={isFetching}
                                                className="bg-blue-600/20 hover:bg-blue-600/40 disabled:opacity-50 text-blue-400 px-4 rounded-xl text-sm font-medium transition-colors"
                                            >
                                                {isFetching ? "..." : "Fetch"}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs uppercase text-white/50 mb-1">Poster (Manual)</label>
                                        <div className="flex items-center gap-4">
                                            {formData.poster && (
                                                <img src={formData.poster} className="h-20 w-14 object-cover rounded border border-white/20" />
                                            )}
                                            <label className="flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                                                <Upload size={16} />
                                                <span className="text-sm">Upload Image</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-6 transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        {editingId ? "Update Entry" : "Save Entry"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Long Press Detail Modal Overlay */}
            <AnimatePresence>
                {longPressData && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center px-4" 
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setLongPressData(null)
                        }}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-[340px] rounded-[32px] overflow-hidden relative flex flex-col max-h-[80vh]"
                            style={{ 
                                background: '#F8F9FA',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-200/60 bg-white/50">
                                <h3 className="text-lg font-bold" style={{ color: '#2D3748' }}>
                                    {longPressData.entries.length} Entries on {longPressData.day}
                                </h3>
                                <button onClick={() => setLongPressData(null)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                                    <X size={18} color="#4A5568" />
                                </button>
                            </div>
                            
                            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
                                {longPressData.entries.map((entry, idx) => (
                                    <div key={entry._id || idx} className="flex gap-4 p-3 rounded-2xl bg-white shadow-sm border border-gray-100/80">
                                        <div className="w-16 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                                            {entry.poster ? (
                                                <img src={entry.poster} alt={entry.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                                    <CalIcon size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                                            <h4 className="font-bold text-[15px] leading-tight mb-2 text-slate-800 line-clamp-2">{entry.title}</h4>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${entry.status === 'watched' ? 'bg-green-100 text-green-700' : entry.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {entry.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 mt-auto">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} className={i < (entry.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
