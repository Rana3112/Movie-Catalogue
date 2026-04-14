import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Capacitor } from '@capacitor/core'
import { auth } from '../main'

export default function Login() {
  const { setUser } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Regular Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Firebase Email/Password Login
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get ID token
      const idToken = await user.getIdToken()

// Send to backend with retry for cold starts
    const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
    let response

    // Retry up to 5 times with 5 second delays for cold starts
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        response = await fetch(`${API_URL}/api/auth/firebase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            idToken
          })
        })
        break
      } catch (fetchErr) {
        if (attempt < 4) {
          await new Promise(r => setTimeout(r, 5000))
        }
      }
    }

    if (!response) {
      throw new Error('Server not responding, please try again')
    }

    const data = await response.json()

      if (response.ok) {
        setUser(data.user, data.token)
        navigate('/')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      console.error('[Login] Error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // Google Login with Firebase
  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      let userResult
      let idToken

      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Firebase Authentication for native platforms
        // result.credential.idToken is the most reliable source on Android
        const result = await FirebaseAuthentication.signInWithGoogle()
        userResult = result.user
        idToken = result.credential?.idToken
        // Fallback: request token directly if credential didn't include it
        if (!idToken) {
          const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: false })
          idToken = tokenResult.token
        }
      } else {
        // Fallback to Firebase Web SDK for web
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
        const provider = new GoogleAuthProvider()
        provider.addScope('profile')
        provider.addScope('email')
        const result = await signInWithPopup(auth, provider)
        userResult = result.user
        idToken = await userResult.getIdToken()
      }

      // Send to backend with retry for cold starts
      const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
      let response
      let lastError

      // Retry up to 3 times with 3 second delays for cold starts
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await fetch(`${API_URL}/api/auth/firebase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: userResult.uid,
              email: userResult.email,
              displayName: userResult.displayName,
              photoURL: userResult.photoURL || userResult.photoUrl,
              idToken
            })
          })
          break // Success, exit retry loop
        } catch (fetchErr) {
          lastError = fetchErr
          console.error(`[Login] Fetch attempt ${attempt + 1} failed:`, fetchErr.message)
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 3000))
          }
        }
      }

      if (!response) {
        throw new Error(`Cannot reach server: ${lastError?.message || 'Network error'}`)
      }

      const data = await response.json()

      if (response.ok) {
        setUser(data.user, data.token)
        navigate('/')
      } else {
        setError(data.error || 'Google Login failed on server')
      }
    } catch (err) {
      console.error('[Google Login] Error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google login was cancelled')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.')
      } else {
        setError(err.message || 'Google Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-[#ffd700]/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e1e1e] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-[#ffd700] tracking-wide mb-2">Welcome Back</h1>
          <p className="text-white/40 text-sm">Sign in to access your catalogue</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full border rounded-xl p-4 text-white focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border-default)',
                fontSize: 16,
                minHeight: 52,
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-gold)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border-default)'}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border rounded-xl p-4 text-white focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border-default)',
                fontSize: 16,
                minHeight: 52,
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-gold)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border-default)'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
            style={{
              backgroundColor: loading ? 'var(--color-accent-gold-dim)' : 'var(--color-accent-gold)',
              opacity: loading ? 0.7 : 1,
              minHeight: 52,
              fontSize: 15,
            }}
          >
            {loading ? 'Signing in...' : (
              <>
                Sign In <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-white/20 text-xs uppercase">Or continue with</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#ffd700] hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}