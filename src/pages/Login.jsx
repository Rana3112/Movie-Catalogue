import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'

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
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (response.ok) {
                // Success
                setUser(data.user, data.token)
                navigate('/') // Go to Home
            } else {
                setError(data.error || 'Login failed')
            }
        } catch (err) {
            setError('Server error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Google Login Hook
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Fetch User Info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleUser = await userInfoResponse.json();

                // Send to my Backend
                const response = await fetch('http://localhost:5000/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: googleUser.email,
                        name: googleUser.name,
                        googleId: googleUser.sub,
                        avatar: googleUser.picture
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setUser(data.user, data.token)
                    navigate('/')
                } else {
                    setError(data.error || 'Google Login failed on server')
                }
            } catch (err) {
                console.error(err)
                setError('Failed to process Google Login')
            }
        },
        onError: () => setError('Google Login Failed')
    });

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

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#ffd700]/50 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#ffd700]/50 transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ffd700] hover:bg-[#ffed4a] text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
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
                    onClick={() => googleLogin()}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
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
