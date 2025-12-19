import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Save } from 'lucide-react'

export default function TimeSettingsModal({ onClose }) {
    const [time, setTime] = useState('09:00')
    const [status, setStatus] = useState('')

    const handleSave = async () => {
        setStatus('Saving...')
        try {
            const [hour, minute] = time.split(':')
            const response = await fetch('https://movie-catalogue-api.onrender.com/api/settings/schedule', {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1e1e1e] border border-white/10 p-6 rounded-2xl w-full max-w-sm relative z-10 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#ffd700] flex items-center gap-2">
                        <Clock size={20} />
                        Reminder Time
                    </h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-white/60 text-sm mb-4">
                    Set the daily time for email notifications.
                </p>

                <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6 text-center">
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="bg-transparent text-white text-4xl font-mono focus:outline-none text-center w-full"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className={`text-sm ${status === 'Error saving' ? 'text-red-400' : 'text-green-400'}`}>
                        {status}
                    </span>
                    <button
                        onClick={handleSave}
                        className="bg-[#ffd700] hover:bg-[#ffed4a] text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        Save <Save size={16} />
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
