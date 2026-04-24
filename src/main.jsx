import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import firebaseConfig from './firebaseConfig'

// Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Suppress releasePointerCapture errors in Capacitor WebView (Three.js touch issue)
if (Capacitor.isNativePlatform()) {
  window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('releasePointerCapture')) {
      e.preventDefault()
    }
  })
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && e.reason.message && e.reason.message.includes('releasePointerCapture')) {
      e.preventDefault()
    }
  })
}

// Initialize Firebase
let auth = null
try {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // Initialize Analytics (only in web environment, not in Capacitor)
  if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
    getAnalytics(app)
  }
  // Configure auth for Capacitor (needed for mobile)
  if (Capacitor.isNativePlatform()) {
    // For Capacitor, we may need additional configuration
    // This is handled by the Firebase SDK automatically
  }
} catch (error) {
  console.error('Firebase initialization error:', error)
  // App will still work, but Google auth won't be available
}

// Export auth for use in components
export { auth }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)