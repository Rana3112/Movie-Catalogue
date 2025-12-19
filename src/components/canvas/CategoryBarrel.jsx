import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Line, Effects } from '@react-three/drei'
import { useStore } from '../../store/useStore'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'

const CATEGORIES = ['Movies', 'Series', 'Anime']
const SPACING = 5
const BRANCH_HEIGHT = 2.0

function CategoryBranch({ label, xPos, isUp, onClick }) {
    const textRef = useRef()
    const [hovered, setHovered] = useState(false)

    // Y position for the text
    const yPos = isUp ? BRANCH_HEIGHT : -BRANCH_HEIGHT

    const points = useMemo(() => [
        [xPos, 0, 0],
        [xPos, yPos * 0.8, 0]
    ], [xPos, yPos])

    useFrame((state) => {
        if (!textRef.current) return

        // Hover animation
        const targetScale = hovered ? 1.5 : 1
        textRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)

        const targetColor = hovered ? new THREE.Color("#ffd700") : new THREE.Color("white")
        textRef.current.material.color.lerp(targetColor, 0.1)
    })

    return (
        <group>
            {/* The Branch Line */}
            <Line
                points={points}
                color={hovered ? "#ffd700" : "white"}
                lineWidth={hovered ? 3 : 1}
                transparent
                opacity={hovered ? 1 : 0.4}
            />

            {/* The Text Node */}
            <group position={[xPos, yPos, 0]}>
                {/* Hit Area for easier clicking */}
                <mesh
                    visible={false}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onPointerDown={(e) => {
                        e.stopPropagation()
                        onClick(label)
                    }}
                >
                    <planeGeometry args={[4, 2]} />
                </mesh>

                <Text
                    ref={textRef}
                    fontSize={1.2}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                    anchorX="center"
                    anchorY={isUp ? "bottom" : "top"}
                >
                    {label}
                </Text>
            </group>
        </group>
    )
}

function CategoryString() {
    const { setCategory, selectedYear } = useStore()
    const navigate = useNavigate()

    return (
        <group position={[0, -0.5, 0]}> {/* Slightly center vertically */}
            {/* Central String Line */}
            <Line
                points={[[-15, 0, 0], [15, 0, 0]]}
                color="#444"
                lineWidth={2}
            />

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
                    />
                )
            })}
        </group>
    )
}

export default function CategoryBarrelCanvas() {
    return (
        <Canvas camera={{ position: [0, 0, 15], fov: 40 }} gl={{ antialias: true }}>
            <color attach="background" args={['#000']} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            <CategoryString />
        </Canvas>
    )
}
