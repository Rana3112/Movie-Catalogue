import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'

export default function Signup() {
    const { setUser } = useStore()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSignup = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })

            const data = await response.json()

            if (response.ok) {
                // Success
                setUser(data.user, data.token)
                navigate('/') // Go to Home
            } else {
                setError(data.error || 'Signup failed')
            }
        } catch (err) {
            setError('Server error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#ffd700]/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1e1e1e] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl backdrop-blur-xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif text-[#ffd700] tracking-wide mb-2">Join Catalogue</h1>
                    <p className="text-white/40 text-sm">Start your cinematic journey</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#ffd700]/50 transition-colors"
                            required
                        />
                    </div>
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
                        {loading ? 'Creating Account...' : (
                            <>
                                Create Account <UserPlus size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-white/40 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#ffd700] hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
