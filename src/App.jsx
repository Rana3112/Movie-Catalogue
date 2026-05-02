import { useEffect } from 'react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
import BottomNav from './components/ui/BottomNav'
import { ToastProvider } from './components/ui/Toast'
import Landing from './pages/Landing'
import { StreamingRoutes } from './streaming'

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
  // Allow access if logged in OR guest
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
      <Routes>
        {/* Public Landing Page (Root) */}
        <Route path="/" element={
          (user || isGuest) ? <Navigate to="/home" replace /> : <Landing />
        } />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/shared/:token" element={<SharedCalendar />} />

        {/* Protected Routes (Guests Allowed) */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/category" element={
          <ProtectedRoute>
            <Category />
          </ProtectedRoute>
        } />
        <Route path="/genres" element={
          <ProtectedRoute>
            <Genres />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />
        <Route path="/taste-dna" element={
          <ProtectedRoute>
            <TasteDNA />
          </ProtectedRoute>
        } />

        {/* Strict Routes (Auhenticated Only) */}
        <Route path="/myspace" element={
          <StrictRoute>
            <MySpace />
          </StrictRoute>
        } />
        
        {/* Streaming Module Routes */}
        {StreamingRoutes}
      </Routes>


      {/* CineBot AI Assistant - visible when user is logged in or guest */}
      {(user || isGuest) && <CineBot />}
      </Router>
    </ToastProvider>
  )
}

export default App
