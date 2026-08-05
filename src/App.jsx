import { useEffect } from 'react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import Home from './pages/Home'
import Category from './pages/Category'
import Genres from './pages/Genres'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MySpace from './pages/MySpace'
import TasteDNA from './pages/TasteDNA'
import SharedCalendar from './pages/SharedCalendar'
import { useStore } from './store/useStore'
import CineBot from './components/CineBot'
import { ToastProvider } from './components/ui/Toast'
import Landing from './pages/Landing'
import PageTransition from './components/ui/PageTransition'
import StreamingHome from './streaming/pages/StreamingHome'
import MovieDetail from './streaming/pages/MovieDetail'
import TVDetail from './streaming/pages/TVDetail'
import AnimeDetail from './streaming/pages/AnimeDetail'
import PlayerPage from './streaming/pages/PlayerPage'
import SearchPage from './streaming/pages/SearchPage'
import StreamingListPage from './streaming/pages/StreamingListPage'
import GenresPage from './streaming/pages/GenresPage'
import './streaming/streaming.css'

const isNative = Capacitor.isNativePlatform()

// Use HashRouter for native (Capacitor) apps, BrowserRouter for web
const Router = isNative ? HashRouter : BrowserRouter

const NativeBackHandler = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNative) return undefined

    const handleNativeBack = () => {
      const rootScreens = ['/', '/home']
      if (rootScreens.includes(location.pathname)) return

      if (window.history.length > 1) {
        navigate(-1)
        return
      }

      navigate('/home', { replace: true })
    }

    window.addEventListener('categloge:native-back', handleNativeBack)
    return () => window.removeEventListener('categloge:native-back', handleNativeBack)
  }, [location.pathname, navigate])

  return null
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isGuest } = useStore()
  if (!user && !isGuest) {
    return <Navigate to="/" replace />
  }
  return children
}

// Strict Route (No Guests)
const StrictRoute = ({ children }) => {
  const { user } = useStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Animated Route Container
function AnimatedRoutes() {
  const location = useLocation()
  const { user, isGuest } = useStore()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Landing Page (Root) */}
        <Route path="/" element={
          (user || isGuest) ? (
            <Navigate to="/home" replace />
          ) : (
            <PageTransition><Landing /></PageTransition>
          )
        } />

        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/shared/:token" element={<PageTransition><SharedCalendar /></PageTransition>} />

        {/* Protected Routes (Guests Allowed) */}
        <Route path="/home" element={
          <ProtectedRoute>
            <PageTransition><Home /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/category" element={
          <ProtectedRoute>
            <PageTransition><Category /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/genres" element={
          <ProtectedRoute>
            <PageTransition><Genres /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <PageTransition><Calendar /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/taste-dna" element={
          <ProtectedRoute>
            <PageTransition><TasteDNA /></PageTransition>
          </ProtectedRoute>
        } />

        {/* Strict Routes (Authenticated Only) */}
        <Route path="/myspace" element={
          <StrictRoute>
            <PageTransition><MySpace /></PageTransition>
          </StrictRoute>
        } />

        {/* Streaming Module Routes with Transitions */}
        <Route path="/streaming" element={<ProtectedRoute><PageTransition><StreamingHome /></PageTransition></ProtectedRoute>} />
        <Route path="/streaming/movie/:id" element={<ProtectedRoute><PageTransition><MovieDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/streaming/tv/:id" element={<ProtectedRoute><PageTransition><TVDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/streaming/anime/:id" element={<ProtectedRoute><PageTransition><AnimeDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/streaming/player" element={<ProtectedRoute><PageTransition><PlayerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/streaming/search" element={<ProtectedRoute><PageTransition><SearchPage /></PageTransition></ProtectedRoute>} />
        <Route path="/streaming/list/:category/:collection" element={<ProtectedRoute><PageTransition><StreamingListPage /></PageTransition></ProtectedRoute>} />
        <Route path="/streaming/genres" element={<ProtectedRoute><PageTransition><GenresPage /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const { user, isGuest, fetchEntries, syncOfflineQueue } = useStore()

  useEffect(() => {
    if (user?.email && !isGuest) {
      fetchEntries().catch(() => {})
    }
  }, [fetchEntries, isGuest, user?.email])

  useEffect(() => {
    if (!user?.email || isGuest) return undefined
    const sync = () => syncOfflineQueue().catch(() => {})
    window.addEventListener('online', sync)
    sync()
    return () => window.removeEventListener('online', sync)
  }, [isGuest, syncOfflineQueue, user?.email])

  return (
    <ToastProvider>
      <Router>
        <NativeBackHandler />
        <AnimatedRoutes />
        {(user || isGuest) && <CineBot />}
      </Router>
    </ToastProvider>
  )
}

export default App
