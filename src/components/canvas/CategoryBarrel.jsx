import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Line, Effects } from '@react-three/drei'
import { useStore } from '../../store/useStore'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'

const CATEGORIES = ['Movies', 'Series', 'Anime']
const SPACING = 5
const BRANCH_HEIGHT = 2.0

// Reuse Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Reuse Fragment Shader (Wide Aspect Ratio for Category Names)
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
      pos.x *= 2.5; // Aspect Correction (Wider for Categories)

      // Box Dimensions
      vec2 size = vec2(2.1, 0.75); 
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

function CategoryBranch({ label, xPos, isUp, onClick, onHover }) {
    const textRef = useRef()
    const borderRef = useRef()
    const [hovered, setHovered] = useState(false)

    // Unique uniforms per instance
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('white') }, // Core White
        uHover: { value: 0 }
    }), [])

    // Y position for the text
    const yPos = isUp ? BRANCH_HEIGHT : -BRANCH_HEIGHT

    // String Connection Logic (Connect to box edge)
    // Box Height approx 1.25 (half height) -> roughly yPos - 1.25?
    // Using explicit logic from YearBarrel but simplified
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
            uniforms.uHover.value = THREE.MathUtils.lerp(
                uniforms.uHover.value,
                targetHover,
                0.1
            )
        }

        // Text Color Logic
        if (textRef.current) {
            textRef.current.material.color.lerp(hovered ? new THREE.Color("white") : new THREE.Color("#aaaaaa"), 0.1)
        }
    })

    return (
        <group>
            {/* The Branch Line */}
            <Line
                points={points}
                color="white"
                lineWidth={1.5}
                transparent
                opacity={0.8}
            />

            {/* Node Group (Centered at yPos) */}
            <group position={[xPos, yPos, 0]}>
                {/* Glowing Box Mesh (Physical) */}
                <mesh
                    ref={borderRef}
                    onPointerOver={() => {
                        setHovered(true)
                        onHover && onHover(label)
                    }}
                    onPointerOut={() => {
                        setHovered(false)
                        onHover && onHover(null)
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation()
                        onClick(label)
                    }}
                >
                    <planeGeometry args={[5.5, 2.6]} /> {/* Wider Box for Category Names */}
                    <shaderMaterial
                        uniforms={uniforms}
                        vertexShader={vertexShader}
                        fragmentShader={fragmentShader}
                        transparent
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                <Text
                    ref={textRef}
                    fontSize={1.0}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                    anchorX="center"
                    anchorY="middle"
                    position={[0, 0, 0.02]}
                    color="#aaaaaa"
                >
                    {label}
                </Text>
            </group>
        </group>
    )
}

function CategoryString({ onHover }) {
    const { setCategory, selectedYear } = useStore()
    const navigate = useNavigate()

    return (
        <group position={[0, -0.5, 0]}> {/* Slightly center vertically */}
            {/* Central String Line (Physical Mesh) */}
            <mesh position={[0, 0, -0.02]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 35, 8]} />
                <meshBasicMaterial color="white" transparent opacity={0.8} />
            </mesh>

            {CATEGORIES.map((cat, i) => {
                // Determine position: Center is index 1.
                // 0 -> -Spc, 1 -> 0, 2 -> +Spc
                const xPos = (i - 1) * SPACING
                // Pattern: Up, Down, Up (i=0 Even->Up, i=1 Odd->Down, ...)
                const isUp = i % 2 === 0

                return (
                    <CategoryBranch
                        key={cat}
                        label={cat}
                        xPos={xPos}
                        isUp={isUp}
                        onClick={(c) => {
                            setCategory(c)
                            navigate('/genres')
                        }}
                        onHover={onHover}
                    />
                )
            })}
        </group>
    )
}

export default function CategoryBarrelCanvas({ onHover }) {
    return (
        <Canvas camera={{ position: [0, 0, 15], fov: 40 }} gl={{ antialias: true, alpha: true }}>


            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            <CategoryString onHover={onHover} />
        </Canvas>
    )
}
