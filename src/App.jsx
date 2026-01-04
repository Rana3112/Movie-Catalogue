import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Category from './pages/Category'
import Genres from './pages/Genres'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MySpace from './pages/MySpace'
import { useStore } from './store/useStore'

import Landing from './pages/Landing'

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
  const { user, isGuest } = useStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page (Root) */}
        <Route path="/" element={
          (user || isGuest) ? <Navigate to="/home" replace /> : <Landing />
        } />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

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

        {/* Strict Routes (Auhenticated Only) */}
        <Route path="/myspace" element={
          <StrictRoute>
            <MySpace />
          </StrictRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
