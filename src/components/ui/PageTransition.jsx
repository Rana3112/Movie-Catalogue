import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.985,
    filter: 'blur(6px)',
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 1.012,
    filter: 'blur(6px)',
    y: -8,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export default function PageTransition({ children }) {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)

  // Trigger sleek top crimson sweep beam on route navigation
  useEffect(() => {
    setIsNavigating(true)
    setProgress(0)
    
    const timer1 = setTimeout(() => setProgress(60), 50)
    const timer2 = setTimeout(() => setProgress(100), 280)
    const timer3 = setTimeout(() => setIsNavigating(false), 420)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [location.pathname])

  return (
    <>
      {/* Sleek Top Crimson Light Beam Sweep Indicator */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none"
            style={{ height: '3px' }}
          >
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #ff2d2d 0%, #ffffff 50%, #ff2d2d 100%)',
                boxShadow: '0 0 14px rgba(255, 45, 45, 0.9), 0 0 24px rgba(255, 45, 45, 0.6)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Transition Container */}
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </>
  )
}
