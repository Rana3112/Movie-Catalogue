import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Filter, X, Check, Clock, Eye, Trash2 } from 'lucide-react'
import LightPillar from '../components/LightPillar'
import UserBadge from '../components/ui/UserBadge'

export default function MySpace() {
    const { calendarEntries, user, removeEntry } = useStore()
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

        // 4. Genre Filter (Contains ANY selected)
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
                                    className="group relative aspect-[2/3] bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
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
                                        </div>

                                        <h3 className="text-white font-bold leading-tight mb-2 line-clamp-2 drop-shadow-md">{entry.title}</h3>

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
        </div>
    )
}
