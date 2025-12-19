import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, Environment, Line, Effects } from '@react-three/drei'
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

function YearBranch({ year, xPos, isUp, onClick }) {
    const textRef = useRef()
    const [hovered, setHovered] = useState(false)

    // Y position for the text
    const yPos = isUp ? BRANCH_HEIGHT : -BRANCH_HEIGHT
    // Points for the branch line: [Start(on string), End(at number)]
    const points = useMemo(() => [
        [xPos, 0, 0],
        [xPos, yPos * 0.8, 0] // Stop slightly before text
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
                lineWidth={hovered ? 2 : 1}
                transparent
                opacity={hovered ? 1 : 0.3}
            />

            {/* The Year Node/Text */}
            <group position={[xPos, yPos, 0]}>
                <Text
                    ref={textRef}
                    fontSize={1.2}
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                    anchorX="center"
                    anchorY={isUp ? "bottom" : "top"}
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
    const state = useRef({
        x: 0,
        velocity: 0,
        isDragging: false
    })

    // Initial position to center on selected year
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

        // Physics
        if (!s.isDragging) {
            s.velocity *= 0.92 // Friction
        }

        s.x += s.velocity

        // Boundaries
        const minX = -((YEAR_END - YEAR_START) * X_SPACING + 10)
        const maxX = 10
        if (s.x > maxX) { s.x = maxX; s.velocity = 0; }
        if (s.x < minX) { s.x = minX; s.velocity = 0; }

        // Apply to Group
        if (groupRef.current) {
            groupRef.current.position.x = s.x
        }
    })

    const years = useMemo(() => {
        const arr = []
        for (let y = YEAR_START; y <= YEAR_END; y++) {
            arr.push(y)
        }
        return arr
    }, [])

    return (
        <>
            {/* Invisible Hit Plane for Dragging */}
            <mesh position={[0, 0, 0]} {...bind()} visible={false}>
                <planeGeometry args={[1000, 1000]} />
                <meshBasicMaterial />
            </mesh>

            <group ref={groupRef}>
                {/* Central String Line */}
                <Line
                    points={[[(YEAR_START - 10) * X_SPACING, 0, 0], [(YEAR_END + 10) * X_SPACING, 0, 0]]}
                    color="#444"
                    lineWidth={2}
                />

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
        <Canvas camera={{ position: [0, 0, 20], fov: 40 }} gl={{ antialias: true }}>
            <color attach="background" args={['#000']} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            <Timeline />

            <Effects disableGamma>
                {/* We can add bloom or other effects here if needed later */}
            </Effects>
        </Canvas>
    )
}
