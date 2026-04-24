import { lazy, Suspense } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Settings, Play } from 'lucide-react'
import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import MobileYearBarrel from '../components/mobile/MobileYearBarrel'

const isNative = Capacitor.isNativePlatform()

// Lazy load 3D components — only fetched on web platform
const LightPillar = lazy(() => import('../components/LightPillar'))
const YearBarrel = lazy(() => import('../components/canvas/YearBarrel'))

// ──────────────────────────────────────────────
// Shared font injection (Montserrat from Google)
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

export default function Home() {
  const { logout, isGuest } = useStore()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

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

  // ── Native (Android) — Light Glassmorphism Layout ──
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
        {/* Subtle light radials for depth — not gradients on background itself */}
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

        {/* ── Top Navigation Bar ── 4 fully separate pill buttons ── */}
        <div className="flex-shrink-0 relative z-20 px-4 pt-4 pb-0">
          <div className="flex w-full" style={{ gap: 8 }}>

            {/* Pill 1 — Avatar only (circle) */}
            <UserBadge />

            {/* Pill 2 — MY SPACE */}
            <button
              id="home-myspace-btn"
              onClick={handleMySpace}
              aria-label="My Space"
              className="pressable flex items-center justify-center gap-2 flex-1"
              style={{
                background: '#E8EAED',
                borderRadius: 50,
                boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                border: '1px solid rgba(255,255,255,0.95)',
                padding: '11px 16px',
                minHeight: 48,
              }}
            >
              <LayoutGrid size={15} strokeWidth={1.5} style={{ color: '#6B7280' }} />
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#4B5563',
                fontFamily: "'Montserrat', 'Raleway', sans-serif",
                whiteSpace: 'nowrap',
              }}>
                My Space
              </span>
            </button>

            {/* Pill 3 — Settings icon (only if logged in) */}
            {!isGuest && (
              <button
                id="home-settings-btn"
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
                className="pressable flex items-center justify-center"
                style={{
                  background: '#E8EAED',
                  borderRadius: 50,
                  boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                  border: '1px solid rgba(255,255,255,0.95)',
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                }}
              >
                <Settings size={16} strokeWidth={1.5} style={{ color: '#6B7280' }} />
              </button>
            )}

            {/* Pill 4 — EXIT */}
            <button
              id="home-exit-btn"
              onClick={handleLogout}
              aria-label={isGuest ? 'Sign Up' : 'Exit'}
              className="pressable flex items-center justify-center"
              style={{
                background: '#E8EAED',
                borderRadius: 50,
                boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                border: '1px solid rgba(255,255,255,0.95)',
                padding: '11px 16px',
                minHeight: 48,
                flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#4B5563',
                fontFamily: "'Montserrat', 'Raleway', sans-serif",
                whiteSpace: 'nowrap',
              }}>
                {isGuest ? 'Sign Up' : 'Exit'}
              </span>
            </button>

          </div>
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
              fontFamily: "'Montserrat', 'Raleway', sans-serif",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Time Archive
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 400,
              color: '#9CA3AF',
              letterSpacing: '0.06em',
              fontFamily: "'Montserrat', 'Raleway', sans-serif",
            }}
          >
            Scroll to explore. Tap to select.
          </p>
        </div>

        {/* ── StreamZone Button ── */}
        <div style={{ padding: '0 16px', marginBottom: 12, zIndex: 20, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/streaming')}
            className="pressable"
            style={{
              background: '#E8EAED',
              color: '#e50914', border: '1px solid rgba(255,255,255,0.95)', borderRadius: 24, padding: '12px 32px',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
              cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase'
            }}
          >
            <Play size={18} fill="#e50914" /> Enter StreamZone
          </button>
        </div>

        {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}

        <div
          className="flex-1 w-full overflow-hidden relative z-10"
          style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 40 }}
        >
          <MobileYearBarrel />
        </div>
      </div>
    )
  }

  // ── Web Dark Layout (unchanged) ──
  return (
    <div
      className="h-screen w-full relative overflow-hidden flex flex-col"
      style={{
        background: '#000',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
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
        </Suspense>
      </div>

      {/* Header */}
      <div className="flex-shrink-0 relative z-20 px-5 pt-6 pb-2">
        <div className="flex items-center justify-between w-full">
          <UserBadge />

          <div className="flex items-center gap-2">
            <button
              onClick={handleMySpace}
              aria-label="My Space"
              className="pressable flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.7)',
                minHeight: 44,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }}
            >
              <LayoutGrid size={15} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-medium">My Space</span>
            </button>

            {!isGuest && (
              <button
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
                className="pressable flex items-center justify-center rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  width: 44,
                  height: 44,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                }}
              >
                <Settings size={16} strokeWidth={1.5} />
              </button>
            )}

            <button
              onClick={handleLogout}
              aria-label={isGuest ? 'Sign Up' : 'Logout'}
              className="pressable flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{
                background: isGuest
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isGuest ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isGuest ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                minHeight: 44,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }}
            >
              {isGuest ? (
                <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Sign Up</span>
              ) : (
                <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Exit</span>
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-5">
          <h1
            className="font-extralight uppercase"
            style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.3em', fontWeight: 200 }}
          >
            Time Archive
          </h1>
          <div
            className="mx-auto mt-2"
            style={{
              width: 24,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)',
            }}
          />
          <p
            className="mt-2"
            style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: 10, letterSpacing: '0.12em', fontWeight: 300 }}
          >
            Drag to explore. Click to select.
          </p>
        </div>
      </div>

      <div className="absolute top-[10%] right-8 z-30 hidden md:block">
        <button
            onClick={() => navigate('/streaming')}
            style={{
              background: 'linear-gradient(135deg, #e50914, #ff6b35)',
              color: '#fff', border: 'none', borderRadius: 24, padding: '12px 24px',
              fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)',
              cursor: 'pointer'
            }}
          >
            <Play size={18} fill="#fff" /> Enter StreamZone
        </button>
      </div>

      {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}

      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-white/50 text-lg">Loading...</div>}>
        <div className="flex-1 w-full relative z-0" style={{ touchAction: 'none' }}>
          <YearBarrel />
        </div>
      </Suspense>
    </div>
  )
}
