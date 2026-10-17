import { create } from 'zustand'

export const THEMES = [
  {
    id: 'crimson',
    name: 'Crimson',
    hex: 0xff1122,
    color: '#ff2d2d',
    colorDeep: '#8d1111',
    glow: 'rgba(255, 45, 45, 0.55)',
    rgb: '255, 45, 45',
    rgbDeep: '141, 17, 17',
    dot: '#ff1122',
  },
  {
    id: 'exon-blue',
    name: 'Exon Blue',
    hex: 0x0066ff,
    color: '#3b82f6',
    colorDeep: '#1d4ed8',
    glow: 'rgba(59, 130, 246, 0.55)',
    rgb: '59, 130, 246',
    rgbDeep: '29, 78, 216',
    dot: '#0066ff',
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    hex: 0x00e5ff,
    color: '#00e5ff',
    colorDeep: '#0891b2',
    glow: 'rgba(0, 229, 255, 0.55)',
    rgb: '0, 229, 255',
    rgbDeep: '8, 145, 178',
    dot: '#00e5ff',
  },
  {
    id: 'amber-neon',
    name: 'Amber Neon',
    hex: 0xff8800,
    color: '#ff8800',
    colorDeep: '#c2410c',
    glow: 'rgba(255, 136, 0, 0.55)',
    rgb: '255, 136, 0',
    rgbDeep: '194, 65, 12',
    dot: '#ff8800',
  },
  {
    id: 'emerald',
    name: 'Emerald Acid',
    hex: 0x10b981,
    color: '#10b981',
    colorDeep: '#047857',
    glow: 'rgba(16, 185, 129, 0.55)',
    rgb: '16, 185, 129',
    rgbDeep: '4, 120, 87',
    dot: '#10b981',
  },
  {
    id: 'violet-pulse',
    name: 'Violet Pulse',
    hex: 0xa855f7,
    color: '#a855f7',
    colorDeep: '#7e22ce',
    glow: 'rgba(168, 85, 247, 0.55)',
    rgb: '168, 85, 247',
    rgbDeep: '126, 34, 206',
    dot: '#a855f7',
  },
]

export function hexToRgbComponents(hexStr) {
  const clean = hexStr.replace('#', '')
  const intVal = parseInt(clean, 16) || 0
  const r = (intVal >> 16) & 255
  const g = (intVal >> 8) & 255
  const b = intVal & 255
  return { r, g, b, rgbStr: `${r}, ${g}, ${b}`, intVal }
}

export function applyThemeVariables(theme) {
  if (!theme || typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--accent-red', theme.color)
  root.style.setProperty('--accent-red-deep', theme.colorDeep)
  root.style.setProperty('--accent-red-glow', theme.glow)
  root.style.setProperty('--theme-accent-rgb', theme.rgb)
  root.style.setProperty('--theme-accent-deep-rgb', theme.rgbDeep)
  root.style.setProperty('--active-accent', theme.color)
  root.style.setProperty('--active-accent-rgb', theme.rgb)
}

function loadInitialTheme() {
  if (typeof localStorage === 'undefined') return THEMES[0]
  try {
    const raw = localStorage.getItem('categloge-theme')
    if (!raw) return THEMES[0]
    const parsed = JSON.parse(raw)
    if (parsed.id === 'custom' && parsed.color) {
      const { r, g, b, rgbStr, intVal } = hexToRgbComponents(parsed.color)
      return {
        id: 'custom',
        name: parsed.name || 'Custom',
        hex: intVal,
        color: parsed.color,
        colorDeep: `rgba(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)}, 1)`,
        glow: `rgba(${r}, ${g}, ${b}, 0.55)`,
        rgb: rgbStr,
        rgbDeep: `${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)}`,
        dot: parsed.color,
      }
    }
    return THEMES.find((t) => t.id === parsed.id) || THEMES[0]
  } catch (_) {
    return THEMES[0]
  }
}

const initialTheme = loadInitialTheme()
if (typeof document !== 'undefined') {
  applyThemeVariables(initialTheme)
}

export const useThemeStore = create((set, get) => ({
  themeId: initialTheme.id,
  activeTheme: initialTheme,

  setTheme: (themeId) => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0]
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('categloge-theme', JSON.stringify({ id: theme.id }))
    }
    applyThemeVariables(theme)
    set({ themeId: theme.id, activeTheme: theme })
  },

  setCustomColor: (hexColor) => {
    const { r, g, b, rgbStr, intVal } = hexToRgbComponents(hexColor)
    const customTheme = {
      id: 'custom',
      name: 'Custom',
      hex: intVal,
      color: hexColor,
      colorDeep: `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`,
      glow: `rgba(${r}, ${g}, ${b}, 0.55)`,
      rgb: rgbStr,
      rgbDeep: `${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)}`,
      dot: hexColor,
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('categloge-theme', JSON.stringify({ id: 'custom', color: hexColor }))
    }
    applyThemeVariables(customTheme)
    set({ themeId: 'custom', activeTheme: customTheme })
  },

  cycleTheme: () => {
    const { themeId } = get()
    const currentIndex = THEMES.findIndex((t) => t.id === themeId)
    const nextIndex = (currentIndex + 1) % THEMES.length
    const nextTheme = THEMES[nextIndex]
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('categloge-theme', JSON.stringify({ id: nextTheme.id }))
    }
    applyThemeVariables(nextTheme)
    set({ themeId: nextTheme.id, activeTheme: nextTheme })
  },
}))
