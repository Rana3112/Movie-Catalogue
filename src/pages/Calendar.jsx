import { lazy, Suspense } from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { X, Star, Upload, Calendar as CalIcon, ChevronLeft, ChevronRight, Trash, Share2, LayoutGrid, Settings, LogOut, Clapperboard, Eye, ChevronDown, Link2, Save } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import { useNavigate } from 'react-router-dom'
import { useIsMobile, shouldUseNeumorphicLayout } from '../lib/platform'
import {
    netflixNeumorphic,
    netflixRaisedStyle,
    netflixRedButtonStyle,
    netflixSurfaceStyle,
    netflixInsetStyle,
    nativeFastPageStyle,
    nativeFastRaisedStyle,
    nativeFastInsetStyle,
    nativeFastRedButtonStyle,
} from '../styles/netflixNeumorphic'

// Lazy import - only fetched on web
const Background3D = lazy(() => import('../components/canvas/Background3D'))

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "TV Movie", "Thriller", "War", "Western", "General"]
const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'

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

export default function Calendar() {
    const isMobile = useIsMobile()
    const isNative = isMobile
    const useDesktopNeumorphic = shouldUseNeumorphicLayout() && !isMobile

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
        addEntry, removeEntry, updateEntry, fetchEntries,
        customGenres, fetchCustomGenres, selectedMonth, setSelectedMonth,
        isGuest, cineBotPendingEntry, clearCineBotPendingEntry,
    } = useStore()

    const navigate = useNavigate()
    const [showSettings, setShowSettings] = useState(false)
    const isReadOnly = !selectedCategory
    const [currentMonthIndex, setCurrentMonthIndex] = useState((selectedMonth !== null && selectedMonth >= 0 && selectedMonth <= 11) ? selectedMonth : 0)

    const [longPressData, setLongPressData] = useState(null)
    const longPressRef = useRef(false)
    const pressTimer = useRef(null)
    const pressStartRef = useRef({ x: 0, y: 0 })

    const handlePointerDown = (event, day, entries) => {
        longPressRef.current = false;
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressStartRef.current = { x: event.clientX || 0, y: event.clientY || 0 }
        pressTimer.current = setTimeout(() => {
            longPressRef.current = true;
            setLongPressData({ day, entries });
        }, 550);
    }

    const clearPress = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null
    }

    const handlePointerMove = (event) => {
        const start = pressStartRef.current
        if (Math.abs((event.clientX || 0) - start.x) > 10 || Math.abs((event.clientY || 0) - start.y) > 10) {
            clearPress()
        }
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

    const allUniqueGenres = useMemo(() => {
        const uniqueMap = new Map();
        const sources = [...GENRES, ...(Array.isArray(customGenres) ? customGenres : []).map(cg => cg?.name).filter(n => typeof n === 'string'), ...selectedGenres];
        sources.forEach(g => {
            const lower = g.toLowerCase();
            if (!uniqueMap.has(lower) || GENRES.includes(g)) {
                uniqueMap.set(lower, g);
            }
        });
        return Array.from(uniqueMap.values());
    }, [customGenres, selectedGenres]);

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
                category: cineBotPendingEntry.category || selectedCategory || 'Movies',
                genres: (cineBotPendingEntry.genres || selectedGenres).length > 0 ? [...(cineBotPendingEntry.genres || selectedGenres)] : ['General'],
                year: cineBotPendingEntry.year,
                description: cineBotPendingEntry.description || null,
                imdbLink: cineBotPendingEntry.imdbLink || null,
            })
            if (cineBotPendingEntry.imdbLink) {
                setImdbLinkValue(cineBotPendingEntry.imdbLink)
                setTimeout(() => {
                    handleFetchPoster(cineBotPendingEntry.imdbLink)
                }, 500)
            }
            clearCineBotPendingEntry()
        }
    }, [cineBotPendingEntry, clearCineBotPendingEntry, selectedGenres, setSelectedMonth])

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
    const neumorphicRaisedStyle = useDesktopNeumorphic ? netflixRaisedStyle : undefined
    const neumorphicInsetStyle = useDesktopNeumorphic ? netflixInsetStyle : undefined

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
            category: selectedCategory || 'Movies',
            year: selectedYear,
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

    const handleShareCalendar = async () => {
        const userEmail = useStore.getState().user?.email
        if (!userEmail || isGuest) {
            alert('Sign in to create a shareable calendar link.')
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/calendar/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Share link failed')
            const shareUrl = `${window.location.origin}/shared/${data.token}`
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl)
                alert('Shared calendar link copied. It expires in 30 days.')
            } else {
                window.prompt('Copy this shared calendar link:', shareUrl)
            }
        } catch (error) {
            console.error('Share calendar failed:', error)
            alert(`Could not create share link: ${error.message}`)
        }
    }

    const handleFetchPoster = async (link, isAutoFetch = false) => {
        if (!link) return
        setIsFetching(true)
        try {
            let newTitle = null
            let posterUrl = null
            const imdbIdMatch = link.match(/tt\d+/)
            const imdbId = imdbIdMatch ? imdbIdMatch[0] : null
            const omdbKey = import.meta.env.VITE_OMDB_API_KEY

            // 1. Try OMDB API directly first (fastest, CORS-friendly, no proxy needed)
            if (omdbKey && imdbId) {
                try {
                    const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`)
                    if (omdbRes.ok) {
                        const omdbData = await omdbRes.json()
                        if (omdbData.Response === 'True') {
                            if (omdbData.Poster && omdbData.Poster !== 'N/A') {
                                posterUrl = omdbData.Poster
                            }
                            if (omdbData.Title && omdbData.Title !== 'N/A') {
                                newTitle = omdbData.Title
                            }
                            if (omdbData.Ratings) {
                                const rt = omdbData.Ratings.find(r => r.Source === "Rotten Tomatoes")
                                if (rt) {
                                    const rtScoreFromOMDB = rt.Value.replace('%', '')
                                    setFormData(prev => ({ ...prev, rtCriticScore: rtScoreFromOMDB }))
                                }
                            }

                            // Rotten Tomatoes scraping (Fallback for Critic, Primary for Audience)
                            if (omdbData.Title || newTitle) {
                                try {
                                    const movieTitle = omdbData.Title || newTitle
                                    const slug = movieTitle.toLowerCase()
                                        .replace(/[^a-z0-9\s-]/g, '')
                                        .replace(/\s+/g, '_')
                                    const rtUrl = `https://www.rottentomatoes.com/m/${slug}`
                                    const rtProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(rtUrl)}`
                                    
                                    fetch(rtProxy).then(res => res.text()).then(html => {
                                        let updates = {}
                                        const audMatch = html.match(/audience-score="(\d+)"/)
                                        if (audMatch && audMatch[1]) {
                                            updates.rtAudienceScore = audMatch[1]
                                        }
                                        const criticMatch = html.match(/tomatometerscore="(\d+)"/)
                                        if (criticMatch && criticMatch[1]) {
                                            updates.rtCriticScore = criticMatch[1]
                                        }
                                        if (Object.keys(updates).length > 0) {
                                            setFormData(prev => ({ ...prev, ...updates }))
                                        }
                                    }).catch(e => console.log("RT Scrape background check failed", e))
                                } catch (e) {
                                    console.log("RT URL generation failed", e)
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.warn("OMDB direct fetch failed", err)
                }
            }

            // 2. If posterUrl still missing, try IMDb suggestion endpoint via proxy
            if (!posterUrl && imdbId) {
                const apiEndpoint = `https://v2.sg.media-imdb.com/suggestion/${imdbId[0]}/${imdbId}.json`
                const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiEndpoint)}`
                try {
                    const apiRes = await fetch(proxyUrl)
                    if (apiRes.ok) {
                        const data = await apiRes.json()
                        const result = data.d?.find(item => item.id === imdbId)
                        if (result) {
                            if (result.i?.imageUrl) posterUrl = result.i.imageUrl
                            if (result.l && !newTitle) newTitle = result.l
                        }
                    }
                } catch (e) {
                    console.warn("IMDb suggestion proxy failed", e)
                }
            }

            // 3. Fallback: Page scraping via proxy
            if (!posterUrl && !newTitle) {
                try {
                    const scrapeProxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(link)}`
                    const response = await fetch(scrapeProxyUrl)
                    if (response.ok) {
                        const html = await response.text()
                        const parser = new DOMParser()
                        const doc = parser.parseFromString(html, 'text/html')
                        posterUrl = doc.querySelector('meta[property="og:image"]')?.content
                        newTitle = doc.querySelector('meta[property="og:title"]')?.content?.replace(' - IMDb', '') || doc.title.replace(' - IMDb', '')
                    }
                } catch (e) {
                    console.warn("Scrape proxy failed", e)
                }
            }

            if (posterUrl || newTitle) {
                setFormData(prev => ({
                    ...prev,
                    poster: posterUrl || prev.poster || null,
                    title: newTitle || prev.title
                }))
                if (!posterUrl && !isAutoFetch) {
                    alert('Poster not found, but Title extracted. Entry will use blank background.')
                }
            } else {
                if (!isAutoFetch) {
                    alert('Could not find a poster image or title. IMDb may be blocking access.')
                }
            }
        } catch (error) {
            console.error('handleFetchPoster error:', error)
            if (!isAutoFetch) {
                alert('Failed to fetch. Try manually uploading.')
            }
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

    const getEntrySummary = (entry) => {
        const savedSummary = entry.description || entry.overview || entry.summary || entry.notes
        if (savedSummary) return savedSummary

        const genres = (entry.genres || [entry.genre || 'General']).filter(Boolean)
        const status = entry.status || 'unspecified'
        const category = entry.category || selectedCategory || 'Title'
        return `${category} marked as ${status}${genres.length ? ` in ${genres.slice(0, 3).join(', ')}` : ''}.`
    }

    const renderRatingStars = (rating = 0, size = 12) => (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, starI) => (
                <Star
                    key={starI}
                    size={size}
                    fill={starI < Number(rating || 0) ? '#F59E0B' : 'none'}
                    className={starI < Number(rating || 0) ? 'text-amber-500' : 'text-slate-300'}
                />
            ))}
        </div>
    )

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentMonthIndex, selectedYear)
        const firstDay = getFirstDayOfMonth(currentMonthIndex, selectedYear)
        const days = []

        if (!isNative) {
            // --- WEB: 7-column calendar with poster-shaped day cards ---
            for (let i = 0; i < firstDay; i++) {
                days.push(
                    <div
                        key={`empty-${i}`}
                        className={useDesktopNeumorphic ? 'aspect-[2/3] rounded-[28px] opacity-45' : 'aspect-[3/4] bg-white/5 border border-white/5 rounded-lg opacity-20'}
                        style={useDesktopNeumorphic ? netflixRaisedStyle : undefined}
                    />
                )
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
                        onPointerDown={(event) => handlePointerDown(event, day, dayEntries)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={clearPress}
                        onPointerLeave={clearPress}
                        onPointerCancel={clearPress}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`
                            relative group rounded-[28px] overflow-hidden flex flex-col
                            select-none active:scale-[0.99]
                            ${!isReadOnly ? 'cursor-pointer' : 'cursor-default'}
                        `}
                        style={{ 
                            minHeight: 204,
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            touchAction: 'pan-y',
                            contain: 'layout paint style',
                            contentVisibility: 'auto',
                            containIntrinsicSize: '204px',
                            transform: 'translateZ(0)',
                            WebkitBackfaceVisibility: 'hidden',
                            ...nativeFastRaisedStyle,
                        }}
                    >
                        {entryCount > 0 ? (
                            <>
                                {isMulti ? (
                                    <div className="flex flex-col h-full bg-black/15">
                                        <div className="relative z-10 flex flex-col h-full p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-2xl font-bold" style={{ color: netflixNeumorphic.text }}>{day}</span>
                                                    <span className="text-[10px] uppercase font-bold" style={{ color: netflixNeumorphic.muted, letterSpacing: '0.1em' }}>{DAYS_SHORT[dayOfWeek]}</span>
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
                                                                boxShadow: '0 4px 10px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.1)',
                                                                background: netflixNeumorphic.panelSoft
                                                            }}
                                                        >
                                                            {entry.poster ? (
                                                                <img src={entry.poster} alt={entry.title || 'Poster'} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                                            ) : (
                                                                 <div className="w-full h-full flex items-center justify-center text-neutral-500">
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
                                                        background: 'rgba(229,9,20,0.14)',
                                                        boxShadow: '0 3px 8px rgba(229,9,20,0.14)',
                                                        border: '1px solid rgba(229,9,20,0.34)'
                                                    }}
                                                >
                                                    <span className="text-xs font-bold" style={{ color: netflixNeumorphic.text }}>{entryCount} Entries</span>
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
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center" style={{ background: netflixNeumorphic.panelSoft, color: netflixNeumorphic.muted }}>
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
                                                    className="p-2 bg-black/70 text-red-400 rounded-full border border-white/10 active:bg-red-500/20"
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
                                    <span className="text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.22)' }}>{day}</span>
                                    <span className="text-[10px] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.18)' }}>{DAYS_SHORT[dayOfWeek]}</span>
                                </div>
                                {!isReadOnly && (
                                    <div className="flex flex-col items-center gap-1.5 mt-2">
                                        <div 
                                            className="w-10 h-10 rounded-full flex items-center justify-center" 
                                            style={nativeFastInsetStyle}
                                        >
                                            <CalIcon className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Add Entry</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            } else {
                // --- WEB: 7-column poster-style day card ---
                days.push(
                    <div
                        key={day}
                        onClick={() => !isReadOnly && handleDateClick(day)}
                        className={useDesktopNeumorphic
                            ? `aspect-[2/3] rounded-[28px] relative group transition-all duration-300 ${isMulti ? 'overflow-visible z-10 hover:z-[120]' : 'overflow-hidden'} ${!isReadOnly ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'}`
                            : `
                                aspect-[3/4] rounded-lg relative group transition-all duration-300 ${!isReadOnly ? 'cursor-pointer' : 'cursor-default'}
                                ${entryCount > 0 ? 'border-blue-500/50' : isReadOnly ? 'bg-white/5 border border-white/10' : 'bg-white/5 border border-white/10 hover:bg-white/10'}
                            `
                        }
                        style={useDesktopNeumorphic ? {
                            ...netflixRaisedStyle,
                            boxShadow: entryCount > 0 ? netflixNeumorphic.raisedShadow : netflixNeumorphic.softShadow,
                            border: entryCount > 0 ? `1px solid ${netflixNeumorphic.borderStrong}` : `1px solid ${netflixNeumorphic.border}`,
                        } : undefined}
                    >
                        {entryCount > 0 && (
                            <>
                                {useDesktopNeumorphic && isMulti ? (
                                    <div className="absolute inset-0 flex flex-col p-4">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold text-white">{day}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">{DAYS_SHORT[dayOfWeek]}</span>
                                        </div>

                                        <div className="relative flex-1 flex items-center justify-center">
                                            {dayEntries.slice(0, 3).map((entry, idx) => {
                                                const rotation = idx === 0 ? '-8deg' : idx === 1 ? '4deg' : '11deg'
                                                const translateX = idx === 0 ? '-18px' : idx === 1 ? '8px' : '26px'
                                                const translateY = idx === 1 ? '-10px' : '8px'
                                                return (
                                                    <div
                                                        key={entry._id || idx}
                                                        className="absolute rounded-2xl overflow-hidden bg-neutral-900"
                                                        style={{
                                                            width: '48%',
                                                            aspectRatio: '2/3',
                                                            transform: `translate(${translateX}, ${translateY}) rotate(${rotation})`,
                                                            zIndex: 10 - idx,
                                                            boxShadow: '0 12px 20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12)',
                                                        }}
                                                    >
                                                        {entry.poster ? (
                                                            <img src={entry.poster} alt={entry.title} className="w-full h-full object-cover" loading="lazy" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                                                <CalIcon size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="flex justify-center">
                                            <span
                                                className="px-4 py-1.5 rounded-full text-xs font-bold text-white"
                                                style={netflixRedButtonStyle}
                                            >
                                                {entryCount} Entries
                                            </span>
                                        </div>
                                        <div
                                            className={`calendar-multi-entry-preview pointer-events-none absolute top-1/2 hidden w-[380px] -translate-y-1/2 group-hover:block group-hover:pointer-events-auto ${
                                                dayOfWeek >= 5 ? 'right-[calc(100%+16px)]' : 'left-[calc(100%+16px)]'
                                            }`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div
                                                className="rounded-[28px] p-4"
                                                style={{
                                                    background: 'rgba(24,24,27,0.96)',
                                                    boxShadow: '18px 18px 42px rgba(0,0,0,0.55), -8px -8px 22px rgba(255,255,255,0.03)',
                                                    border: `1px solid ${netflixNeumorphic.border}`,
                                                    backdropFilter: 'blur(16px)',
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                                    <div>
                                                        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                                                            {DAYS_SHORT[dayOfWeek]}, {MONTHS[currentMonthIndex]} {day}
                                                        </p>
                                                        <h4 className="m-0 mt-1 text-lg font-extrabold text-white">
                                                            {entryCount} Entries
                                                        </h4>
                                                    </div>
                                                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-red-400 border border-red-500/20">
                                                        Hover Preview
                                                    </span>
                                                </div>

                                                <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                                                    {dayEntries.map((entry, entryIndex) => {
                                                        const genres = (entry.genres || [entry.genre || 'General']).filter(Boolean)
                                                        const criticScore = entry.rtCriticScore || entry.rottenTomatoesScore
                                                        return (
                                                            <div
                                                                key={entry._id || `${dateStr}-${entryIndex}`}
                                                                className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-3xl p-3"
                                                                style={{
                                                                    ...netflixInsetStyle,
                                                                }}
                                                            >
                                                                <div className="h-24 w-16 overflow-hidden rounded-2xl bg-neutral-900">
                                                                    {entry.poster ? (
                                                                        <img src={entry.poster} alt={entry.title} className="h-full w-full object-cover" loading="lazy" />
                                                                    ) : (
                                                                        <div className="flex h-full w-full items-center justify-center text-neutral-500">
                                                                            <CalIcon size={22} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h5 className="m-0 line-clamp-2 text-sm font-extrabold leading-snug text-white">
                                                                            {entry.title}
                                                                        </h5>
                                                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                                                            entry.status === 'watched'
                                                                                ? 'bg-green-100 text-green-700'
                                                                                : entry.status === 'watching'
                                                                                    ? 'bg-sky-100 text-sky-700'
                                                                                    : 'bg-amber-100 text-amber-700'
                                                                        }`}>
                                                                            {entry.status || 'Saved'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-neutral-400">
                                                                        <span>{entry.category || selectedCategory || 'Calendar'}</span>
                                                                        {renderRatingStars(entry.rating, 11)}
                                                                        {criticScore && (
                                                                            <span className={`rounded-full border px-2 py-0.5 ${getScoreColor(criticScore)}`}>
                                                                                Critic {criticScore}%
                                                                            </span>
                                                                        )}
                                                                        {entry.rtAudienceScore && (
                                                                            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-orange-500">
                                                                                Audience {entry.rtAudienceScore}%
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {genres.length > 0 && (
                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                            {genres.slice(0, 4).map(g => (
                                                                                <span key={g} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-400">
                                                                                    {g}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neutral-400">
                                                                        {getEntrySummary(entry)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : isMulti ? (
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
                                ) : useDesktopNeumorphic ? (
                                    <>
                                        <div className="absolute inset-0 overflow-hidden rounded-[28px]">
                                            {posterEntry ? (
                                                <>
                                                    <img
                                                        src={posterEntry.poster}
                                                        alt={dayEntries[0].title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <CalIcon size={34} strokeWidth={1.5} />
                                                </div>
                                            )}
                                        </div>

                                        <div className={`absolute top-4 left-4 z-10 flex items-baseline gap-1.5 ${posterEntry ? 'text-white' : 'text-neutral-300'}`}>
                                            <span className="text-2xl font-bold drop-shadow-sm">{day}</span>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest ${posterEntry ? 'text-white/70' : 'text-neutral-500'}`}>{DAYS_SHORT[dayOfWeek]}</span>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                                            <h4 className={`font-bold text-sm leading-tight line-clamp-2 ${posterEntry ? 'text-white drop-shadow-lg' : 'text-white'}`}>
                                                {dayEntries[0].title}
                                            </h4>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {(dayEntries[0].genres || [dayEntries[0].genre || 'General']).slice(0, 2).map(g => (
                                                    <span
                                                        key={g}
                                                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide truncate max-w-[82px] ${
                                                            posterEntry ? 'bg-white/18 text-white/80 border border-white/20 backdrop-blur-sm' : 'bg-white/5 text-neutral-400 border border-white/10'
                                                        }`}
                                                    >
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {!isReadOnly && (
                                            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (confirm(`Delete "${dayEntries[0].title}"?`)) {
                                                            removeEntry(dayEntries[0]._id, dateStr)
                                                        }
                                                    }}
                                                    className="p-2 rounded-full text-red-400 bg-black/70 border border-white/10 shadow-sm"
                                                >
                                                    <Trash size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </>
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

                        {entryCount === 0 && useDesktopNeumorphic && (
                            <div className="absolute inset-0 flex flex-col">
                                <div className="p-4 flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold text-neutral-500">{day}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600">{DAYS_SHORT[dayOfWeek]}</span>
                                </div>
                                {!isReadOnly && (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-6 opacity-55 group-hover:opacity-100 transition-opacity">
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center"
                                            style={netflixInsetStyle}
                                        >
                                            <CalIcon className="w-5 h-5 text-neutral-500" strokeWidth={1.6} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Add Entry</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {entryCount === 0 && !useDesktopNeumorphic && !isReadOnly && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CalIcon className="text-white/20 w-8 h-8 mb-1" />
                                <span className="text-[10px] text-white/30 uppercase tracking-widest">Add</span>
                            </div>
                        )}

                        {!useDesktopNeumorphic && (
                            <span className={`absolute top-2 left-3 font-bold text-lg z-[90] pointer-events-none ${entryCount > 0 ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-white/70'}`}>
                                {day}
                            </span>
                        )}
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
            <div className="min-h-screen w-full relative font-sans overflow-x-hidden text-white" style={{ ...nativeFastPageStyle, fontFamily: "'Montserrat', sans-serif" }}>
                {/* ── Simplified Native Header ── */}
                <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
                    <div className="flex items-center justify-between max-w-lg mx-auto">
                        <button
                            onClick={() => navigate('/genres')}
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
                            style={{ 
                                ...nativeFastRaisedStyle,
                                cursor: 'pointer'
                            }}
                        >
                            <ChevronLeft size={22} style={{ color: netflixNeumorphic.textSoft }} />
                        </button>
                        
                        <h1 style={{ fontSize: 18, fontWeight: 700, color: netflixNeumorphic.text, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                            {selectedCategory ? 'Calendar' : 'My Calendar'}
                        </h1>

                        <UserBadge />
                    </div>
                </header>

                <main className="px-5 pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 90px)' }}>
                    {/* ── Page Title & Month Switcher ── */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                             <h1 className="text-2xl font-bold uppercase tracking-tight" style={{ color: netflixNeumorphic.text }}>
                                 {selectedCategory || "My Calendar"}
                             </h1>
                             <div className="flex items-center gap-3">
                                {!isGuest && (
                                    <button
                                        onClick={handleShareCalendar}
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                                        style={nativeFastRaisedStyle}
                                        aria-label="Share calendar"
                                    >
                                        <Share2 size={18} style={{ color: netflixNeumorphic.textSoft }} />
                                    </button>
                                )}
                                <button
                                    onClick={() => changeMonth('prev')}
                                    disabled={currentMonthIndex === 0}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                                    style={nativeFastRaisedStyle}
                                >
                                    <ChevronLeft size={20} style={{ color: netflixNeumorphic.textSoft }} />
                                </button>
                                <button
                                    onClick={() => changeMonth('next')}
                                    disabled={currentMonthIndex === 11}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                                    style={nativeFastRaisedStyle}
                                >
                                    <ChevronRight size={20} style={{ color: netflixNeumorphic.textSoft }} />
                                </button>
                             </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold" style={{ color: netflixNeumorphic.red }}>{MONTHS[currentMonthIndex]}</span>
                            <span className="text-xl font-medium" style={{ color: netflixNeumorphic.textSoft }}>{selectedYear}</span>
                        </div>
                        {selectedGenres.length > 0 && (
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                {selectedGenres.map(g => (
                                    <span key={g} className="text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wider" style={{ background: 'rgba(229,9,20,0.16)', color: netflixNeumorphic.text, border: `1px solid ${netflixNeumorphic.borderStrong}` }}>
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

                {/* ── Entry Modal (Cyberpunk AAA HUD Theme) ── */}
                <AnimatePresence>
                    {showModal && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-hidden"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setShowModal(false)
                            }}
                        >
                            {/* Volumetric Red Ambient Glow */}
                            <div className="absolute w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />

                            <Motion.div
                                initial={{ scale: 0.94, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.94, opacity: 0 }}
                                className="w-full max-w-[850px] rounded-[28px] bg-[#0a0a0c]/95 border border-red-500/50 p-5 sm:p-7 text-white shadow-[0_0_50px_rgba(255,0,0,0.35),inset_0_0_20px_rgba(255,0,0,0.1)] relative overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans"
                            >
                                {/* Background Scanline Grid Texture */}
                                <div className="absolute inset-0 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none rounded-[28px]" />

                                {/* Close Button */}
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-5 right-5 w-11 h-11 rounded-full border border-red-500/40 bg-black/60 text-white flex items-center justify-center hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:rotate-90 transition-all duration-300 z-30 group"
                                >
                                    <X size={20} className="text-white/80 group-hover:text-white" />
                                </button>

                                {/* Header Date & Month */}
                                <div className="flex items-baseline mb-2 shrink-0">
                                    <span className="text-4xl md:text-5xl font-black text-red-500 drop-shadow-[0_0_16px_rgba(239,68,68,0.9)] tracking-tight">
                                        {selectedDate?.day || 12}
                                    </span>
                                    <span className="text-4xl md:text-5xl font-black text-white ml-3 tracking-tight">
                                        {MONTHS[selectedDate?.monthIndex] || 'March'}
                                    </span>
                                </div>

                                {/* Glowing Red Divider */}
                                <div className="w-full h-[1px] bg-gradient-to-r from-red-500/50 via-red-500/20 to-transparent my-3 shadow-[0_0_10px_rgba(239,68,68,0.4)] shrink-0" />

                                {/* Form Body */}
                                <div className="overflow-y-auto flex-1 pr-1.5 space-y-4">
                                    {/* Section Title */}
                                    <div className="text-xs font-black tracking-[0.25em] text-red-500 uppercase mt-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                                        {editingId ? "EDIT ENTRY" : "ADD NEW ENTRY"}
                                    </div>

                                    {/* Existing Entries */}
                                    {(calendarEntries[selectedDate?.dateStr] || []).filter(entry => {
                                        if (selectedCategory && entry.category !== selectedCategory) return false
                                        if (selectedGenres.length === 0) return true
                                        const entryGenres = entry.genres || [entry.genre || 'General']
                                        return selectedGenres.some(sg => entryGenres.map(eg => eg.toLowerCase()).includes(sg.toLowerCase()))
                                    }).length > 0 && (
                                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                                            {(calendarEntries[selectedDate?.dateStr] || [])
                                                .filter(entry => {
                                                    if (selectedCategory && entry.category !== selectedCategory) return false
                                                    if (selectedGenres.length === 0) return true
                                                    const entryGenres = entry.genres || [entry.genre || 'General']
                                                    return selectedGenres.some(sg => entryGenres.map(eg => eg.toLowerCase()).includes(sg.toLowerCase()))
                                                })
                                                .map((entry) => (
                                                    <div
                                                        key={entry._id}
                                                        className="p-2.5 rounded-xl bg-black/60 border border-red-500/30 flex gap-3 transition-all hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer group relative"
                                                        onClick={() => handleEditClick(entry)}
                                                    >
                                                        <div className="absolute top-2 right-2 flex gap-1 z-30">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleEditClick(entry)
                                                                }}
                                                                className="p-1 rounded-full text-white/70 hover:text-white"
                                                            >
                                                                <Upload size={12} className="rotate-90" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (confirm('Delete this entry?')) {
                                                                        removeEntry(entry._id, selectedDate.dateStr)
                                                                    }
                                                                }}
                                                                className="p-1 rounded-full text-red-400 hover:text-red-300"
                                                            >
                                                                <Trash size={12} />
                                                            </button>
                                                        </div>
                                                        {entry.poster ? (
                                                            <img src={entry.poster} alt={entry.title} className="w-9 h-12 object-cover rounded-lg flex-shrink-0 border border-red-500/30" />
                                                        ) : (
                                                            <div className="w-9 h-12 rounded-lg flex items-center justify-center text-[9px] text-center p-0.5 flex-shrink-0 bg-black/40 border border-red-500/20 text-white/40">No Img</div>
                                                        )}
                                                        <div className="flex-1 min-w-0 pr-12">
                                                            <h4 className="font-bold text-xs truncate text-white">{entry.title}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${entry.status === 'watched' ? 'bg-green-950/60 border border-green-500/50 text-green-400' : 'bg-amber-950/60 border border-amber-500/50 text-amber-400'}`}>
                                                                    {entry.status}
                                                                </span>
                                                                <div className="flex">
                                                                    {Array.from({ length: 5 }).map((_, starI) => (
                                                                        <Star key={starI} size={10} fill={starI < entry.rating ? "#ef4444" : "none"} className={starI < entry.rating ? "text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]" : "text-white/20"} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                    {/* TITLE */}
                                    <div>
                                        <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">TITLE</label>
                                        <div className="flex items-center gap-3.5 px-4 h-13 rounded-[16px] bg-black/70 border border-red-500/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(239,68,68,0.15)] focus-within:border-red-500 focus-within:shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_25px_rgba(239,68,68,0.45)] transition-all duration-200">
                                            <Clapperboard size={18} className="text-red-500 shrink-0 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                            <input
                                                className="bg-transparent text-white placeholder-white/20 text-xs sm:text-sm font-semibold focus:outline-none w-full tracking-wide"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="Movie or Series Name"
                                            />
                                        </div>
                                    </div>

                                    {/* GENRES */}
                                    <div>
                                        <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">GENRES</label>
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
                                                        className={`h-10 px-3.5 sm:px-4 rounded-[12px] text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center ${
                                                            isSelected
                                                                ? 'bg-red-950/80 border-2 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                                                                : 'bg-black/60 border border-white/15 text-white/70 hover:border-red-500/50 hover:text-white hover:bg-black/80 hover:-translate-y-0.5'
                                                        }`}
                                                    >
                                                        {g}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* STATUS & RATING */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">STATUS</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full appearance-none px-10 pr-9 h-13 rounded-[16px] bg-black/70 border border-red-500/40 text-white text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(239,68,68,0.15)] focus:outline-none focus:border-red-500 focus:shadow-[0_0_25px_rgba(239,68,68,0.4)] cursor-pointer transition-all"
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                >
                                                    <option value="watched" className="bg-[#0a0a0c] text-white">Watched</option>
                                                    <option value="watching" className="bg-[#0a0a0c] text-white">Watching</option>
                                                    <option value="upcoming" className="bg-[#0a0a0c] text-white">Upcoming</option>
                                                </select>
                                                <Eye size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">RATING</label>
                                            <div className="flex items-center justify-around px-4 h-13 rounded-[16px] bg-black/70 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => setFormData({ ...formData, rating: num })}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-110"
                                                    >
                                                        <Star
                                                            size={18}
                                                            fill={num <= formData.rating ? "#ef4444" : "none"}
                                                            className={num <= formData.rating ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" : "text-red-500/50 hover:text-red-500"}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SCORES */}
                                    <div>
                                        <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">SCORES (AUTO-FETCHED)</label>
                                        <div className="flex items-center gap-3 px-4 h-13 rounded-[16px] bg-black/70 border border-red-500/30 text-white/30 text-xs font-mono select-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                                            <span>{formData.rtCriticScore ? `${formData.rtCriticScore}% Critic` : 'No Critic Score'}</span>
                                            <span className="text-white/20">|</span>
                                            <span>{formData.rtAudienceScore ? `${formData.rtAudienceScore}% Audience` : 'No Audience Score'}</span>
                                        </div>
                                    </div>

                                    {/* PASTE IMDB LINK */}
                                    <div>
                                        <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">PASTE IMDB LINK</label>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex-1 flex items-center gap-3 px-4 h-13 rounded-[16px] bg-black/70 border border-red-500/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(239,68,68,0.15)] focus-within:border-red-500 focus-within:shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_25px_rgba(239,68,68,0.45)] transition-all">
                                                <Link2 size={16} className="text-red-500 shrink-0 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                                <input
                                                    className="bg-transparent text-white placeholder-white/20 text-xs font-medium focus:outline-none w-full"
                                                    value={imdbLinkValue}
                                                    onChange={e => setImdbLinkValue(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleFetchPoster(imdbLinkValue) }}
                                                    placeholder="https://www.imdb.com/title/tt..."
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleFetchPoster(imdbLinkValue)}
                                                disabled={isFetching}
                                                className="h-13 px-6 rounded-[16px] bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white font-extrabold text-xs uppercase tracking-wider border border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] active:scale-95 disabled:opacity-50 transition-all duration-200"
                                            >
                                                {isFetching ? "..." : "Fetch"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* POSTER (MANUAL) */}
                                    <div>
                                        <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">POSTER (MANUAL)</label>
                                        <div className="flex items-center gap-3">
                                            {formData.poster && (
                                                <img src={formData.poster} alt="Poster" className="h-12 w-9 object-cover rounded-xl border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                            )}
                                            <label className="flex items-center gap-2.5 cursor-pointer px-4 h-11 rounded-[14px] border-2 border-dashed border-red-500/40 bg-black/40 hover:bg-black/60 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all group">
                                                <Upload size={15} className="text-red-500 group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                                <span className="text-white/70 text-xs font-extrabold uppercase tracking-wider group-hover:text-white">Upload Image</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    {/* SAVE ENTRY BUTTON */}
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full h-15 sm:h-16 rounded-[20px] bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-red-400/60 shadow-[0_0_35px_rgba(239,68,68,0.6)] hover:shadow-[0_0_60px_rgba(239,68,68,0.9)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 relative overflow-hidden group mt-3 shrink-0"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <Save size={18} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                        <span>{editingId ? "UPDATE ENTRY" : "SAVE ENTRY"}</span>
                                    </button>
                                </div>
                            </Motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // ──────────────────────────────────────────────
    // Web Perspective
    // ──────────────────────────────────────────────
    return (
        <div
            className={`min-h-screen w-full relative font-sans overflow-x-hidden ${useDesktopNeumorphic ? 'text-white' : 'text-white'}`}
            style={{ background: useDesktopNeumorphic ? netflixNeumorphic.pageBackground : "linear-gradient(160deg, #0c0c1d 0%, #0a0a14 30%, #08080f 60%, #0d0d1a 100%)" }}
        >
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
            ) : useDesktopNeumorphic ? (
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div style={{ position: 'absolute', top: '7%', left: '8%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,9,20,0.22) 0%, transparent 70%)', filter: 'blur(72px)' }} />
                    <div style={{ position: 'absolute', right: '6%', bottom: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,18,28,0.2) 0%, transparent 70%)', filter: 'blur(76px)' }} />
                </div>
            ) : (
                <Suspense fallback={<div className="fixed inset-0 z-0 bg-[#121212]" />}>
                    <Background3D />
                </Suspense>
            )}

            {/* Header */}
            <header
                className="px-4 md:px-8 py-4 md:py-6 sticky top-0 z-20"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
                    background: useDesktopNeumorphic ? 'rgba(12,12,13,0.86)' : 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: useDesktopNeumorphic ? `1px solid ${netflixNeumorphic.border}` : '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1
                            className={`text-2xl md:text-4xl font-bold tracking-wide flex flex-wrap items-baseline gap-2 md:gap-3 uppercase ${useDesktopNeumorphic ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600'}`}
                        >
                            <span>{selectedCategory ? `${selectedCategory}` : "My Calendar"}</span>
                            <span className={`${useDesktopNeumorphic ? 'text-neutral-400' : 'text-white/50'} text-lg md:text-2xl font-light`}>| {MONTHS[currentMonthIndex]} {selectedYear}</span>
                        </h1>
                        {selectedGenres.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {selectedGenres.map(g => (
                                    <span
                                        key={g}
                                        className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider ${useDesktopNeumorphic ? 'text-neutral-300' : 'bg-white/10 text-white/70 border border-white/20'}`}
                                        style={useDesktopNeumorphic ? netflixInsetStyle : undefined}
                                    >
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!isGuest && (
                            <button
                                onClick={handleShareCalendar}
                                className="flex items-center px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-colors gap-2"
                                style={useDesktopNeumorphic ? { ...netflixRaisedStyle, color: netflixNeumorphic.textSoft } : undefined}
                            >
                                <Share2 size={16} /> Share
                            </button>
                        )}
                        <button
                            onClick={() => changeMonth('prev')}
                            disabled={currentMonthIndex === 0}
                            className="flex items-center px-3 md:px-4 py-2 disabled:opacity-30 rounded-full text-sm font-medium transition-colors"
                            style={useDesktopNeumorphic ? { ...netflixRaisedStyle, color: netflixNeumorphic.textSoft } : undefined}
                        >
                            <ChevronLeft size={16} className="mr-1" /> Prev
                        </button>
                        <button
                            onClick={() => changeMonth('next')}
                            disabled={currentMonthIndex === 11}
                            className="flex items-center px-3 md:px-4 py-2 disabled:opacity-30 rounded-full text-sm font-medium transition-colors"
                            style={useDesktopNeumorphic ? { ...netflixRaisedStyle, color: netflixNeumorphic.textSoft } : undefined}
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
                    <div
                        className={`rounded-2xl md:rounded-3xl ${useDesktopNeumorphic ? 'p-5 md:p-9' : 'p-4 md:p-8'}`}
                        style={useDesktopNeumorphic ? netflixSurfaceStyle : undefined}
                    >
                        {/* Weekday Headers */}
                        <div className={`grid grid-cols-7 mb-4 pb-4 ${useDesktopNeumorphic ? 'border-b border-white/10' : 'border-b border-white/5'}`}>
                            {DAYS_OF_WEEK.map(day => (
                                <div key={day} className={`text-center font-bold uppercase text-[10px] md:text-xs tracking-widest py-2 ${useDesktopNeumorphic ? 'text-neutral-500' : 'text-blue-400/70'}`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className={`grid grid-cols-7 ${useDesktopNeumorphic ? 'gap-5 xl:gap-6' : 'gap-4'}`}>
                            {renderCalendarGrid()}
                        </div>
                    </div>
                )}
            </main>

            {/* Entry Modal (Cyberpunk AAA HUD Theme) */}
            <AnimatePresence>
                {showModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-hidden"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowModal(false)
                        }}
                    >
                        {/* Volumetric Red Ambient Glow */}
                        <div className="absolute w-[700px] h-[700px] bg-red-600/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse" />

                        <Motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                            className="w-full max-w-[850px] rounded-[28px] bg-[#0a0a0c]/95 border border-red-500/50 p-6 md:p-8 text-white shadow-[0_0_50px_rgba(255,0,0,0.35),inset_0_0_20px_rgba(255,0,0,0.1)] relative overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans"
                        >
                            {/* Background Scanline Grid Texture */}
                            <div className="absolute inset-0 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none rounded-[28px]" />

                            {/* Close Button */}
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-6 right-6 w-11 h-11 rounded-full border border-red-500/40 bg-black/60 text-white flex items-center justify-center hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:rotate-90 transition-all duration-300 z-30 group"
                            >
                                <X size={20} className="text-white/80 group-hover:text-white" />
                            </button>

                            {/* Header Date & Month */}
                            <div className="flex items-baseline mb-2 shrink-0">
                                <span className="text-4xl md:text-5xl font-black text-red-500 drop-shadow-[0_0_16px_rgba(239,68,68,0.9)] tracking-tight">
                                    {selectedDate?.day || 12}
                                </span>
                                <span className="text-4xl md:text-5xl font-black text-white ml-3 tracking-tight">
                                    {MONTHS[selectedDate?.monthIndex] || 'March'}
                                </span>
                            </div>

                            {/* Glowing Red Divider */}
                            <div className="w-full h-[1px] bg-gradient-to-r from-red-500/50 via-red-500/20 to-transparent my-3 shadow-[0_0_10px_rgba(239,68,68,0.4)] shrink-0" />

                            {/* Form Body */}
                            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                                {/* Section Title */}
                                <div className="text-xs font-black tracking-[0.25em] text-red-500 uppercase mt-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                                    {editingId ? "EDIT ENTRY" : "ADD NEW ENTRY"}
                                </div>

                                {/* Existing Entries */}
                                {(calendarEntries[selectedDate?.dateStr] || []).filter(entry => {
                                    if (selectedCategory && entry.category !== selectedCategory) return false
                                    if (selectedGenres.length === 0) return true
                                    const entryGenres = entry.genres || [entry.genre || 'General']
                                    return selectedGenres.some(sg => entryGenres.map(eg => eg.toLowerCase()).includes(sg.toLowerCase()))
                                }).length > 0 && (
                                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                                        {(calendarEntries[selectedDate?.dateStr] || [])
                                            .filter(entry => {
                                                if (selectedCategory && entry.category !== selectedCategory) return false
                                                if (selectedGenres.length === 0) return true
                                                const entryGenres = entry.genres || [entry.genre || 'General']
                                                return selectedGenres.some(sg => entryGenres.map(eg => eg.toLowerCase()).includes(sg.toLowerCase()))
                                            })
                                            .map((entry) => (
                                                <div
                                                    key={entry._id}
                                                    className="p-2.5 rounded-xl bg-black/60 border border-red-500/30 flex gap-3 transition-all hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer group relative"
                                                    onClick={() => handleEditClick(entry)}
                                                >
                                                    <div className="absolute top-2 right-2 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleEditClick(entry)
                                                            }}
                                                            className="p-1 rounded-full text-white/70 hover:text-white"
                                                        >
                                                            <Upload size={12} className="rotate-90" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (confirm('Delete this entry?')) {
                                                                    removeEntry(entry._id, selectedDate.dateStr)
                                                                }
                                                            }}
                                                            className="p-1 rounded-full text-red-400 hover:text-red-300"
                                                        >
                                                            <Trash size={12} />
                                                        </button>
                                                    </div>
                                                    {entry.poster ? (
                                                        <img src={entry.poster} alt={entry.title} className="w-9 h-12 object-cover rounded-lg flex-shrink-0 border border-red-500/30" />
                                                    ) : (
                                                        <div className="w-9 h-12 rounded-lg flex items-center justify-center text-[9px] text-center p-0.5 flex-shrink-0 bg-black/40 border border-red-500/20 text-white/40">No Img</div>
                                                    )}
                                                    <div className="flex-1 min-w-0 pr-12">
                                                        <h4 className="font-bold text-xs truncate text-white">{entry.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${entry.status === 'watched' ? 'bg-green-950/60 border border-green-500/50 text-green-400' : 'bg-amber-950/60 border border-amber-500/50 text-amber-400'}`}>
                                                                {entry.status}
                                                            </span>
                                                            <div className="flex">
                                                                {Array.from({ length: 5 }).map((_, starI) => (
                                                                    <Star key={starI} size={10} fill={starI < entry.rating ? "#ef4444" : "none"} className={starI < entry.rating ? "text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]" : "text-white/20"} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {/* TITLE */}
                                <div>
                                    <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">TITLE</label>
                                    <div className="flex items-center gap-3.5 px-4 h-14 rounded-[18px] bg-black/70 border border-red-500/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(239,68,68,0.15)] focus-within:border-red-500 focus-within:shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_25px_rgba(239,68,68,0.45)] transition-all duration-200">
                                        <Clapperboard size={20} className="text-red-500 shrink-0 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                        <input
                                            className="bg-transparent text-white placeholder-white/20 text-sm font-semibold focus:outline-none w-full tracking-wide"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Movie or Series Name"
                                        />
                                    </div>
                                </div>

                                {/* GENRES */}
                                <div>
                                    <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">GENRES</label>
                                    <div className="flex flex-wrap gap-2.5">
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
                                                    className={`h-11 px-4 sm:px-5 rounded-[14px] text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center ${
                                                        isSelected
                                                            ? 'bg-red-950/80 border-2 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                                                            : 'bg-black/60 border border-white/15 text-white/70 hover:border-red-500/50 hover:text-white hover:bg-black/80 hover:-translate-y-0.5'
                                                    }`}
                                                >
                                                    {g}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* STATUS & RATING */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">STATUS</label>
                                        <div className="relative">
                                            <select
                                                className="w-full appearance-none px-11 pr-10 h-14 rounded-[18px] bg-black/70 border border-red-500/40 text-white text-sm font-semibold shadow-[0_0_15px_rgba(239,68,68,0.15)] focus:outline-none focus:border-red-500 focus:shadow-[0_0_25px_rgba(239,68,68,0.4)] cursor-pointer transition-all"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="watched" className="bg-[#0a0a0c] text-white">Watched</option>
                                                <option value="watching" className="bg-[#0a0a0c] text-white">Watching</option>
                                                <option value="upcoming" className="bg-[#0a0a0c] text-white">Upcoming</option>
                                            </select>
                                            <Eye size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">RATING</label>
                                        <div className="flex items-center justify-around px-5 h-14 rounded-[18px] bg-black/70 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => setFormData({ ...formData, rating: num })}
                                                    className="focus:outline-none transition-transform hover:scale-125 active:scale-110"
                                                >
                                                    <Star
                                                        size={20}
                                                        fill={num <= formData.rating ? "#ef4444" : "none"}
                                                        className={num <= formData.rating ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" : "text-red-500/50 hover:text-red-500"}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* SCORES */}
                                <div>
                                    <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">SCORES (AUTO-FETCHED)</label>
                                    <div className="flex items-center gap-3 px-5 h-14 rounded-[18px] bg-black/70 border border-red-500/30 text-white/30 text-xs font-mono select-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                                        <span>{formData.rtCriticScore ? `${formData.rtCriticScore}% Critic` : 'No Critic Score'}</span>
                                        <span className="text-white/20">|</span>
                                        <span>{formData.rtAudienceScore ? `${formData.rtAudienceScore}% Audience` : 'No Audience Score'}</span>
                                    </div>
                                </div>

                                {/* PASTE IMDB LINK */}
                                <div>
                                    <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">PASTE IMDB LINK</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 flex items-center gap-3 px-4 h-14 rounded-[18px] bg-black/70 border border-red-500/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(239,68,68,0.15)] focus-within:border-red-500 focus-within:shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_25px_rgba(239,68,68,0.45)] transition-all">
                                            <Link2 size={18} className="text-red-500 shrink-0 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                            <input
                                                className="bg-transparent text-white placeholder-white/20 text-xs font-medium focus:outline-none w-full"
                                                value={imdbLinkValue}
                                                onChange={e => setImdbLinkValue(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleFetchPoster(imdbLinkValue) }}
                                                placeholder="https://www.imdb.com/title/tt..."
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleFetchPoster(imdbLinkValue)}
                                            disabled={isFetching}
                                            className="h-14 px-7 rounded-[18px] bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white font-extrabold text-xs uppercase tracking-wider border border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] active:scale-95 disabled:opacity-50 transition-all duration-200"
                                        >
                                            {isFetching ? "..." : "Fetch"}
                                        </button>
                                    </div>
                                </div>

                                {/* POSTER (MANUAL) */}
                                <div>
                                    <label className="block text-[11px] font-extrabold tracking-[0.2em] text-white/80 uppercase mb-1.5">POSTER (MANUAL)</label>
                                    <div className="flex items-center gap-4">
                                        {formData.poster && (
                                            <img src={formData.poster} alt="Poster" className="h-14 w-10 object-cover rounded-xl border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        )}
                                        <label className="flex items-center gap-2.5 cursor-pointer px-5 h-12 rounded-[14px] border-2 border-dashed border-red-500/40 bg-black/40 hover:bg-black/60 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all group">
                                            <Upload size={16} className="text-red-500 group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                                            <span className="text-white/70 text-xs font-extrabold uppercase tracking-wider group-hover:text-white">Upload Image</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>

                                {/* SAVE ENTRY BUTTON */}
                                <button
                                    onClick={handleSubmit}
                                    className="w-full h-16 rounded-[22px] bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-red-400/60 shadow-[0_0_35px_rgba(239,68,68,0.6)] hover:shadow-[0_0_60px_rgba(239,68,68,0.9)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 relative overflow-hidden group mt-4 shrink-0"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <Save size={20} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                    <span>{editingId ? "UPDATE ENTRY" : "SAVE ENTRY"}</span>
                                </button>
                            </div>
                        </Motion.div>
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
                        <Motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-[340px] rounded-[32px] overflow-hidden relative flex flex-col max-h-[80vh]"
                            style={{ 
                                ...netflixSurfaceStyle,
                            }}
                        >
                            <div className="px-6 py-5 flex justify-between items-center border-b" style={{ borderColor: netflixNeumorphic.border, background: 'rgba(255,255,255,0.03)' }}>
                                <h3 className="text-lg font-bold" style={{ color: netflixNeumorphic.text }}>
                                    {longPressData.entries.length} Entries on {longPressData.day}
                                </h3>
                                <button onClick={() => setLongPressData(null)} className="p-2 rounded-full transition-colors" style={netflixRaisedStyle}>
                                    <X size={18} color={netflixNeumorphic.textSoft} />
                                </button>
                            </div>
                            
                            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
                                {longPressData.entries.map((entry, idx) => (
                                    <div key={entry._id || idx} className="flex gap-4 p-3 rounded-2xl" style={netflixInsetStyle}>
                                        <div className="w-16 h-24 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: netflixNeumorphic.panelRaised }}>
                                            {entry.poster ? (
                                                <img src={entry.poster} alt={entry.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center" style={{ color: netflixNeumorphic.muted, background: netflixNeumorphic.panelRaised }}>
                                                    <CalIcon size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                                            <h4 className="font-bold text-[15px] leading-tight mb-2 line-clamp-2" style={{ color: netflixNeumorphic.text }}>{entry.title}</h4>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${entry.status === 'watched' ? 'bg-green-100 text-green-700' : entry.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {entry.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 mt-auto">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} className={i < (entry.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-neutral-700"} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
