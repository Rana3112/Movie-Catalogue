import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Film, Sparkles, Tv } from 'lucide-react'
import TimeSettingsModal from '../components/common/TimeSettingsModal'
import UserBadge from '../components/ui/UserBadge'
import MobileCategoryBarrel from '../components/mobile/MobileCategoryBarrel'
import { shouldUseCompactNativeLayout, shouldUseNeumorphicLayout } from '../lib/platform'
import { netflixNeumorphic, netflixPageStyle, netflixRaisedStyle, netflixRedButtonStyle, netflixSurfaceStyle } from '../styles/netflixNeumorphic'

const isNative = shouldUseCompactNativeLayout()
const useDesktopNeumorphic = shouldUseNeumorphicLayout() && !isNative

// Lazy load 3D components - only fetched on web
const CategoryBarrelCanvas = lazy(() => import('../components/canvas/CategoryBarrel'))
const FloatingLines = lazy(() => import('../components/FloatingLines'))

// ──────────────────────────────────────────────
// Shared font injection (Montserrat)
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

export default function Category() {
  const year = useStore(state => state.selectedYear)
  const setCategory = useStore(state => state.setCategory)
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)

  const desktopCategories = [
    { id: 'MyCalendar', label: 'My Calendar', subtitle: 'Open your complete watch plan', icon: CalendarIcon, accent: '#6366F1' },
    { id: 'Movies', label: 'Movies', subtitle: 'Feature films and cinema', icon: Film, accent: '#E50914' },
    { id: 'Series', label: 'Series', subtitle: 'TV shows and web series', icon: Tv, accent: '#0EA5E9' },
    { id: 'Anime', label: 'Anime', subtitle: 'Animation and Japanese titles', icon: Sparkles, accent: '#10B981' },
  ]

  const handleDesktopCategory = (categoryId) => {
    if (categoryId === 'MyCalendar') {
      setCategory(null)
      useStore.setState({ selectedGenres: [] })
      navigate('/calendar')
      return
    }
    setCategory(categoryId)
    navigate('/genres')
  }

  // ── Native (Android) — Light Neumorphic Layout ──
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
        {/* Subtle light radials for depth */}
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

        {/* ── Simplified Native Header ── */}
        <div className="flex-shrink-0 relative z-20 px-4 pt-4 flex items-center justify-between">
            <button
                onClick={() => navigate('/home')}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{ 
                    ...netflixRaisedStyle,
                }}
            >
                <ChevronLeft size={22} style={{ color: netflixNeumorphic.textSoft }} />
            </button>
            
            <h1 style={{ fontSize: 18, fontWeight: 700, color: netflixNeumorphic.text, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
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
              color: netflixNeumorphic.text,
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
              color: netflixNeumorphic.textSoft,
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
  if (useDesktopNeumorphic) {
    const theme = netflixNeumorphic
    return (
      <div className="min-h-screen w-full relative overflow-hidden" style={netflixPageStyle}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', left: '5%', top: '9%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,9,20,0.24) 0%, transparent 70%)', filter: 'blur(72px)' }} />
          <div style={{ position: 'absolute', right: '7%', bottom: '8%', width: 330, height: 330, borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,18,28,0.2) 0%, transparent 70%)', filter: 'blur(76px)' }} />
        </div>
        <header className="relative z-10 max-w-7xl mx-auto px-8 pt-8 flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="pressable flex items-center justify-center" style={{ ...netflixRaisedStyle, width: 54, height: 54, borderRadius: 22, color: theme.textSoft }}>
            <ChevronLeft size={22} />
          </button>
          <UserBadge />
        </header>
        <main className="relative z-10 max-w-7xl mx-auto px-8 py-10">
          <div className="grid grid-cols-[0.8fr_1.2fr] gap-8 items-stretch">
            <section style={{ ...netflixSurfaceStyle, borderRadius: 40, padding: 36 }}>
              <p style={{ fontSize: 12, color: theme.muted, letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>Selected Year</p>
              <h1 style={{ marginTop: 18, fontSize: 72, lineHeight: 1, color: theme.text, fontWeight: 750, letterSpacing: '0.08em' }}>{year}</h1>
              <p style={{ marginTop: 20, color: theme.textSoft, lineHeight: 1.8, maxWidth: 390 }}>
                Choose where you want to go next. The web layout keeps the same tactile surfaces without using the narrow mobile stack.
              </p>
            </section>
            <section className="grid grid-cols-2 gap-5">
              {desktopCategories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => handleDesktopCategory(category.id)}
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="pressable text-left"
                    style={{ ...(category.id === 'MyCalendar' ? netflixRedButtonStyle : netflixRaisedStyle), borderRadius: 32, padding: 28, minHeight: 210, position: 'relative', overflow: 'hidden' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-center" style={{ width: 62, height: 62, borderRadius: 22, background: category.id === 'MyCalendar' ? 'rgba(255,255,255,0.14)' : theme.panelRaised, boxShadow: theme.insetShadow, color: category.id === 'MyCalendar' ? '#FFFFFF' : theme.red }}>
                        <Icon size={26} strokeWidth={1.7} />
                      </div>
                      <ChevronRight size={22} style={{ color: category.id === 'MyCalendar' ? '#FFFFFF' : theme.muted, opacity: hoveredCategory === category.id ? 1 : 0.65 }} />
                    </div>
                    <h2 style={{ marginTop: 28, color: theme.text, fontSize: 26, fontWeight: 750 }}>{category.label}</h2>
                    <p style={{ marginTop: 8, color: category.id === 'MyCalendar' ? 'rgba(255,255,255,0.78)' : theme.textSoft, fontSize: 14 }}>{category.subtitle}</p>
                  </button>
                )
              })}
            </section>
          </div>
        </main>
      </div>
    )
  }

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
