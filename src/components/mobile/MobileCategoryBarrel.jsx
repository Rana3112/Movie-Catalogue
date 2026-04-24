import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Film, Tv, Sparkles, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { motion } from 'framer-motion'

const CATEGORIES = [
  {
    id: 'MyCalendar',
    label: 'My Calendar',
    subtitle: 'All in one calendar',
    icon: CalendarIcon,
  },
  {
    id: 'Movies',
    label: 'Movies',
    subtitle: 'Feature Films & Cinema',
    icon: Film,
  },
  {
    id: 'Series',
    label: 'Series',
    subtitle: 'TV Shows & Web Series',
    icon: Tv,
  },
  {
    id: 'Anime',
    label: 'Anime',
    subtitle: 'Animation & Japanese',
    icon: Sparkles,
  },
]

export default function MobileCategoryBarrel({ onHover }) {
  const navigate = useNavigate()
  const setCategory = useStore(s => s.setCategory)
  const year = useStore(s => s.selectedYear)

  const handleClick = (cat) => {
    if (cat === 'MyCalendar') {
      setCategory(null)
      useStore.setState({ selectedGenres: [] })
      navigate('/calendar')
    } else {
      setCategory(cat)
      navigate('/genres')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-5 pb-8">
      <div className="flex flex-col gap-5 w-full max-w-sm">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon
          const isSpecial = cat.id === 'MyCalendar'
          
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => handleClick(cat.id)}
              className="pressable relative flex items-center gap-5 p-5 transition-all duration-200"
              style={{
                // Unique Highlight for My Calendar, Standard Neumorphic for others
                background: isSpecial ? 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)' : '#E8EAED',
                borderRadius: 32,
                boxShadow: isSpecial 
                  ? '0px 10px 20px rgba(99, 102, 241, 0.3), inset 2px 2px 5px rgba(255,255,255,0.4)' 
                  : '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
                border: isSpecial ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.95)',
                minHeight: 100,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {/* Inner light reflection - cleaner version */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isSpecial 
                    ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 60%)'
                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
                }}
              />

              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl relative z-10"
                style={{
                  width: 56,
                  height: 56,
                  background: isSpecial ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)',
                  border: isSpecial ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: isSpecial 
                    ? '0 4px 10px rgba(0,0,0,0.1)' 
                    : 'inset 2px 2px 5px rgba(180,190,210,0.2), 0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <Icon size={24} style={{ color: isSpecial ? '#FFFFFF' : '#4B5563' }} strokeWidth={1.5} />
              </div>

              <div className="flex-1 text-left min-w-0 relative z-10">
                <h3
                  className="text-lg tracking-wide"
                  style={{
                    color: isSpecial ? '#FFFFFF' : '#2D3748',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {cat.label}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: isSpecial ? 'rgba(255, 255, 255, 0.8)' : '#9CA3AF',
                    fontWeight: 400,
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {cat.subtitle}
                </p>
              </div>

              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full relative z-10"
                style={{
                  width: 32,
                  height: 32,
                  background: isSpecial ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: isSpecial ? 'none' : '1px 1px 3px rgba(0,0,0,0.05)',
                  border: isSpecial ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                }}
              >
                <ChevronRight
                  size={18}
                  style={{ color: isSpecial ? '#FFFFFF' : '#9CA3AF' }}
                  strokeWidth={2}
                />
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
