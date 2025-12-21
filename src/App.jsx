import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Category from './pages/Category'
import Genres from './pages/Genres'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MySpace from './pages/MySpace'
import { useStore } from './store/useStore'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="/" element={
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
        <Route path="/myspace" element={
          <ProtectedRoute>
            <MySpace />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
