import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Color } from 'three'
import { Grid1Background } from './grid1Engine'
import { useThemeStore } from '../../theme/themeConfig'

/**
 * Hero3DCircleGrid
 * 
 * 3D Interactive Hexagonal Grid Background for the Time Archive page.
 * Powered by a local Three.js engine with custom subsurface scattering
 * and deep crater point lighting that dynamically reflects the selected color theme.
 * Portaled to document.body so it stays strictly fixed behind all UI elements.
 */
export default function Hero3DCircleGrid() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const bgInstanceRef = useRef(null)
  const activeTheme = useThemeStore((state) => state.activeTheme)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let bgInstance = null
    try {
      bgInstance = Grid1Background(canvas, {
        type: 'circle',
        colors: [0x222222, 0x222222],
        light1Color: 0xffffff,
        light1Intensity: 10000,
        light1PositionZ: 50,
        light2Color: activeTheme?.hex ?? 0xff1122,
        light2Intensity: 15000,
        light2PositionZ: -20,
        depthScale: 3,
        materialParams: {
          metalness: 0.5,
          roughness: 0.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.2,
        },
      })

      if (bgInstance?.three?.scene) {
        bgInstance.three.scene.background = new Color('#050507')
      }

      bgInstanceRef.current = bgInstance
    } catch (err) {
      console.error('Failed to initialize 3D Grid background:', err)
    }

    return () => {
      if (bgInstance) {
        try {
          bgInstance.dispose()
        } catch (_) {}
      }
      bgInstanceRef.current = null
    }
  }, [])

  // Instantly update the 3D subsurface light color whenever the user changes the theme
  useEffect(() => {
    if (bgInstanceRef.current?.light2?.color && activeTheme?.hex !== undefined) {
      bgInstanceRef.current.light2.color.setHex(activeTheme.hex)
    }
  }, [activeTheme?.hex])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {/* Fixed 3D Interactive Circle Grid Layer strictly BEHIND all UI pages */}
      <div id="hero3dContainer" ref={containerRef} aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>

      {/* Subtle radial vignette that keeps edges crisp while showcasing 3D tiles */}
      <div className="vignette-overlay" aria-hidden="true" />
    </>,
    document.body
  )
}
