import { useState, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const COLORS = {
  success: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#22C55E', icon: '#22C55E' },
  error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#EF4444', icon: '#EF4444' },
  info: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', text: '#3B82F6', icon: '#3B82F6' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#F59E0B', icon: '#F59E0B' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-4 left-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = ICONS[toast.type] || Info
            const colors = COLORS[toast.type] || COLORS.info
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
                className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <Icon size={18} style={{ color: colors.icon, flexShrink: 0 }} />
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  {toast.message}
                </span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X size={14} style={{ color: colors.text, opacity: 0.6 }} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// Confirm dialog replacement
export function useConfirm() {
  const { addToast } = useToast()

  const confirm = useCallback((message) => {
    // For now, still use native confirm but wrap with toast for success
    // In a full implementation, this would be a modal component
    return window.confirm(message)
  }, [])

  return confirm
}
