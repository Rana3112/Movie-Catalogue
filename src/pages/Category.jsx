import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import CategoryBarrelCanvas from '../components/canvas/CategoryBarrel'
import { motion } from 'framer-motion'

export default function Category() {
    const year = useStore(state => state.selectedYear)
    const navigate = useNavigate()
    console.log("Category Page Loaded - V2") // Deployment Verification Log

    return (
        <div className="h-screen w-full bg-black relative flex flex-col overflow-hidden">
            {/* 2D Overlay - Static for Stability */}
            <div className="absolute top-10 w-full text-center z-10 pointer-events-none">
                <h1 className="text-[120px] font-bold text-white/10 select-none">{year}</h1>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-2 flex flex-col items-center gap-4 pointer-events-auto">
                    <p className="text-white text-xl tracking-widest uppercase">Select Category</p>

                    {/* My Calendar Button - Always Visible */}
                    <button
                        onClick={() => {
                            useStore.getState().setCategory(null)
                            useStore.setState({ selectedGenres: [] }) // Clear Filters
                            navigate('/calendar')
                        }}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/80 text-sm backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        My Calendar (All)
                    </button>
                </div>
            </div>

            {/* 3D Scene */}
            <div className="flex-1 w-full relative z-0">
                <CategoryBarrelCanvas />
            </div>
        </div>
    )
}
