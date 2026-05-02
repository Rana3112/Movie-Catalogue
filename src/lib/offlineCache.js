import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const isNative = () => {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

const cacheKey = (email) => `calendar-cache:${email || 'guest'}`
const queueKey = (email) => `calendar-offline-queue:${email || 'guest'}`

const readJson = async (key, fallback) => {
  try {
    if (isNative()) {
      const { value } = await Preferences.get({ key })
      return value ? JSON.parse(value) : fallback
    }
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const writeJson = async (key, value) => {
  try {
    const serialized = JSON.stringify(value)
    if (isNative()) {
      await Preferences.set({ key, value: serialized })
      return
    }
    localStorage.setItem(key, serialized)
  } catch {
    // Offline cache is best-effort. Calendar state still lives in Zustand.
  }
}

export const loadEntriesOfflineCache = async (email) => (
  readJson(cacheKey(email), null)
)

export const saveEntriesOfflineCache = async (email, entriesByDate) => {
  if (!email || !entriesByDate) return
  await writeJson(cacheKey(email), {
    savedAt: Date.now(),
    entriesByDate,
  })
}

export const loadOfflineQueue = async (email) => (
  readJson(queueKey(email), [])
)

export const saveOfflineQueue = async (email, queue) => {
  if (!email) return
  await writeJson(queueKey(email), Array.isArray(queue) ? queue : [])
}

export const enqueueOfflineEntry = async (email, date, payload) => {
  if (!email || !date || !payload) return []
  const queue = await loadOfflineQueue(email)
  const item = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date,
    payload,
    queuedAt: Date.now(),
  }
  const nextQueue = [...queue, item]
  await saveOfflineQueue(email, nextQueue)
  return nextQueue
}
