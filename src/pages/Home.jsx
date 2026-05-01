import { lazy, Suspense } from 'react'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clapperboard, LayoutGrid, Settings, Play } from 'lucide-react'
import { useState } from 'react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import MobileYearBarrel from '../components/mobile/MobileYearBarrel'
import { shouldUseCompactNativeLayout, shouldUseNeumorphicLayout } from '../lib/platform'
import { netflixNeumorphic, netflixRaisedStyle, netflixRedButtonStyle } from '../styles/netflixNeumorphic'

const isNative = shouldUseCompactNativeLayout()
const useDesktopNeumorphic = shouldUseNeumorphicLayout() && !isNative

// Lazy load 3D components — only fetched on web platform
const LightPillar = lazy(() => import('../components/LightPillar'))
const YearBarrel = lazy(() => import('../components/canvas/YearBarrel'))

// ──────────────────────────────────────────────
// Shared font injection (Montserrat from Google)
// ──────────────────────────────────────────────
if (typeof document !== 'undefined') {
  if (!document.getElementById('montserrat-font')) {
    const link = document.createElement('link')
    link.id = 'montserrat-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }
}

export default function Home() {
  const { logout, isGuest, selectedYear, setYear } = useStore()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const currentYear = new Date().getFullYear()
  const desktopYears = Array.from({ length: 25 }, (_, index) => currentYear - 12 + index)

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
          background: netflixNeumorphic.pageBackground,
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
            background: 'radial-gradient(circle, rgba(229,9,20,0.24) 0%, transparent 70%)',
            filter: 'blur(72px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '15%',
            right: '5%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(122,18,28,0.22) 0%, transparent 70%)',
            filter: 'blur(76px)',
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
                ...netflixRaisedStyle,
                borderRadius: 50,
                padding: '11px 16px',
                minHeight: 48,
              }}
            >
              <LayoutGrid size={15} strokeWidth={1.5} style={{ color: netflixNeumorphic.textSoft }} />
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: netflixNeumorphic.textSoft,
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
                  ...netflixRaisedStyle,
                  borderRadius: 50,
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                }}
              >
                <Settings size={16} strokeWidth={1.5} style={{ color: netflixNeumorphic.textSoft }} />
              </button>
            )}

            {/* Pill 4 — EXIT */}
            <button
              id="home-exit-btn"
              onClick={handleLogout}
              aria-label={isGuest ? 'Sign Up' : 'Exit'}
              className="pressable flex items-center justify-center"
              style={{
                ...netflixRaisedStyle,
                borderRadius: 50,
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
                color: netflixNeumorphic.textSoft,
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
              color: netflixNeumorphic.text,
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
              color: netflixNeumorphic.textSoft,
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
              ...netflixRedButtonStyle,
              borderRadius: 24, padding: '12px 32px',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
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

  if (useDesktopNeumorphic) {
    const archiveTheme = {
      page: '#080808',
      panel: '#151515',
      panelSoft: '#1B1B1F',
      panelRaised: '#202024',
      red: '#E50914',
      redDeep: '#8B0008',
      text: '#F5F5F1',
      textSoft: '#B3B3B3',
      muted: '#777777',
      border: 'rgba(255,255,255,0.08)',
      borderStrong: 'rgba(229,9,20,0.38)',
      raisedShadow: '12px 12px 28px rgba(0,0,0,0.62), -7px -7px 18px rgba(255,255,255,0.035)',
      insetShadow: 'inset 5px 5px 12px rgba(0,0,0,0.58), inset -4px -4px 10px rgba(255,255,255,0.035)',
      redShadow: '0 18px 34px rgba(229,9,20,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
    }

    return (
      <div
        className="min-h-screen w-full relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 12% 12%, rgba(229,9,20,0.18), transparent 28%),
            radial-gradient(circle at 88% 18%, rgba(139,0,8,0.16), transparent 30%),
            linear-gradient(135deg, #050505 0%, #111111 46%, #080808 100%)
          `,
          fontFamily: "'Montserrat', 'Raleway', sans-serif",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: '8%', left: '8%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,9,20,0.22) 0%, transparent 70%)', filter: 'blur(58px)' }} />
          <div style={{ position: 'absolute', right: '5%', bottom: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.045) 0%, transparent 68%)', filter: 'blur(64px)' }} />
        </div>

        <header className="relative z-10 max-w-7xl mx-auto px-8 pt-7">
          <div className="flex items-center justify-between gap-5" style={{ background: 'rgba(21,21,21,0.92)', borderRadius: 32, boxShadow: archiveTheme.raisedShadow, border: `1px solid ${archiveTheme.border}`, padding: '14px 18px', backdropFilter: 'blur(18px)' }}>
            <UserBadge />
            <nav className="flex items-center gap-3">
              <button onClick={handleMySpace} className="pressable flex items-center gap-2" style={{ background: archiveTheme.panelSoft, borderRadius: 24, boxShadow: archiveTheme.insetShadow, border: `1px solid ${archiveTheme.border}`, padding: '12px 18px', color: archiveTheme.textSoft, minHeight: 46 }}>
                <LayoutGrid size={15} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>My Space</span>
              </button>
              {!isGuest && (
                <button onClick={() => setShowSettings(true)} className="pressable flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 18, background: archiveTheme.panelSoft, boxShadow: archiveTheme.raisedShadow, border: `1px solid ${archiveTheme.border}`, color: archiveTheme.textSoft }} aria-label="Settings">
                  <Settings size={17} />
                </button>
              )}
              <button onClick={handleLogout} className="pressable" style={{ background: archiveTheme.panelSoft, borderRadius: 24, boxShadow: archiveTheme.raisedShadow, border: `1px solid ${archiveTheme.border}`, padding: '12px 18px', color: archiveTheme.textSoft, minHeight: 46, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {isGuest ? 'Sign Up' : 'Exit'}
              </button>
            </nav>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-8 py-10 grid grid-cols-[minmax(360px,0.9fr)_minmax(560px,1.1fr)] gap-8 items-stretch">
          <section style={{ background: `linear-gradient(145deg, ${archiveTheme.panelRaised}, ${archiveTheme.panel})`, borderRadius: 40, boxShadow: archiveTheme.raisedShadow, border: `1px solid ${archiveTheme.border}`, padding: 34 }}>
            <p style={{ fontSize: 12, color: '#D6D6D6', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>Movie Catalogue</p>
            <h1 style={{ marginTop: 22, color: archiveTheme.text, fontSize: 58, lineHeight: 1, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Time<br />Archive
            </h1>
            <p style={{ marginTop: 20, color: archiveTheme.textSoft, fontSize: 15, lineHeight: 1.8, maxWidth: 390 }}>
              Browse your catalogue by year, then move into categories, genres, calendar planning, or StreamZone.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-9">
              <button onClick={() => navigate('/streaming')} className="pressable flex items-center justify-center gap-3" style={{ background: `linear-gradient(135deg, ${archiveTheme.red}, #B20710)`, color: '#fff', border: `1px solid ${archiveTheme.borderStrong}`, borderRadius: 24, padding: '16px 18px', fontWeight: 800, fontSize: 12, boxShadow: archiveTheme.redShadow, letterSpacing: '0.12em', textTransform: 'uppercase', minHeight: 62 }}>
                <Play size={18} fill="#fff" /> StreamZone
              </button>
              <button onClick={() => navigate('/calendar')} className="pressable flex items-center justify-center gap-3" style={{ background: archiveTheme.panelSoft, color: archiveTheme.textSoft, border: `1px solid ${archiveTheme.border}`, borderRadius: 24, padding: '16px 18px', fontWeight: 800, fontSize: 12, boxShadow: archiveTheme.insetShadow, letterSpacing: '0.12em', textTransform: 'uppercase', minHeight: 62 }}>
                <CalendarDays size={18} /> Calendar
              </button>
            </div>
          </section>

          <section style={{ background: `linear-gradient(145deg, ${archiveTheme.panelRaised}, ${archiveTheme.panel})`, borderRadius: 40, boxShadow: archiveTheme.raisedShadow, border: `1px solid ${archiveTheme.border}`, padding: 28 }}>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p style={{ fontSize: 11, color: archiveTheme.muted, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700 }}>Select Year</p>
                <h2 style={{ marginTop: 8, fontSize: 38, color: archiveTheme.text, fontWeight: 700 }}>{selectedYear}</h2>
              </div>
              <div className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 24, background: archiveTheme.panelSoft, boxShadow: archiveTheme.insetShadow, color: archiveTheme.textSoft, border: `1px solid ${archiveTheme.border}` }}>
                <Clapperboard size={26} />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {desktopYears.map((year) => {
                const active = year === selectedYear
                return (
                  <button
                    key={year}
                    onClick={() => {
                      setYear(year)
                      navigate('/category')
                    }}
                    className="pressable"
                    style={{
                      background: active
                        ? `linear-gradient(145deg, rgba(229,9,20,0.32), ${archiveTheme.panelSoft})`
                        : archiveTheme.panelSoft,
                      borderRadius: 20,
                      boxShadow: active
                        ? `inset 5px 5px 12px rgba(0,0,0,0.62), 0 0 22px rgba(229,9,20,0.22)`
                        : archiveTheme.raisedShadow,
                      border: active ? `1px solid ${archiveTheme.borderStrong}` : `1px solid ${archiveTheme.border}`,
                      minHeight: 74,
                      color: active ? archiveTheme.text : archiveTheme.textSoft,
                      fontSize: 18,
                      fontWeight: active ? 850 : 650,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          </section>
        </main>

        {showSettings && <TimeSettingsModal onClose={() => setShowSettings(false)} />}
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
