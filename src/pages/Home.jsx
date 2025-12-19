import YearBarrel from '../components/canvas/YearBarrel'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'

export default function Home() {
    const { logout } = useStore()
    const navigate = useNavigate()
    const [showSettings, setShowSettings] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden">
            <div className="absolute top-10 left-0 w-full text-center z-10 pointer-events-none">
                <h1 className="text-4xl font-bold text-white/90 uppercase tracking-[0.2em] font-light">Time Archive</h1>
                <p className="text-white/50 text-sm mt-2">Drag to explore. Click to select.</p>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/20 backdrop-blur-sm"
                >
                    <Settings size={16} />
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/20 backdrop-blur-sm"
                >
                    <span className="text-xs uppercase tracking-wider font-medium">Exit</span>
                    <LogOut size={16} />
                </button>
            </div>

            {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}

            <YearBarrel />
        </div>
    )
}
