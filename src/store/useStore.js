import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const ENTRY_CACHE_TTL_MS = 1000 * 60 * 5

let inflightEntriesFetch = null
let inflightEntriesUserEmail = null

const isDataPoster = (poster) => typeof poster === 'string' && poster.startsWith('data:')

const sanitizeEntryForCache = (entry) => {
    if (!entry || typeof entry !== 'object' || !isDataPoster(entry.poster)) return entry
    return { ...entry, poster: null }
}

const sanitizeEntriesByDateForCache = (entriesByDate) => {
    if (!entriesByDate || typeof entriesByDate !== 'object') return {}
    return Object.fromEntries(
        Object.entries(entriesByDate).map(([date, entries]) => ([
            date,
            Array.isArray(entries) ? entries.map(sanitizeEntryForCache) : []
        ]))
    )
}

export const useStore = create(persist((set, get) => ({
    selectedYear: 2025,
    selectedCategory: null,
    selectedGenres: [],
    selectedMonth: null, // Index 0-11
    calendarEntries: {}, // key: date string iso, value: array of entries
    entriesUpdatedAt: 0,
    entriesUserEmail: null,
    isEntriesLoading: false,
    entriesError: null,
    cineBotPendingEntry: null, // CineBot auto-add: { title, imdbLink, genres, releaseDate, category }

    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isGuest: false, // New Guest State

    setUser: (user, token) => {
        const { entriesUserEmail } = get()
        const shouldClearEntries = entriesUserEmail && entriesUserEmail !== user?.email
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', token)
        set({
            user,
            token,
            isGuest: false,
            ...(shouldClearEntries ? {
                calendarEntries: {},
                entriesUpdatedAt: 0,
                entriesUserEmail: null,
                entriesError: null,
            } : {})
        })
    },

    loginAsGuest: () => {
        set({
            user: { name: 'Guest Explorer', _id: 'guest' },
            token: null,
            isGuest: true,
            calendarEntries: {},
            entriesUpdatedAt: 0,
            entriesUserEmail: null,
            isEntriesLoading: false,
            entriesError: null,
        })
    },

    logout: () => {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        set({
            user: null,
            token: null,
            isGuest: false,
            calendarEntries: {},
            entriesUpdatedAt: 0,
            entriesUserEmail: null,
            isEntriesLoading: false,
            entriesError: null,
            customGenres: [],
        })
    },

    setYear: (year) => set({ selectedYear: year }),
    setCategory: (category) => set({ selectedCategory: category }),
    toggleGenre: (genre) => set((state) => {
        const exists = state.selectedGenres.includes(genre)
        return {
            selectedGenres: exists
                ? state.selectedGenres.filter(g => g !== genre)
                : [...state.selectedGenres, genre]
        }
    }),
    setSelectedGenres: (genres) => set({ selectedGenres: genres }),
    setSelectedMonth: (month) => set({ selectedMonth: month }),
    setCineBotPendingEntry: (entry) => set({ cineBotPendingEntry: entry }),
    clearCineBotPendingEntry: () => set({ cineBotPendingEntry: null }),

    // Fetch entries from Backend
    fetchEntries: async ({ force = false } = {}) => {
        const { user, calendarEntries, entriesUpdatedAt, entriesUserEmail, isEntriesLoading } = get()
        const userEmail = user?.email
        if (!userEmail) {
            set({
                calendarEntries: {},
                entriesUpdatedAt: 0,
                entriesUserEmail: null,
                isEntriesLoading: false,
                entriesError: null,
            })
            return {}
        }

        const hasCachedEntries = entriesUserEmail === userEmail && Object.keys(calendarEntries || {}).length > 0
        const isCacheFresh = hasCachedEntries && (Date.now() - entriesUpdatedAt < ENTRY_CACHE_TTL_MS)

        if (!force && isCacheFresh) return calendarEntries

        if (inflightEntriesFetch && inflightEntriesUserEmail === userEmail) {
            if (!hasCachedEntries && !isEntriesLoading) {
                set({ isEntriesLoading: true, entriesError: null })
            }
            return inflightEntriesFetch
        }

        set({
            isEntriesLoading: !hasCachedEntries,
            entriesError: null,
        })

        inflightEntriesUserEmail = userEmail
        inflightEntriesFetch = (async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
                const response = await fetch(`${API_URL}/api/entries?userEmail=${encodeURIComponent(userEmail)}`)
                if (!response.ok) throw new Error(`Failed to fetch entries (${response.status})`)
                const data = await response.json()
                set({
                    calendarEntries: data,
                    entriesUpdatedAt: Date.now(),
                    entriesUserEmail: userEmail,
                    isEntriesLoading: false,
                    entriesError: null,
                })
                return data
            } catch (error) {
                console.error('Failed to fetch entries:', error)
                const stillHasCachedEntries = get().entriesUserEmail === userEmail && Object.keys(get().calendarEntries || {}).length > 0
                set({
                    isEntriesLoading: false,
                    entriesError: stillHasCachedEntries ? null : (error.message || 'Failed to fetch entries'),
                })
                throw error
            } finally {
                inflightEntriesFetch = null
                inflightEntriesUserEmail = null
            }
        })()

        return inflightEntriesFetch
    },

    // Add entry to Backend
    addEntry: async (date, entryData) => {
        try {
            const { selectedCategory, selectedGenres, user } = get()
            const finalGenres = entryData.genres && entryData.genres.length > 0 ? entryData.genres : (selectedGenres.length > 0 ? selectedGenres : ['General'])
            const payload = {
                ...entryData,
                date,
                category: selectedCategory || 'Movies', // Fallback
                genres: finalGenres, // Send Array from form data
                genre: finalGenres[0] || 'General', // Legacy fallback
                userEmail: user?.email // Include Email
            }
            console.log("Adding Entry Payload:", payload)

            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const response = await fetch(`${API_URL}/api/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const savedEntry = await response.json()
                set((state) => ({
                    calendarEntries: {
                        ...state.calendarEntries,
                        [date]: [...(state.calendarEntries[date] || []), savedEntry]
                    },
                    entriesUpdatedAt: Date.now(),
                    entriesUserEmail: user?.email || state.entriesUserEmail,
                }))
            } else {
                console.error('Failed to save entry to DB')
            }
        } catch (error) {
            console.error('Error saving entry:', error)
        }
    },

    // Update entry in Backend
    updateEntry: async (id, date, updates) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const response = await fetch(`${API_URL}/api/entries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (response.ok) {
                const updated = await response.json()
                set((state) => {
                    // Start with copy of calendar entries
                    const newEntries = { ...state.calendarEntries }
                    const listStats = newEntries[date] || []
                    newEntries[date] = listStats.map(e => e._id === id ? updated : e)
                    return {
                        calendarEntries: newEntries,
                        entriesUpdatedAt: Date.now(),
                        entriesUserEmail: get().user?.email || state.entriesUserEmail,
                    }
                })
            } else {
                console.error('Failed to update entry')
            }
        } catch (error) {
            console.error('Error updating entry:', error)
        }
    },

    // Remove entry from Backend
    removeEntry: async (id, date) => {
        console.log("Attempting to delete:", id, "from date:", date)
        try {
            // Optimistic update
            set((state) => ({
                calendarEntries: {
                    ...state.calendarEntries,
                    [date]: (state.calendarEntries[date] || []).filter(e => e._id !== id)
                },
                entriesUpdatedAt: Date.now(),
                entriesUserEmail: get().user?.email || state.entriesUserEmail,
            }))

            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const response = await fetch(`${API_URL}/api/entries/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                console.log("Delete success on server, refreshing...")
                get().fetchEntries({ force: true }).catch(() => {})
            } else {
                console.error('Failed to delete entry from DB')
                alert("Failed to delete from server. Check console.")
                // Re-fetch to revert optimistic update
                get().fetchEntries({ force: true }).catch(() => {})
            }
        } catch (error) {
            console.error('Error deleting entry:', error)
            alert("Error deleting entry.")
        }
    },
    // --- Custom Genres ---
    customGenres: [],

    fetchCustomGenres: async () => {
        try {
            const { user } = get()
            if (!user?.email) return
            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const res = await fetch(`${API_URL}/api/genres?email=${user.email}`)
            const data = await res.json()
            set({ customGenres: data })
        } catch (error) {
            console.error('Failed to fetch genres:', error)
        }
    },

    addCustomGenre: async (genreData) => {
        try {
            const { user, selectedCategory } = get()
            const payload = {
                ...genreData,
                userEmail: user?.email,
                category: selectedCategory || 'Movies' // Default to Movies if null
            }
            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const res = await fetch(`${API_URL}/api/genres`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                const newGenre = await res.json()
                set(state => ({ customGenres: [...state.customGenres, newGenre] }))
            }
        } catch (error) {
            console.error('Failed to add genre:', error)
        }
    },

    deleteCustomGenre: async (id) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const res = await fetch(`${API_URL}/api/genres/${id}`, { method: 'DELETE' })
            if (res.ok) {
                set(state => ({
                    customGenres: state.customGenres.filter(g => g._id !== id), // Changed g.id to g._id to match typical MongoDB _id
                    // Also deselect if selected
                    selectedGenres: state.selectedGenres.filter(g => g !== id)
                }))
            }
        } catch (error) {
            console.error('Failed to delete genre:', error)
        }
    },

}), {
    name: 'movie-catalogue-storage',
    partialize: (state) => ({
        selectedGenres: state.selectedGenres,
        selectedCategory: state.selectedCategory,
        selectedMonth: state.selectedMonth,
        calendarEntries: sanitizeEntriesByDateForCache(state.calendarEntries),
        entriesUpdatedAt: state.entriesUpdatedAt,
        entriesUserEmail: state.entriesUserEmail,
        user: state.user,
        token: state.token
        // Don't persist customGenres in local storage, fetch them fresh on login/mount
    }),
}))
