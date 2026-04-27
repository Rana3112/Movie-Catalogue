import { useNavigate } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { Capacitor } from '@capacitor/core'
import { ArrowRight, Code2, Film, Layers, Database, Lock } from 'lucide-react'
import { useState } from 'react'
import { shouldUseNeumorphicLayout } from '../lib/platform'

const isNative = Capacitor.isNativePlatform()
const useNeumorphicLayout = shouldUseNeumorphicLayout()

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

    if (useNeumorphicLayout) {
        return (
            <div
                className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-6"
                style={{
                    background: '#ECEEF2',
                    fontFamily: "'Montserrat', 'Raleway', sans-serif",
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div style={{
                        position: 'absolute',
                        top: '6%',
                        left: '8%',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(200,210,240,0.35) 0%, transparent 70%)',
                        filter: 'blur(42px)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '8%',
                        right: '6%',
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(180,200,230,0.25) 0%, transparent 70%)',
                        filter: 'blur(52px)',
                    }} />
                </div>

                <main className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
                    <section
                        style={{
                            background: '#E8EAED',
                            borderRadius: 40,
                            boxShadow: '8px 8px 18px rgba(180,190,210,0.5), -4px -4px 12px rgba(255,255,255,0.95)',
                            border: '1px solid rgba(255,255,255,0.95)',
                            padding: '42px 34px',
                        }}
                    >
                        <Motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div
                                className="inline-flex items-center justify-center mb-8"
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    background: '#E8EAED',
                                    boxShadow: 'inset 4px 4px 10px rgba(180,190,210,0.5), inset -2px -2px 6px rgba(255,255,255,0.95)',
                                    border: '1px solid rgba(255,255,255,0.95)',
                                }}
                            >
                                <Film size={30} style={{ color: '#4B5563' }} />
                            </div>

                            <h1
                                style={{
                                    fontSize: 'clamp(42px, 7vw, 82px)',
                                    lineHeight: 0.95,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    color: '#2D3748',
                                    textTransform: 'uppercase',
                                    margin: 0,
                                }}
                            >
                                Categ<br />loge
                            </h1>

                            <p
                                style={{
                                    marginTop: 20,
                                    color: '#64748B',
                                    fontSize: 16,
                                    lineHeight: 1.8,
                                    maxWidth: 460,
                                    letterSpacing: '0.02em',
                                }}
                            >
                                Your personal catalogue for cinematic discovery, watch planning, StreamZone browsing, and saved movie memories.
                            </p>
                        </Motion.div>

                        <div className="mt-9 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleGuestEntry}
                                className="pressable flex items-center justify-center gap-3"
                                style={{
                                    background: '#E8EAED',
                                    borderRadius: 24,
                                    boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                                    border: '1px solid rgba(255,255,255,0.95)',
                                    padding: '16px 24px',
                                    minHeight: 58,
                                    color: '#1E293B',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    flex: 1,
                                }}
                            >
                                Explore Demo <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="pressable"
                                style={{
                                    background: '#E8EAED',
                                    borderRadius: 24,
                                    boxShadow: 'inset 4px 4px 10px rgba(180,190,210,0.5), inset -2px -2px 6px rgba(255,255,255,0.95)',
                                    border: '1px solid rgba(255,255,255,0.95)',
                                    padding: '16px 24px',
                                    minHeight: 58,
                                    color: '#4B5563',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    flex: 1,
                                }}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="pressable"
                                style={{
                                    background: '#1E293B',
                                    borderRadius: 24,
                                    boxShadow: '4px 4px 12px rgba(100,116,139,0.35), -2px -2px 6px rgba(255,255,255,0.95)',
                                    border: '1px solid rgba(255,255,255,0.95)',
                                    padding: '16px 24px',
                                    minHeight: 58,
                                    color: '#F8FAFC',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    flex: 1,
                                }}
                            >
                                Sign Up
                            </button>
                        </div>
                    </section>

                    <section
                        style={{
                            background: '#E8EAED',
                            borderRadius: 32,
                            boxShadow: '6px 6px 14px rgba(180,190,210,0.5), -3px -3px 8px rgba(255,255,255,0.95)',
                            border: '1px solid rgba(255,255,255,0.95)',
                            padding: 28,
                        }}
                    >
                        <button
                            onClick={() => setShowStack(!showStack)}
                            className="pressable w-full flex items-center justify-between"
                            style={{
                                background: '#E8EAED',
                                borderRadius: 24,
                                boxShadow: 'inset 3px 3px 8px rgba(180,190,210,0.45), inset -2px -2px 6px rgba(255,255,255,0.95)',
                                border: '1px solid rgba(255,255,255,0.95)',
                                padding: '16px 18px',
                                color: '#475569',
                            }}
                        >
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                                Engineering Breakdown
                            </span>
                            <Code2 size={20} />
                        </button>

                        <div className="mt-5 space-y-3">
                            {(showStack ? techStack : techStack.slice(0, 3)).map((item) => (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-4"
                                    style={{
                                        background: '#E8EAED',
                                        borderRadius: 22,
                                        boxShadow: '4px 4px 10px rgba(180,190,210,0.45), -2px -2px 6px rgba(255,255,255,0.95)',
                                        border: '1px solid rgba(255,255,255,0.95)',
                                        padding: 16,
                                    }}
                                >
                                    <div
                                        className="flex items-center justify-center"
                                        style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 16,
                                            background: '#E8EAED',
                                            boxShadow: 'inset 3px 3px 7px rgba(180,190,210,0.45), inset -2px -2px 5px rgba(255,255,255,0.95)',
                                            color: '#4B5563',
                                        }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div style={{ color: '#1E293B', fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                                        <div style={{ color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        )
    }

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
                    <Motion.div
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
                    </Motion.div>

                    <Motion.div
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
                    </Motion.div>
                </div>

                <div className="flex flex-col items-end justify-center pointer-events-none md:pointer-events-auto">
                    <Motion.div
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
                            <Motion.div
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
                            </Motion.div>
                        )}
                    </Motion.div>
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
