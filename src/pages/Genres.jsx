import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Background3D from '../components/canvas/Background3D'
import { Plus, Check, X, Trash } from 'lucide-react'

const DEFAULT_GENRES = [
    { id: 'Action', label: 'Action', desc: 'High energy and physical stunts' },
    { id: 'Drama', label: 'Drama', desc: 'Character-driven stories' },
    { id: 'Comedy', label: 'Comedy', desc: 'Humor and amusement' },
    { id: 'Horror', label: 'Horror', desc: 'Fear and suspense' },
    { id: 'Romance', label: 'Romance', desc: 'Love and relationships' },
    { id: 'Sci-Fi', label: 'Sci-Fi', desc: 'Futuristic and science-based' },
    { id: 'Fantasy', label: 'Fantasy', desc: 'Magic and supernatural' },
    { id: 'Thriller', label: 'Thriller', desc: 'Excitement and suspense' },
]

export default function Genres() {
    const {
        selectedYear, selectedCategory, selectedGenres, toggleGenre,
        customGenres, fetchCustomGenres, addCustomGenre, deleteCustomGenre
    } = useStore()
    const navigate = useNavigate()
    const [showCustomModal, setShowCustomModal] = useState(false)
    const [customGenreName, setCustomGenreName] = useState('')

    useEffect(() => {
        fetchCustomGenres()
    }, [fetchCustomGenres])

    const allGenres = [...DEFAULT_GENRES, ...customGenres]

    const handleAddCustom = () => {
        if (!customGenreName.trim()) return
        const newId = customGenreName.toLowerCase().replace(/\s+/g, '-')

        // Prevent duplicate IDs locally
        if (allGenres.some(g => g.id === newId)) {
            alert("Genre already exists!")
            return
        }

        addCustomGenre({ id: newId, label: customGenreName, desc: 'Custom User Genre' })
        setCustomGenreName('')
        setShowCustomModal(false)
    }

    const handleDeleteCustom = (e, id) => {
        e.stopPropagation() // Prevent toggling selection
        if (confirm('Delete this custom genre?')) {
            deleteCustomGenre(id)
        }
    }

    return (
        <div className="min-h-screen w-full relative text-white font-sans overflow-x-hidden">
            <Background3D />

            {/* Header */}
            <header className="p-8 pb-4 border-b border-white/10 backdrop-blur-md flex justify-between items-end">
                <div>
                    <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        {selectedYear}
                    </h1>
                    <h2 className="text-2xl text-white/70 uppercase tracking-widest mt-1">{selectedCategory}</h2>
                </div>
                <button
                    onClick={() => navigate('/calendar')}
                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors rounded-full"
                >
                    {selectedGenres.length > 0 ? `Continue (${selectedGenres.length})` : 'Skip'}
                </button>
            </header>

            {/* Grid */}
            <main className="p-8 container mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allGenres.map((g) => {
                        const isSelected = selectedGenres.includes(g.id)
                        const isCustom = !DEFAULT_GENRES.some(dg => dg.id === g.id)

                        return (
                            <motion.button
                                key={g.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    toggleGenre(g.id)
                                }}
                                className={`
                    relative group h-40 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center justify-center p-4 transition-all duration-300
                    ${isSelected ? 'bg-white/20 border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-black/40 hover:bg-white/10'}
                 `}
                            >
                                {/* Glow effect */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity`} />

                                <span className="text-2xl font-bold z-10">{g.label}</span>
                                <span className="text-xs text-white/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 max-w-[80%] text-center">
                                    {g.desc}
                                </span>

                                {isSelected && (
                                    <div className="absolute top-4 right-4 text-green-400">
                                        <Check size={20} />
                                    </div>
                                )}

                                {/* Delete Button for Custom Genres */}
                                {isCustom && (
                                    <div
                                        onClick={(e) => handleDeleteCustom(e, g.id)}
                                        className="absolute top-4 left-4 text-red-400/50 hover:text-red-400 transition-colors z-20"
                                        title="Delete Genre"
                                    >
                                        <Trash size={16} />
                                    </div>
                                )}
                            </motion.button>
                        )
                    })}

                    {/* Custom Genre Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCustomModal(true)}
                        className="h-40 rounded-2xl border-2 border-dashed border-white/30 hover:border-white/80 bg-transparent flex flex-col items-center justify-center text-white/50 hover:text-white transition-all"
                    >
                        <Plus size={40} className="mb-2" />
                        <span className="text-lg">Custom Genre</span>
                    </motion.button>
                </div>
            </main >

            {/* Modal */}
            < AnimatePresence >
                {showCustomModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#1a1a1a] border border-white/20 p-8 rounded-3xl w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold">Create Genre</h3>
                                <button onClick={() => setShowCustomModal(false)} className="text-white/50 hover:text-white"><X /></button>
                            </div>

                            <input
                                type="text"
                                value={customGenreName}
                                onChange={(e) => setCustomGenreName(e.target.value)}
                                placeholder="e.g., Cyberpunk Noir"
                                className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500 mb-6"
                                autoFocus
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddCustom}
                                    className="flex-1 bg-white text-black py-4 rounded-xl font-bold uppercase hover:bg-gray-200 transition-colors"
                                >
                                    Add Genre
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )
                }
            </AnimatePresence >
        </div >
    )
}
