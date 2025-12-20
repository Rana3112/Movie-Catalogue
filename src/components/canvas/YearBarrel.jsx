import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Line, Effects } from '@react-three/drei'
import { useStore } from '../../store/useStore'
import { useNavigate } from 'react-router-dom'
import { useDrag, useWheel, useGesture } from '@use-gesture/react'
import * as THREE from 'three'

// Configuration
const X_SPACING = 3.5
const BRANCH_HEIGHT = 2.5
const YEAR_START = 1900
const YEAR_END = 2050
const CENTER_YEAR = 2025

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;     // Core Color (White)
  uniform float uHover;    // 0.0 to 1.0

  // SDF for rounded box (2D)
  float sdRoundedBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
      // Normalize UV to -1...1
      vec2 pos = vUv * 2.0 - 1.0;
      pos.x *= 1.7; // Aspect Correction

      // Box Dimensions (Matches visual placement)
      vec2 size = vec2(1.3, 0.75); 
      float radius = 0.35;
      
      float dist = sdRoundedBox(pos, size, radius);

      float d = abs(dist);
      
      // 1. Base Stroke (Always Visible) - Thinner, Sharper
      float baseThickness = 0.008; 
      float baseSmoothness = 0.005;
      float baseAlpha = smoothstep(baseThickness + baseSmoothness, baseThickness, d);
      
      // 2. Hover Glow (Fades in) - Thicker, Softer
      float glowThickness = 0.02;
      float glowWidth = 0.25; 
      float glowAlpha = smoothstep(glowThickness + glowWidth, glowThickness, d);
      
      // Pulse Effect for Glow
      float pulse = 0.8 + 0.2 * sin(uTime * 2.0); 
      
      // Colors
      vec3 idleColor = vec3(0.5); // Grey
      vec3 coreColor = vec3(1.0); // White
      vec3 glowTint = vec3(0.6, 0.4, 1.0); // Faint Purple
      
      // Mix Core and Glow for the Hover State
      vec3 hoverColor = mix(glowTint, coreColor, baseAlpha); 
      
      // Final Mix based on Hover amount
      vec3 finalColor = mix(idleColor, hoverColor, uHover);
      
      // Mix Alphas
      float finalAlpha = mix(baseAlpha * 0.6, max(baseAlpha, glowAlpha * pulse * 0.8), uHover);
      
      gl_FragColor = vec4(finalColor, finalAlpha);
  }
`

function YearBranch({ year, xPos, isUp, onClick }) {
    const textRef = useRef()
    const borderRef = useRef()
    const [hovered, setHovered] = useState(false)

    // Unique uniforms per instance
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('white') }, // Core White
        uHover: { value: 0 }
    }), [])

    // Y positioning
    const yPos = isUp ? BRANCH_HEIGHT + 0.5 : -BRANCH_HEIGHT - 0.5

    // Connect String to Box Edge
    const stringLength = Math.abs(yPos) - 1.0
    const stringEndY = isUp ? stringLength : -stringLength

    const points = useMemo(() => [
        [xPos, 0, 0],
        [xPos, stringEndY, 0]
    ], [xPos, stringEndY])

    useFrame((state) => {
        const time = state.clock.elapsedTime

        // Update Shader logic
        if (borderRef.current && borderRef.current.material.uniforms) {
            const uniforms = borderRef.current.material.uniforms
            uniforms.uTime.value = time
            const targetHover = hovered ? 1.0 : 0.0
            uniforms.uHover.value = THREE.MathUtils.lerp(uniforms.uHover.value, targetHover, 0.1)
        }

        // Text Color Logic
        if (textRef.current) {
            textRef.current.material.color.lerp(hovered ? new THREE.Color("white") : new THREE.Color("#aaaaaa"), 0.1)
        }
    })

    return (
        <group>
            {/* Thread/Line */}
            <Line
                points={points}
                color="white"
                lineWidth={1.5}
                transparent
                opacity={0.8}
            />

            {/* Node Group (Centered at yPos) */}
            <group position={[xPos, yPos, 0]}>
                {/* Glowing Box Mesh (Centered) */}
                <mesh ref={borderRef} position={[0, 0, 0]}>
                    <planeGeometry args={[4.4, 2.6]} />
                    <shaderMaterial
                        uniforms={uniforms}
                        vertexShader={vertexShader}
                        fragmentShader={fragmentShader}
                        transparent
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                {/* Text (Centered) */}
                <Text
                    ref={textRef}
                    fontSize={1.2}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                    anchorX="center"
                    anchorY="middle"
                    position={[0, 0, 0.02]}
                    color="#aaaaaa"
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onPointerDown={(e) => {
                        e.stopPropagation()
                        onClick(year)
                    }}
                >
                    {year}
                </Text>
            </group>
        </group>
    )
}

function Timeline() {
    const { setYear, selectedYear } = useStore()
    const navigate = useNavigate()
    const groupRef = useRef()

    // Physics State
    const state = useRef({ x: 0, velocity: 0, isDragging: false })

    // Initial position
    useMemo(() => {
        const offset = (selectedYear - YEAR_START) * X_SPACING
        state.current.x = -offset
    }, [])

    const bind = useGesture({
        onDrag: ({ delta: [dx, dy], active }) => {
            state.current.isDragging = active
            state.current.velocity += dx * 0.02
        },
        onWheel: ({ delta: [dx, dy], active }) => {
            state.current.isDragging = active
            state.current.velocity -= (dx + dy) * 0.01
        }
    }, { pointerEvents: true })

    useFrame(() => {
        const s = state.current
        if (!s.isDragging) s.velocity *= 0.92
        s.x += s.velocity

        const minX = -((YEAR_END - YEAR_START) * X_SPACING + 10)
        const maxX = 10
        if (s.x > maxX) { s.x = maxX; s.velocity = 0; }
        if (s.x < minX) { s.x = minX; s.velocity = 0; }

        if (groupRef.current) groupRef.current.position.x = s.x
    })

    const years = useMemo(() => {
        const arr = []
        for (let y = YEAR_START; y <= YEAR_END; y++) arr.push(y)
        return arr
    }, [])

    return (
        <>
            <mesh position={[0, 0, 0]} {...bind()} visible={false}>
                <planeGeometry args={[1000, 1000]} />
                <meshBasicMaterial />
            </mesh>

            <group ref={groupRef}>
                {/* Central String Line */}
                <mesh position={[((YEAR_END - YEAR_START) / 2) * X_SPACING, 0, -0.02]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, (YEAR_END - YEAR_START + 20) * X_SPACING, 8]} />
                    <meshBasicMaterial color="white" transparent opacity={0.8} />
                </mesh>

                {years.map((year, i) => (
                    <YearBranch
                        key={year}
                        year={year}
                        xPos={i * X_SPACING}
                        isUp={i % 2 === 0}
                        onClick={(y) => {
                            setYear(y)
                            navigate('/category')
                        }}
                    />
                ))}
            </group>
        </>
    )
}

export default function YearBarrelCanvas() {
    return (
        <Canvas camera={{ position: [0, 0, 20], fov: 40 }} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Timeline />
            <Effects disableGamma />
        </Canvas>
    )
}
