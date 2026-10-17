import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Palette, ChevronDown, RotateCw } from 'lucide-react'
import { THEMES, useThemeStore } from '../../theme/themeConfig'

export default function ThemeColorSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const colorInputRef = useRef(null)

  const activeTheme = useThemeStore((state) => state.activeTheme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const setCustomColor = useThemeStore((state) => state.setCustomColor)
  const cycleTheme = useThemeStore((state) => state.cycleTheme)

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative inline-flex" ref={menuRef}>
      {/* ── Main Theme Pill Button (Matches Reference Screenshot) ── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        title="Switch 3D Crater Light & Theme Color (Crimson / Exon Blue / Cyan / Custom)"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all shadow-md cursor-pointer select-none"
        style={{
          boxShadow: `0 0 16px ${activeTheme.glow ? activeTheme.glow.replace('0.55', '0.22') : 'rgba(0,0,0,0.3)'}`,
        }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300"
          style={{
            backgroundColor: activeTheme.dot,
            boxShadow: `0 0 8px ${activeTheme.dot}, 0 0 14px ${activeTheme.dot}`,
          }}
        />
        <span className="hidden sm:inline tracking-wider font-bold">
          3D: {activeTheme.name.toUpperCase()}
        </span>
        <ChevronDown
          size={12}
          className={`text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* ── Color Palette Popover Dropdown ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl p-3 z-[60] bg-[#0c0d14]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/60 flex items-center gap-1.5">
                <Palette size={12} className="text-[#3b82f6]" /> Theme Color Scheme
              </span>
              <button
                type="button"
                onClick={cycleTheme}
                title="Quick cycle next color"
                className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10"
              >
                <RotateCw size={10} /> Next
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              {THEMES.map((theme) => {
                const isSelected = activeTheme.id === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setTheme(theme.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-white/15 border border-white/30 text-white font-bold'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: theme.dot,
                          boxShadow: `0 0 10px ${theme.dot}`,
                        }}
                      />
                      <span className="text-xs tracking-wide">{theme.name}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-white" />}
                  </button>
                )
              })}
            </div>

            {/* Custom Color Option */}
            <div className="pt-2 mt-2 border-t border-white/10">
              <label
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/80 border border-dashed border-white/20 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/30"
                    style={{
                      background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                    }}
                  />
                  <span className="text-xs tracking-wide">
                    {activeTheme.id === 'custom' ? `Custom: ${activeTheme.color}` : 'Pick Any Custom Color...'}
                  </span>
                </div>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={activeTheme.color || '#3b82f6'}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="opacity-0 w-0 h-0 cursor-pointer"
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
