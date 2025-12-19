import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Cloud } from '@react-three/drei'
import { useRef } from 'react'

function MovingStars() {
    const ref = useRef()
    useFrame(() => {
        if (ref.current) ref.current.rotation.y += 0.0005
    })
    return <Stars ref={ref} radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
}

export default function Background3D() {
    return (
        <div className="absolute inset-0 -z-10">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <MovingStars />
                <ambientLight intensity={0.1} />
                <color attach="background" args={['#050505']} />
            </Canvas>
        </div>
    )
}
