import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, LayoutList, PlayCircle } from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import { shouldUseCompactNativeLayout } from '../../lib/platform'
import { netflixNeumorphic } from '../../styles/netflixNeumorphic'

const isNative = shouldUseCompactNativeLayout()

const NAV_ITEMS = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/streaming', label: 'Stream', icon: PlayCircle },
  { path: '/myspace', label: 'My Space', icon: LayoutList },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  // Hide on auth pages
  const hiddenPaths = ['/', '/login', '/signup']
  if (hiddenPaths.includes(location.pathname)) return null

  const isActive = (path) => {
    if (path === '/home') return location.pathname === '/home'
    return location.pathname.startsWith(path)
  }

  // Neomorphic theme for native, original glass for web
  const navContainerStyle = isNative
    ? {
        background: 'rgba(12,12,13,0.94)',
        borderTop: `1px solid ${netflixNeumorphic.border}`,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)',
        borderRadius: '24px 24px 0 0',
        paddingTop: 8,
      }
    : {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        borderRadius: '16px 16px 0 0',
      }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: isNative ? '#080808' : 'transparent',
      }}
    >
      <div style={navContainerStyle}>
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon

            return (
              <button
                key={item.path}
                id={`bottom-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center gap-1 py-2 cursor-pointer transition-all duration-200"
                style={{ 
                    minWidth: 72, 
                    minHeight: 48,
                    // If active, give slightly more lift or a recessed look? 
                    // Let's go with a subtle recessed look for active in neomorphism or just darker icon.
                }}
                aria-label={item.label}
              >
                {/* Active top indicator */}
                {active && isNative && (
                  <Motion.div
                    layoutId="nav-indicator-light"
                    className="absolute -top-1 w-8 h-1 rounded-full"
                    style={{
                      background: netflixNeumorphic.red,
                      boxShadow: '0 0 14px rgba(229,9,20,0.45)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {active && !isNative && (
                  <Motion.div
                    layoutId="nav-indicator-dark"
                    className="absolute -top-1 w-6 h-1 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))',
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                  className="transition-all duration-200"
                  style={{
                    color: isNative
                      ? active ? netflixNeumorphic.text : netflixNeumorphic.muted
                      : active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    filter: active && isNative ? 'drop-shadow(0 0 8px rgba(229,9,20,0.35))' : 'none',
                  }}
                />

                <span
                  className="text-[9px] tracking-wide uppercase transition-colors duration-200"
                  style={{
                    color: isNative
                      ? active ? netflixNeumorphic.text : netflixNeumorphic.muted
                      : active ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.25)',
                    fontWeight: active ? 700 : 400,
                    letterSpacing: '0.14em',
                    fontFamily: "'Montserrat', 'Raleway', sans-serif",
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
