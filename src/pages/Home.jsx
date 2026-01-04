import YearBarrel from '../components/canvas/YearBarrel'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { LogOut, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import LightPillar from '../components/LightPillar'
import { SettingsIcon } from '../components/ui/SettingsIcon'
import UserBadge from '../components/ui/UserBadge'

export default function Home() {
    const { logout, isGuest } = useStore()
    const navigate = useNavigate()
    const [showSettings, setShowSettings] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    // ... (keep handleFixEntries if needed, or remove it to clean up code) ...
    // skipping handleFixEntries for brevity in replacement if not modified, but better to include context or just replace the component logic parts.

    // Better approach: minimal targeted replacement
    const handleMySpace = () => {
        if (isGuest) {
            if (confirm("Create an account to save your personal space!")) {
                navigate('/signup')
            }
        } else {
            navigate('/myspace')
        }
    }

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col items-center justify-center">
            {/* ... Background ... */}
            <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
                <LightPillar
                    topColor="#5227FF"
                    bottomColor="#FF9FFC"
                    intensity={1.0}
                    rotationSpeed={0.3}
                    glowAmount={0.005}
                    pillarWidth={3.0}
                    pillarHeight={0.4}
                    noiseIntensity={0.5}
                    pillarRotation={0}
                    interactive={false}
                    mixBlendMode="normal"
                />
            </div>

            {/* User Badge - Top Left */}
            <div className="absolute top-8 left-8 z-20">
                <UserBadge />
            </div>

            <div className="absolute top-10 left-0 w-full text-center z-10 pointer-events-none">
                <h1 className="text-4xl font-bold text-white/90 uppercase tracking-[0.2em] font-light">Time Archive</h1>
                <p className="text-white/50 text-sm mt-2">Drag to explore. Click to select.</p>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-8 right-8 z-20 flex items-center gap-4">

                <button
                    onClick={handleMySpace}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/20 backdrop-blur-sm group"
                >
                    <LayoutGrid size={16} className="group-hover:text-purple-300 transition-colors" />
                    <span className="text-xs uppercase tracking-wider font-medium">My Space</span>
                </button>

                {!isGuest && (
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/20 backdrop-blur-sm p-1"
                    >
                        <SettingsIcon size={20} />
                    </button>
                )}

                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-2 px-4 py-2 ${isGuest ? 'bg-[#FFD700] text-black hover:bg-[#ffe033]' : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'} rounded-full transition-all border border-white/5 hover:border-white/20 backdrop-blur-sm`}
                >
                    {isGuest ? (
                        <span className="text-xs uppercase tracking-wider font-bold">Sign Up</span>
                    ) : (
                        <>
                            <span className="text-xs uppercase tracking-wider font-medium">Exit</span>
                            <LogOut size={16} />
                        </>
                    )}
                </button>
            </div>

            {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}

            <YearBarrel />
        </div>
    )
}
