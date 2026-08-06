import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, Save } from 'lucide-react'
import { netflixNeumorphic, nativeFastRaisedStyle, nativeFastInsetStyle, nativeFastRedButtonStyle } from '../../styles/netflixNeumorphic'

export default function TimeSettingsModal({ onClose }) {
    const [time, setTime] = useState('09:00')
    const [status, setStatus] = useState('')

    const handleSave = async () => {
        setStatus('Saving...')
        try {
            const [hour, minute] = time.split(':')
            const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'
            const response = await fetch(`${API_URL}/api/settings/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hour, minute })
            })

            if (response.ok) {
                setStatus('Saved!')
                setTimeout(onClose, 1000)
            } else {
                setStatus('Error saving')
            }
        } catch (error) {
            console.error(error)
            setStatus('Connection Error')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="w-[92%] max-w-[440px] rounded-[28px] p-5 sm:p-6 shadow-2xl relative border border-white/20 text-white overflow-hidden my-auto z-10"
                style={{ 
                    ...nativeFastRaisedStyle,
                    background: `linear-gradient(145deg, ${netflixNeumorphic.panelRaised}, ${netflixNeumorphic.panel})`,
                    fontFamily: "'Montserrat', sans-serif"
                }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: netflixNeumorphic.text }}>
                        <Clock size={20} className="text-red-500" />
                        Reminder Time
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                        style={{ ...nativeFastRaisedStyle, color: netflixNeumorphic.textSoft }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="text-xs mb-4" style={{ color: netflixNeumorphic.textSoft }}>
                    Set the daily time for your email notifications & watch reminders.
                </p>

                <div className="rounded-2xl p-4 border mb-5 text-center" style={{ ...nativeFastInsetStyle, borderColor: netflixNeumorphic.border }}>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="bg-transparent text-4xl font-mono focus:outline-none text-center w-full"
                        style={{ color: netflixNeumorphic.text }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${status === 'Error saving' || status === 'Connection Error' ? 'text-red-400' : 'text-green-400'}`}>
                        {status}
                    </span>
                    <button
                        onClick={handleSave}
                        className="py-2.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                        style={nativeFastRedButtonStyle}
                    >
                        Save <Save size={14} />
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
