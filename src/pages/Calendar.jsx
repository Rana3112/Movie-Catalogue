import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import Background3D from '../components/canvas/Background3D'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Upload, Calendar as CalIcon, ChevronLeft, ChevronRight, Trash } from 'lucide-react'

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "TV Movie", "Thriller", "War", "Western", "General"]

export default function Calendar() {
    const { selectedYear, selectedCategory, selectedGenres, calendarEntries, addEntry, removeEntry, updateEntry, setYear, fetchEntries } = useStore()
    const isReadOnly = !selectedCategory // Read-Only if viewing "My Calendar (All)"
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0)

    useEffect(() => {
        fetchEntries()
    }, [fetchEntries])
    const [selectedDate, setSelectedDate] = useState(null) // { monthIndex, day }
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null) // New: Track which ID is being edited

    // Modal Form State
    const [formData, setFormData] = useState({
        title: '',
        status: 'watched', // watched, upcoming
        rating: 0,
        poster: null, // Base64 string
        genre: selectedGenres.length === 1 ? selectedGenres[0] : 'General'
    })

    const [isFetching, setIsFetching] = useState(false)

    // ... (keep handleFetchPoster same) ... 

    // Wrapped handleFetchPoster for brevity when replacing - wait, I can't replace logic inside a block easily without context.
    // I will replace the component setup blocks carefully.

    // ...

    const handleDateClick = (day) => {
        const dateStr = `${selectedYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        setSelectedDate({ monthIndex: currentMonthIndex, day, dateStr })
        setShowModal(true)
        setEditingId(null) // Reset edit mode
        setFormData({
            title: '',
            status: 'watched',
            rating: 0,
            poster: null,
            genre: selectedGenres.length === 1 ? selectedGenres[0] : 'General'
        })
        setIsFetching(false)
    }

    const handleEditClick = (entry) => {
        setEditingId(entry._id)
        setFormData({
            title: entry.title,
            status: entry.status,
            rating: entry.rating || 0,
            poster: entry.poster,
            genre: entry.genre || (selectedGenres.length === 1 ? selectedGenres[0] : 'General')
        })
    }

    const handleSubmit = () => {
        if (!formData.title) return

        if (editingId) {
            console.log("Updating Entry:", editingId, formData)
            updateEntry(editingId, selectedDate.dateStr, formData)
        } else {
            console.log("Submitting New Entry:", selectedDate.dateStr, formData)
            addEntry(selectedDate.dateStr, formData)
        }

        setShowModal(false)
        setEditingId(null)
    }

    const handleFetchPoster = async (link) => {
        if (!link) return
        setIsFetching(true)

        try {
            // Strategy 1: Try to extract IMDb ID and use the Suggestion API (lighter, less blocked)
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
                        // Ensure it matches the ID and has an image
                        const result = data.d?.find(item => item.id === imdbId)
                        if (result?.i?.imageUrl) {
                            posterUrl = result.i.imageUrl
                            newTitle = result.l
                        }
                    }
                } catch (e) {
                    console.warn("API fetch failed, falling back to scraping", e)
                }
            }

            // Strategy 2: Fallback to scraping the page for og:image
            if (!posterUrl) {
                const scrapeProxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(link)}`
                const response = await fetch(scrapeProxyUrl)
                if (!response.ok) throw new Error('Proxy error')
                const html = await response.text()

                const parser = new DOMParser()
                const doc = parser.parseFromString(html, 'text/html')
                posterUrl = doc.querySelector('meta[property="og:image"]')?.content
                newTitle = doc.querySelector('meta[property="og:title"]')?.content?.replace(' - IMDb', '') || doc.title.replace(' - IMDb', '')
            }

            if (posterUrl) {
                setFormData(prev => ({
                    ...prev,
                    poster: posterUrl,
                    title: newTitle || prev.title // Only overwrite if new title found
                }))
            } else {
                alert('Could not find a poster image. IMDb may be blocking access.')
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
                setCurrentMonthIndex(currentMonthIndex - 1)
            }
        } else {
            if (currentMonthIndex < 11) {
                setCurrentMonthIndex(currentMonthIndex + 1)
            }
        }
    }

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentMonthIndex, selectedYear)
        const firstDay = getFirstDayOfMonth(currentMonthIndex, selectedYear)
        const days = []

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-[3/4] bg-white/5 border border-white/5 rounded-lg opacity-20" />)
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${selectedYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            let rawEntries = calendarEntries[dateStr] || []
            let dayEntries = [...rawEntries]

            // Filter by Category (Movies vs Series vs Anime)
            if (selectedCategory) {
                dayEntries = dayEntries.filter(e => e.category === selectedCategory)
            }


            // Filter by Genre
            if (selectedGenres.length > 0) {
                // Case-insensitive check to avoid "Action" vs "action" mismatches
                // Filter by Genre (STRICT MATCH - Case Insensitive)
                dayEntries = dayEntries.filter(e => {
                    const eGenres = e.genres || [e.genre || 'General']
                    const sEntry = [...eGenres].map(g => g.toLowerCase()).sort()
                    const sSelected = [...selectedGenres].map(g => g.toLowerCase()).sort()

                    return sEntry.length === sSelected.length && sEntry.every((val, idx) => val === sSelected[idx])
                })
            }

            const hasEntry = dayEntries.length > 0
            const posterEntry = dayEntries.find(e => e.poster)

            days.push(
                <div
                    key={day}
                    onClick={() => !isReadOnly && handleDateClick(day)} // Disable click if Read Only
                    className={`
                        aspect-[3/4] rounded-lg relative overflow-hidden group transition-all duration-300 ${!isReadOnly ? 'cursor-pointer' : ''}
                        ${hasEntry ? 'border-blue-500/50' : isReadOnly ? 'bg-white/5 border border-white/10' : 'bg-white/5 border border-white/10 hover:bg-white/10'}
                    `}
                >
                    {/* Poster + Overlay UI */}
                    {posterEntry ? (
                        <>
                            <div className="absolute inset-0">
                                <img
                                    src={posterEntry.poster}
                                    alt="Poster"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            </div>

                            {/* Content Details (Visible) */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1">
                                <h4 className="font-bold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
                                    {posterEntry.title}
                                </h4>

                                <div className="flex flex-wrap gap-1 mt-1">
                                    {/* Category Pill */}
                                    <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-1.5 py-0.5 rounded text-white/90 backdrop-blur-sm border border-white/10">
                                        {posterEntry.category || 'Movie'}
                                    </span>
                                    {/* Genre Pill */}
                                    <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-200 border border-blue-500/20 truncate max-w-[80px]">
                                        {posterEntry.genre || 'General'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${posterEntry.status === 'watched' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                                        {posterEntry.status === 'watched' ? 'Watched' : 'Upcoming'}
                                    </span>
                                    <div className="flex">
                                        {Array.from({ length: posterEntry.rating || 0 }).map((_, i) => (
                                            <Star key={i} size={8} className="fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Delete Button (Hover) - Hide if Read Only */}
                            {!isReadOnly && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm(`Delete "${posterEntry.title}"?`)) {
                                            removeEntry(posterEntry._id, dateStr)
                                        }
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 z-20"
                                >
                                    <Trash size={12} />
                                </button>
                            )}
                        </>
                    ) : (
                        // Show "Add Entry" icon ONLY if NOT Read Only
                        !isReadOnly && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CalIcon className="text-white/20 w-8 h-8 mb-1" />
                                <span className="text-[10px] text-white/30 uppercase tracking-widest">Add Entry</span>
                            </div>
                        )
                    )}

                    {/* Date Number - Restored */}
                    <span className={`absolute top-2 left-3 font-bold text-lg z-10 ${posterEntry ? 'text-white drop-shadow-md' : 'text-white/70'}`}>
                        {day}
                    </span>
                </div>
            )
        }

        return days
    }

    return (
        <div className="min-h-screen w-full relative text-white font-sans overflow-x-hidden bg-[#121212]">
            <Background3D />

            {/* Header */}
            <header className="px-8 py-6 border-b border-white/10 backdrop-blur-md sticky top-0 z-20 bg-black/50">
                <div className="container mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-serif text-[#ffd700] tracking-wide flex items-center gap-3">
                            {selectedCategory ? `${selectedCategory} Calendar - ` : "My Calendar - "} {MONTHS[currentMonthIndex]} {selectedYear}

                            {selectedGenres.length > 0 && selectedGenres.map(g => (
                                <span key={g} className="text-sm bg-white/10 px-3 py-1 rounded-full text-white/70 border border-white/20">
                                    {g}
                                </span>
                            ))}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => changeMonth('prev')}
                            disabled={currentMonthIndex === 0}
                            className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/10"
                        >
                            <ChevronLeft size={16} className="mr-1" /> Prev
                        </button>
                        <button
                            onClick={() => changeMonth('next')}
                            disabled={currentMonthIndex === 11}
                            className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/10"
                        >
                            Next <ChevronRight size={16} className="ml-1" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-8 pb-20 container mx-auto">
                <div className="bg-[#1e1e1e]/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-4">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="text-center text-white/40 font-medium uppercase text-sm py-2">
                                {day}
                            </div>
                        ))}
                    </div>



                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-4">
                        {renderCalendarGrid()}
                    </div>
                </div>
            </main>

            {/* Entry Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a1a] border border-white/20 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X /></button>

                            <h2 className="text-2xl font-bold mb-6">
                                {selectedDate?.day} {MONTHS[selectedDate?.monthIndex]}
                            </h2>

                            {/* Existing Entries */}
                            <div className="space-y-4 mb-8">
                                {(calendarEntries[selectedDate?.dateStr] || [])
                                    .filter(entry => {
                                        // Filter by Category
                                        if (selectedCategory && entry.category !== selectedCategory) return false

                                        // Filter by Genre (STRICT MATCH - Case Insensitive)
                                        if (selectedGenres.length === 0) return true

                                        const entryGenres = entry.genres || [entry.genre || 'General']

                                        // Sort and Compare Arrays
                                        const sortedEntry = [...entryGenres].map(g => g.toLowerCase()).sort()
                                        const sortedSelected = [...selectedGenres].map(g => g.toLowerCase()).sort()

                                        // Debug Log
                                        // console.log(`Checking ${entry.title}: Entry=${JSON.stringify(sortedEntry)} vs Selected=${JSON.stringify(sortedSelected)}`)

                                        if (sortedEntry.length !== sortedSelected.length) return false
                                        return sortedEntry.every((val, index) => val === sortedSelected[index])
                                    })
                                    .map((entry, i) => (
                                        <div key={i} className={`flex gap-4 p-4 rounded-xl border relative group ${editingId === entry._id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/10'}`}>
                                            {/* Edit Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditClick(entry)
                                                }}
                                                className="absolute top-2 right-10 p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Upload size={14} className="rotate-90" /> {/* Using Upload icon as 'Edit' proxy or just pencil if I had one. I'll use Upload rotated for now or import Pencil */}
                                            </button>

                                            {/* Delete Button (moved right slightly) */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    console.log("Modal Click Delete. ID:", entry._id, "Title:", entry.title)
                                                    if (!entry._id) {
                                                        alert("Error: Entry missing ID. Refresh page.")
                                                        return
                                                    }
                                                    if (confirm('Delete this entry?')) {
                                                        removeEntry(entry._id, selectedDate.dateStr)
                                                    }
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                                                <div className="flex items-center gap-2 text-sm text-white/70 mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${entry.status === 'watched' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {entry.status}
                                                    </span>
                                                    <div className="flex">
                                                        {Array.from({ length: 5 }).map((_, starI) => (
                                                            <Star key={starI} size={12} fill={starI < entry.rating ? "currentColor" : "none"} className={starI < entry.rating ? "text-yellow-400" : "text-gray-600"} />
                                                        ))}
                                                    </div>
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
                                                    poster: null,
                                                    genre: selectedGenres.length === 1 ? selectedGenres[0] : 'General'
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
                                            className="w-full bg-black/50 border border-white/20 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Movie or Series Name"
                                        />
                                    </div>

                                    {/* Genre Section */}
                                    <div>
                                        <label className="block text-xs uppercase text-white/50 mb-1">Genre</label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedGenres.length > 0 ? (
                                                selectedGenres.map(g => (
                                                    <span key={g} className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70 border border-white/20">
                                                        {g}
                                                    </span>
                                                ))
                                            ) : (
                                                <select
                                                    value={formData.genre}
                                                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/20 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-sm appearance-none text-white"
                                                >
                                                    {GENRES.map(g => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                            )}
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
                                                <option value="upcoming">Upcoming</option>
                                                <option value="watching">Watching</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase text-white/50 mb-1">Rating</label>
                                            <div className="flex gap-1 mt-2">
                                                {[1, 2, 3, 4, 5].map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setFormData({ ...formData, rating: r })}
                                                        className="group"
                                                    >
                                                        <Star
                                                            size={24}
                                                            className={`${r <= formData.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600 group-hover:text-yellow-400"}`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* IMDb Link Section */}
                                    <div>
                                        <label className="block text-xs uppercase text-white/50 mb-1">Paste IMDb Link</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-black/50 border border-white/20 rounded-xl p-3 focus:outline-none focus:border-blue-500 text-sm"
                                                placeholder="https://www.imdb.com/title/tt..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFetchPoster(e.target.value)
                                                }}
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.target.previousSibling
                                                    handleFetchPoster(input.value)
                                                }}
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
        </div >
    )
}
