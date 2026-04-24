import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Capacitor } from '@capacitor/core'
import { LayoutGrid, Settings, ChevronLeft } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import MobileCategoryBarrel from '../components/mobile/MobileCategoryBarrel'

const isNative = Capacitor.isNativePlatform()

// Lazy load 3D components - only fetched on web
const CategoryBarrelCanvas = lazy(() => import('../components/canvas/CategoryBarrel'))
const FloatingLines = lazy(() => import('../components/FloatingLines'))

// ──────────────────────────────────────────────
// Shared font injection (Montserrat)
// ──────────────────────────────────────────────
const montserratLink = typeof document !== 'undefined' && (() => {
  if (!document.getElementById('montserrat-font')) {
    const link = document.createElement('link')
    link.id = 'montserrat-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }
})()

export default function Category() {
  const year = useStore(state => state.selectedYear)
  const { logout, isGuest } = useStore()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleMySpace = () => {
    if (isGuest) {
      if (confirm("Create an account to save your personal space!")) {
        navigate('/signup')
      }
    } else {
      navigate('/myspace')
    }
  }

  // ── Native (Android) — Light Neumorphic Layout ──
  if (isNative) {
    return (
      <div
        className="h-screen w-full relative overflow-hidden flex flex-col"
        style={{
          background: '#ECEEF2',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          fontFamily: "'Montserrat', 'Raleway', sans-serif",
        }}
      >
        {/* Subtle light radials for depth */}
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div style={{
            position: 'absolute',
            top: '5%',
            left: '10%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,210,240,0.35) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '15%',
            right: '5%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180,200,230,0.25) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
        </div>

        {/* ── Simplified Native Header ── */}
        <div className="flex-shrink-0 relative z-20 px-4 pt-4 flex items-center justify-between">
            <button
                onClick={() => navigate('/home')}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{ 
                    background: '#E8EAED', 
                    boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                    border: '1px solid rgba(255,255,255,0.95)',
                }}
            >
                <ChevronLeft size={22} style={{ color: '#4B5563' }} />
            </button>
            
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                Select Category
            </h1>

            <UserBadge />
        </div>

        {/* ── Title Section ── */}
        <div
          className="flex-shrink-0 text-center relative z-10"
          style={{ marginTop: 28, marginBottom: 20, paddingHorizontal: 16 }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: '#2D3748',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Select Category
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 400,
              color: '#9CA3AF',
              letterSpacing: '0.06em',
            }}
          >
            Choose your path for {year}
          </p>
        </div>

        {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}

        {/* ── Category Selector ── */}
        <div className="flex-1 relative z-10 w-full">
          <MobileCategoryBarrel />
        </div>
      </div>
    )
  }

  // ── Web Layout (Dark theme maintained) ──
  return (
    <div
      className="h-screen w-full bg-black relative flex flex-col overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="absolute inset-0 z-0 bg-black transition-colors duration-700 ease-in-out">
        {['Movies', 'Series', 'Anime'].map((cat) => (
          <div
            key={cat}
            className={`absolute inset-0 bg-black transition-opacity duration-700 ease-in-out mix-blend-screen ${hoveredCategory === cat ? 'opacity-[0.15]' : 'opacity-0'}`}
            style={{
              backgroundImage: `url(/${cat.toLowerCase()}.png)`,
              animation: hoveredCategory === cat ? 'slideLeft 60s linear infinite' : 'none',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100vh',
              backgroundPosition: '0 0',
            }}
          />
        ))}
        <Suspense fallback={<div className="absolute inset-0 bg-[#050510]" />}>
          <div className="absolute inset-0 transition-opacity duration-700 opacity-100">
            <FloatingLines
              linesGradient={['#8400ff', '#ff00aa', '#2f4ba2']}
              animationSpeed={0.5}
            />
          </div>
        </Suspense>
      </div>

      <div className="flex-shrink-0 relative z-20 px-5 pt-6 pb-3">
        <div className="flex items-center justify-between w-full">
          <UserBadge />
          <div className="text-center">
            <h2 style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '0.15em', fontWeight: 200, textTransform: 'uppercase' }}>{year}</h2>
            <p style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.2em', marginTop: 2, fontWeight: 300, textTransform: 'uppercase' }}>Select Category</p>
          </div>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/50">Loading...</div>}>
          <CategoryBarrelCanvas onHover={setHoveredCategory} />
        </Suspense>
      </div>
    </div>
  )
}