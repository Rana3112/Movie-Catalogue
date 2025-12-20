import { useStore } from '../../store/useStore'
import { User } from 'lucide-react'

export default function UserBadge({ className = "" }) {
    const user = useStore(state => state.user)

    if (!user) return null

    return (
        <div className={`flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-default ${className}`}>
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
