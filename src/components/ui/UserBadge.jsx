import { useStore } from '../../store/useStore'
import { User } from 'lucide-react'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export default function UserBadge({ className = "" }) {
    const user = useStore(state => state.user)

    if (!user) return null

    if (isNative) {
        // Native: just the avatar circle, no name — compact pill
        return (
            <div
                className={`flex items-center justify-center ${className}`}
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#E8EAED',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.10), -2px -2px 6px rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.95)',
                    flexShrink: 0,
                    cursor: 'default',
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0f4c81 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 0 14px rgba(14,165,233,0.55), 0 0 5px rgba(14,165,233,0.3)',
                        border: '2px solid rgba(255,255,255,0.8)',
                    }}
                >
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <User size={18} style={{ color: '#fff' }} />
                    )}
                </div>
            </div>
        )
    }

    // Web dark mode badge
    return (
        <div
            className={`flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-default ${className}`}
        >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden border border-white/20 shadow-inner">
                {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <User size={16} className="text-white" />
                )}
            </div>
            <span className="text-white/90 font-medium text-sm tracking-wide pr-2">
                {user.name}
            </span>
        </div>
    )
}
