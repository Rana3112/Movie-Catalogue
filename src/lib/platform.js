import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

export const isNativePlatform = () => Capacitor.isNativePlatform()

export const isMobileBrowser = () => {
  if (typeof window === 'undefined') return false
  if (Capacitor.isNativePlatform()) return true
  const ua = navigator.userAgent || navigator.vendor || window.opera || ''
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
  const isSmallWidth = window.innerWidth <= 768
  return isMobileUA || isSmallWidth
}

export const shouldUseNeumorphicLayout = () => true

export const shouldUseCompactNativeLayout = () => isMobileBrowser()

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(isMobileBrowser)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileBrowser())
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return isMobile
}
