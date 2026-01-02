import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, X, Check, Clock, Eye, Trash2, CalendarDays } from 'lucide-react'
import LightPillar from '../components/LightPillar'
import UserBadge from '../components/ui/UserBadge'

export default function MySpace() {
    // Helper
    const getScoreColor = (score) => {
        if (!score) return ''
        const val = String(score).replace(/[^0-9.]/g, '')
        const num = Number(val)
        return num > 50
            ? 'text-green-400 bg-green-500/10 border-green-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
    }

    const { calendarEntries, user, removeEntry, setYear, setCategory, setSelectedGenres: setGlobalSelectedGenres, setSelectedMonth } = useStore()
    const navigate = useNavigate()

    // -- State --
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedStatus, setSelectedStatus] = useState('All')
    const [selectedGenres, setSelectedGenres] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    // -- Derived Data: Aggregate All Entries (1900-2050) --
    const allEntries = useMemo(() => {
        let entries = []
        if (!calendarEntries) return []

        Object.entries(calendarEntries).forEach(([dateStr, dayEntries]) => {
            const year = parseInt(dateStr.split('-')[0])
            if (year >= 1900 && year <= 2050) {
                // Add year/date context to entry
                const entriesWithDate = dayEntries.map(e => ({ ...e, date: dateStr, year }))
                entries = [...entries, ...entriesWithDate]
            }
        })

        // Sort by newest added or date? Let's sort by Date descending for now
        return entries.sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [calendarEntries])

    // -- Derived Data: Available Genres --
    const availableGenres = useMemo(() => {
        const genres = new Set()
        allEntries.forEach(e => {
            if (e.genres) e.genres.forEach(g => genres.add(g))
            if (e.genre) genres.add(e.genre) // Fallback for legacy
        })
        return Array.from(genres).sort()
    }, [allEntries])

    // -- Filtering Logic --
    const filteredEntries = allEntries.filter(entry => {
        // 1. Text Search (Title)
        if (searchQuery.length > 0) {
            const q = searchQuery.toLowerCase()
            if (!entry.title?.toLowerCase().includes(q)) return false
        }

        // 2. Category Filter
        if (selectedCategory !== 'All') {
            const cat = entry.category || 'Movies' // Default
            if (cat !== selectedCategory) return false
        }

        // 3. Status Filter
        if (selectedStatus !== 'All') {
            const stat = (entry.status || 'watched').toLowerCase()
            const filterStat = selectedStatus.toLowerCase()
            if (stat !== filterStat) return false
        }

        // 4. Genre Filter
        if (selectedGenres.length > 0) {
            const entryGenres = entry.genres || [entry.genre] || []
            // Check if entry has AT LEAST ONE of the selected genres
            const hasMatch = selectedGenres.some(g => entryGenres.includes(g))
            if (!hasMatch) return false
        }

        return true
    })

    // -- Handlers --
    const toggleGenre = (genre) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        )
    }

    // -- Trailer Logic --
    const [selectedTrailerEntry, setSelectedTrailerEntry] = useState(null)
    const [trailerVideoId, setTrailerVideoId] = useState(null)
    const [isLoadingTrailer, setIsLoadingTrailer] = useState(false)

    const handleEntryClick = async (entry) => {
        setSelectedTrailerEntry(entry)
        setTrailerVideoId(null)
        setIsLoadingTrailer(true)

        try {
            // Fetch from backend scraper
            const res = await fetch(`http://localhost:5000/api/trailer?q=${encodeURIComponent(entry.title)}`)
            const data = await res.json()
            if (data.videoId) {
                setTrailerVideoId(data.videoId)
            } else {
                // Fallback: If scraper fails, maybe we let them search manually
                console.warn("Trailer not found")
            }
        } catch (error) {
            console.error("Failed to fetch trailer ID", error)
        } finally {
            setIsLoadingTrailer(false)
        }
    }

    const closeTrailerModal = () => {
        setSelectedTrailerEntry(null)
        setTrailerVideoId(null)
    }

    const handleNavigateToCalendar = (e, entry) => {
        e.stopPropagation()
        setYear(entry.year)
        setCategory(entry.category || 'Movies')
        // Ensure genres is an array
        const genres = entry.genres && entry.genres.length > 0 ? entry.genres : [entry.genre || 'General']
        setGlobalSelectedGenres(genres)

        if (entry.date) {
            const parts = entry.date.split('-')
            if (parts.length === 3) {
                const monthIndex = parseInt(parts[1]) - 1 // 06 -> 5
                setSelectedMonth(monthIndex)
            }
        }
        navigate('/calendar')
    }

    return (
        <div className="min-h-screen w-full bg-black text-white font-sans selection:bg-purple-500/30">
            {/* Background Vibe */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/10 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-purple-900/10 blur-[120px]" />
            </div>

            {/* Header / Nav */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-light uppercase tracking-widest text-white/90">My Space</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <UserBadge />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 relative z-10 flex gap-10 items-start">

                {/* Sidebar Filters */}
                <aside className="w-72 flex-shrink-0 space-y-8 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="Search your collection..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Category</h3>
                        <div className="flex flex-col gap-1">
                            {['All', 'Movies', 'Series', 'Anime'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`text-left px-4 py-2 rounded-lg text-sm transition-all ${selectedCategory === cat
                                        ? 'bg-white text-black font-medium'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Status</h3>
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Upcoming', 'Watching', 'Watched'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${selectedStatus === status
                                        ? 'bg-blue-500/20 border-blue-500 text-blue-200'
                                        : 'bg-white/5 border-transparent text-white/50 hover:border-white/20'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genres */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Genres</h3>
                            {selectedGenres.length > 0 && (
                                <button onClick={() => setSelectedGenres([])} className="text-[10px] text-red-400 hover:text-red-300">
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {availableGenres.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={`px-2.5 py-1 rounded text-[11px] transition-all border ${selectedGenres.includes(genre)
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content Grid */}
                <div className="flex-1 min-h-[50vh]">
                    <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-2xl font-light">
                                {selectedCategory === 'All' ? 'Everything' : selectedCategory}
                                <span className="text-white/30 ml-2 text-lg">
                                    {selectedStatus !== 'All' && `• ${selectedStatus}`}
                                </span>
                            </h2>
                            <p className="text-white/40 text-sm mt-1">Showing {filteredEntries.length} collected items</p>
                        </div>
                    </div>

                    {filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-white/20">
                            <Filter size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-light">No content matches your filters.</p>
                            <button
                                onClick={() => { setSelectedCategory('All'); setSelectedStatus('All'); setSelectedGenres([]); setSearchQuery(''); }}
                                className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredEntries.map((entry) => (
                                <div
                                    key={entry._id + entry.date}
                                    onClick={() => handleEntryClick(entry)}
                                    className="group relative aspect-[2/3] bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer"
                                >
                                    {/* Poster */}
                                    {entry.poster ? (
                                        <img src={entry.poster} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/10">
                                            <div className="text-center p-4">
                                                <div className="text-4xl mb-2">?</div>
                                                <div className="text-xs font-mono uppercase">No Poster</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                                    {/* Play Icon Overlay (Centered & Transparent) - Moved here for correct stacking */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 pointer-events-none">
                                        <div className="p-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg transform transition-transform group-hover:scale-110">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/90 ml-1"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        {entry.status === 'Watched' && <div className="bg-green-500/20 text-green-300 border border-green-500/30 p-1.5 rounded-full"><Check size={12} /></div>}
                                        {entry.status === 'Watching' && <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 p-1.5 rounded-full"><Eye size={12} /></div>}
                                        {entry.status === 'Upcoming' && <div className="bg-orange-500/20 text-orange-300 border border-orange-500/30 p-1.5 rounded-full"><Clock size={12} /></div>}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (window.confirm(`Delete "${entry.title}"?`)) removeEntry(entry._id, entry.date)
                                            }}
                                            className="bg-red-500/20 text-red-300 border border-red-500/30 p-1.5 rounded-full hover:bg-red-500/40 transition-colors z-20"
                                            title="Delete Entry"
                                        >
                                            <Trash2 size={12} />
                                        </button>

                                        <button
                                            onClick={(e) => handleNavigateToCalendar(e, entry)}
                                            className="bg-purple-500/20 text-purple-300 border border-purple-500/30 p-1.5 rounded-full hover:bg-purple-500/40 transition-colors z-20"
                                            title="View in Calendar"
                                        >
                                            <CalendarDays size={12} />
                                        </button>
                                    </div>

                                    {/* Content Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] uppercase tracking-wider text-white/50 bg-white/10 px-1.5 rounded">
                                                {entry.year}
                                            </span>
                                            {entry.rating > 0 && (
                                                <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                                                    ★ {entry.rating}
                                                </span>
                                            )}
                                            {entry.rtCriticScore && (
                                                <span className={`text-[10px] flex items-center gap-1 ml-2 font-bold px-1.5 py-0.5 rounded border ${getScoreColor(entry.rtCriticScore)}`}>
                                                    🍅 {entry.rtCriticScore}%
                                                </span>
                                            )}
                                            {entry.rtAudienceScore && (
                                                <span className="text-[10px] text-orange-400 flex items-center gap-1 ml-2 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                                    🍿 {entry.rtAudienceScore}%
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-white font-bold leading-tight mb-2 line-clamp-2 drop-shadow-md">{entry.title}</h3>

                                        {/* Play Icon Overlay (Centered & Transparent) */}


                                        <div className="flex flex-wrap gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                                            {(entry.genres || []).slice(0, 3).map(g => (
                                                <span key={g} className="text-[9px] text-white/70 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Trailer Modal */}
            {selectedTrailerEntry && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                    onClick={closeTrailerModal}
                >
                    <div
                        className="bg-[#1a1a1a] border border-white/10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                            <div>
                                <h3 className="text-xl font-bold text-white max-w-md truncate">{selectedTrailerEntry.title}</h3>
                                <p className="text-xs text-white/50 uppercase tracking-widest mt-1">
                                    {isLoadingTrailer ? 'Fetching Trailer...' : 'Official Trailer'}
                                </p>
                            </div>
                            <button
                                onClick={closeTrailerModal}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} className="text-white/70" />
                            </button>
                        </div>

                        {/* Video Embed */}
                        <div className="relative aspect-video w-full bg-black group flex items-center justify-center">
                            {isLoadingTrailer ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                                    <span className="text-sm text-white/50">Searching YouTube...</span>
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
                                <div className="text-center p-8">
                                    <div className="text-4xl mb-4">😢</div>
                                    <h4 className="text-lg font-bold text-white mb-2">Trailer Unavailable</h4>
                                    <p className="text-white/50 text-sm mb-6">Could not automatically find an embeddable trailer.</p>
                                    <a
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTrailerEntry.title + " official trailer")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transition-transform hover:scale-105 inline-flex items-center gap-2"
                                    >
                                        Search on YouTube ↗
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-black/40 flex items-center justify-between border-t border-white/10">
                            <div className="flex gap-4 text-sm text-white/60">
                                <span>{selectedTrailerEntry.year}</span>
                                <span>{selectedTrailerEntry.category || 'Movie'}</span>
                            </div>
                            {(selectedTrailerEntry.rtCriticScore || selectedTrailerEntry.rtAudienceScore) && (
                                <div className="flex gap-3">
                                    {selectedTrailerEntry.rtCriticScore && (
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold border ${getScoreColor(selectedTrailerEntry.rtCriticScore)}`}>
                                            🍅 {selectedTrailerEntry.rtCriticScore}%
                                        </span>
                                    )}
                                    {selectedTrailerEntry.rtAudienceScore && (
                                        <span className="text-xs text-orange-400 font-bold px-2 py-0.5 rounded border border-orange-500/20 bg-orange-500/10">
                                            🍿 {selectedTrailerEntry.rtAudienceScore}%
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
