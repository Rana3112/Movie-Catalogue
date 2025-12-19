import { useStore } from '../store/useStore'
import CategoryBarrelCanvas from '../components/canvas/CategoryBarrel'
import { motion } from 'framer-motion'

export default function Category() {
    const year = useStore(state => state.selectedYear)

    return (
        <div className="h-screen w-full bg-black relative flex flex-col overflow-hidden">
            {/* 2D Overlay */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute top-10 w-full text-center z-10 pointer-events-none"
            >
                <h1 className="text-[120px] font-bold text-white/10 select-none">{year}</h1>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-2">
                    <p className="text-white text-xl tracking-widest uppercase">Select Category</p>
                </div>
            </motion.div>

            {/* 3D Scene */}
            <div className="flex-1 w-full relative z-0">
                <CategoryBarrelCanvas />
            </div>
        </div>
    )
}
