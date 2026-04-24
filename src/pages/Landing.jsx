import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { Capacitor } from '@capacitor/core'
import { ArrowRight, Code2, Film, Layers, Database, Lock } from 'lucide-react'
import { useState } from 'react'

const isNative = Capacitor.isNativePlatform()

export default function Landing() {
    const navigate = useNavigate()
    const { loginAsGuest } = useStore()
    const [showStack, setShowStack] = useState(false)

    const handleGuestEntry = () => {
        loginAsGuest()
        navigate('/')
    }

    const techStack = [
        { name: 'React + Vite', icon: <Code2 size={18} />, desc: 'Frontend Architecture' },
        { name: 'Three.js / Fiber', icon: <Layers size={18} />, desc: '3D Interactive Canvas' },
        { name: 'Node / Express', icon: <Database size={18} />, desc: 'RESTful Backend API' },
        { name: 'MongoDB Atlas', icon: <Database size={18} />, desc: 'Data Persistence' },
        { name: 'JWT Auth', icon: <Lock size={18} />, desc: 'Secure Authentication' },
    ]

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col items-center justify-center font-sans">
            {/* Background */}
            {isNative ? (
                <div className="absolute inset-0 z-0">
                    <div className="mobile-pillar-bg mobile-landing-bg">
                        <div className="pillar pillar-1" />
                        <div className="pillar pillar-2" />
                        <div className="pillar pillar-3" />
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 z-0">
                    <LightPillarBg />
                </div>
            )}

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-6xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full">
                <div className="flex flex-col gap-8 text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1
                            className="font-bold tracking-tighter mb-4"
                            style={{
                                fontSize: isNative ? 'clamp(48px, 14vw, 72px)' : 'clamp(60px, 8vw, 96px)',
                                lineHeight: 0.95,
                                color: 'transparent',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FFF1A8 40%, #ffffff 100%)',
                            }}
                        >
                            CATEG<br />LOGE
                        </h1>
                        <p
                            className="font-light max-w-md pl-4"
                            style={{
                                fontSize: isNative ? 16 : 18,
                                color: 'var(--color-text-secondary)',
                                borderLeft: '2px solid var(--color-accent-gold)',
                                lineHeight: 1.7,
                            }}
                        >
                            Curated Cinema. <br />
                            {isNative ? 'Your Personal Catalogue.' : '3D Interactive Catalogue.'} <br />
                            Personalized Watchlists.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col gap-4 max-w-xs"
                    >
                        <button
                            onClick={handleGuestEntry}
                            className="pressable flex items-center justify-between px-6 py-4 bg-[#FFD700] text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        >
                            <span>Explore Demo</span>
                            <ArrowRight className="transition-transform" />
                        </button>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="pressable flex-1 py-3 px-4 border border-white/20 text-white rounded-lg text-sm uppercase tracking-wider"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="pressable flex-1 py-3 px-4 border border-white/20 text-white rounded-lg text-sm uppercase tracking-wider"
                            >
                                Sign Up
                            </button>
                        </div>
                    </motion.div>
                </div>

                <div className="flex flex-col items-end justify-center pointer-events-none md:pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="text-right"
                    >
                        <button
                            onClick={() => setShowStack(!showStack)}
                            className="flex items-center gap-3 text-white/40 active:text-[#00E5FF] transition-colors mb-4"
                        >
                            <span className="text-sm uppercase tracking-[0.2em]">Engineering Breakdown</span>
                            <Code2 size={24} className="transition-transform" />
                        </button>
                        {showStack && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-80 text-left"
                            >
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Film size={16} className="text-[#00E5FF]" /> Tech Stack
                                </h3>
                                <div className="space-y-3">
                                    {techStack.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-white/70">
                                            <div className="p-2 bg-white/5 rounded-lg text-[#FFD700]">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{item.name}</div>
                                                <div className="text-[10px] uppercase text-white/30">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/40">
                                    Built by Utkarsh. Designed for immersion.
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            <div className="absolute bottom-8 w-full text-center text-white/20 text-xs uppercase tracking-widest pointer-events-none">
                Est. 2025 • Utkarsh.sbs
            </div>
        </div>
    )
}

// Web-only LightPillar background (lazy loaded)
import { lazy, Suspense } from 'react'
const LightPillar = lazy(() => import('../components/LightPillar'))

function LightPillarBg() {
    return (
        <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
            <LightPillar
                topColor="#FFD700"
                bottomColor="#00E5FF"
                intensity={0.8}
                rotationSpeed={0.2}
                glowAmount={0.005}
                pillarWidth={4.0}
                pillarHeight={0.6}
                interactive={true}
            />
        </Suspense>
    )
}
