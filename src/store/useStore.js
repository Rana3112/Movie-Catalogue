import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(persist((set, get) => ({
    selectedYear: 2025,
    selectedCategory: null,
    selectedGenres: [],
    calendarEntries: {}, // key: date string iso, value: array of entries

    // Auth State
    user: null,
    token: null,

    setUser: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),

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

    // Fetch entries from Backend
    fetchEntries: async () => {
        try {
            const response = await fetch(`https://movie-catalogue-api.onrender.com=${Date.now()}`)
            const data = await response.json()
            set({ calendarEntries: data })
        } catch (error) {
            console.error('Failed to fetch entries:', error)
        }
    },

    // Add entry to Backend
    addEntry: async (date, entryData) => {
        try {
            const { selectedCategory, selectedGenres, user } = get()
            const payload = {
                date,
                ...entryData,
                category: selectedCategory || 'Movies', // Fallback
                genres: selectedGenres, // Send Array
                genre: selectedGenres[0] || 'General', // Legacy fallback
                userEmail: user?.email // Include Email
            }
            console.log("Adding Entry Payload:", payload)

            const response = await fetch('https://movie-catalogue-api.onrender.com/api/entries', {
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
                    }
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
            const response = await fetch(`https://movie-catalogue-api.onrender.com/api/entries/${id}`, {
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
                    return { calendarEntries: newEntries }
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
                }
            }))

            const response = await fetch(`https://movie-catalogue-api.onrender.com/api/entries/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                console.log("Delete success on server, refreshing...")
                get().fetchEntries()
            } else {
                console.error('Failed to delete entry from DB')
                alert("Failed to delete from server. Check console.")
                // Re-fetch to revert optimistic update
                get().fetchEntries()
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
            const res = await fetch(`https://movie-catalogue-api.onrender.com/api/genres?email=${user.email}`)
            const data = await res.json()
            set({ customGenres: data })
        } catch (error) {
            console.error('Failed to fetch genres:', error)
        }
    },

    addCustomGenre: async (genreData) => {
        try {
            const { user } = get()
            const payload = { ...genreData, userEmail: user?.email }
            const res = await fetch('https://movie-catalogue-api.onrender.com/api/genres', {
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
            const res = await fetch(`https://movie-catalogue-api.onrender.com/api/genres/${id}`, { method: 'DELETE' })
            if (res.ok) {
                set(state => ({
                    customGenres: state.customGenres.filter(g => g.id !== id),
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
        user: state.user,
        token: state.token
        // Don't persist customGenres in local storage, fetch them fresh on login/mount
    }),
}))
