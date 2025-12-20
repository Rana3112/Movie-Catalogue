import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import './Cubes.css';

const Cubes = ({
    gridSize = 10,
    cubeSize = 20,
    cellGap = 4,
    maxAngle = 70, // Max rotation angle
    radius = 5, // Influence radius (in grid cells) for mouse hover
    duration = 0.4,
    easing = 'power2.out',
    borderStyle = '1px solid rgba(255, 255, 255, 0.08)',
    faceColor = '#050816',
    shadow = '0 18px 45px rgba(0, 0, 0, 0.7)',
    rippleColor = '#6366f1',
    rippleSpeed = 1.5,
    autoAnimate = true,
    rippleOnClick = true,
}) => {
    const containerRef = useRef(null);
    const cubesRef = useRef([]);

    // Generate grid array
    const grid = useMemo(() => {
        return Array.from({ length: gridSize * gridSize }, (_, i) => i);
    }, [gridSize]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Set CSS Variables dynamically
        container.style.setProperty('--cube-size', `${cubeSize}px`);
        container.style.setProperty('--face-color', faceColor);
        container.style.setProperty('--border-style', borderStyle);
        container.style.setProperty('--shadow-color', shadow);

        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate Center of the Grid to adjust hover logic if needed
            // But standard logic is distance from cursor to each cube center.

            cubesRef.current.forEach((cube, i) => {
                if (!cube) return;

                // Grid coordinates
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;

                // Cube position relative to container
                // Account for gap: (size + gap) * index
                const cubeX = col * (cubeSize + cellGap) + cubeSize / 2;
                const cubeY = row * (cubeSize + cellGap) + cubeSize / 2;

                const dx = mouseX - cubeX;
                const dy = mouseY - cubeY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Interaction radius in pixels
                const interactRadius = radius * (cubeSize + cellGap);

                if (dist < interactRadius) {
                    // Calculate rotation based on relative position
                    // Mouse is to the right -> dx > 0 -> should rotate Y to look at mouse?
                    // Actually usually it acts like a magnet or a tilt.
                    // Let's implement a "Look At" or "Tilt Away" effect. 
                    // Standard "interactive wall" tilts elements towards cursor.

                    // Example:
                    // Mouse Top-Right of cube -> Cube tilts Top-Right (RotateX negative, RotateY positive)

                    // Normalize distance 0 to 1 (1 being center, 0 being edge of radius)
                    const influence = 1 - Math.min(dist / interactRadius, 1);

                    // A simple tilt logic:
                    const rotateY = (dx / interactRadius) * maxAngle * influence;
                    const rotateX = -(dy / interactRadius) * maxAngle * influence;

                    gsap.to(cube, {
                        rotationX: rotateX,
                        rotationY: rotateY,
                        duration: duration,
                        ease: easing
                    });
                } else {
                    // Reset if Idle
                    if (!autoAnimate) {
                        gsap.to(cube, {
                            rotationX: 0,
                            rotationY: 0,
                            duration: duration,
                            ease: easing
                        });
                    }
                }
            });
        };

        // Auto Animate (Idle Wave) logic
        let idleTweens = [];
        if (autoAnimate) {
            // Simple sine wave motion
            cubesRef.current.forEach((cube, i) => {
                if (!cube) return;
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;

                // Stagger based on position
                const t = gsap.to(cube, {
                    rotationX: 15,
                    rotationY: 15,
                    duration: 2,
                    yoyo: true,
                    repeat: -1,
                    ease: "sine.inOut",
                    delay: (row + col) * 0.1
                });
                idleTweens.push(t);
            });
        }


        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', () => {
            // Reset all on leave
            cubesRef.current.forEach(cube => {
                gsap.to(cube, { rotationX: 0, rotationY: 0, duration: 1 });
            });
        });

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', () => { });
            idleTweens.forEach(t => t.kill());
        };
    }, [gridSize, cubeSize, cellGap, maxAngle, radius, duration, easing, faceColor, borderStyle, shadow, autoAnimate]);

    // Click Ripple Logic
    const handleContainerClick = (e) => {
        if (!rippleOnClick) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        cubesRef.current.forEach((cube, i) => {
            if (!cube) return;
            // Grid coordinates
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const cubeX = col * (cubeSize + cellGap) + cubeSize / 2;
            const cubeY = row * (cubeSize + cellGap) + cubeSize / 2;

            const dx = clickX - cubeX;
            const dy = clickY - cubeY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const delay = dist * 0.001 * rippleSpeed; // Delay based on distance

            // Flash color?
            // Since we use CSS variable for face color, strict GSAP color tween might be tricky on nested faces 
            // UNLESS we tween the CSS var on the element.
            // Better to tween z-pos or scale for ripple.

            gsap.to(cube, {
                z: 50, // Pop out
                scale: 0.9,
                borderColor: rippleColor,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                delay: delay,
                ease: "power1.out"
            });
        });
    };

    return (
        <div
            className="default-animation"
            ref={containerRef}
            onClick={handleContainerClick}
        >
            <div
                className="default-animation--scene"
                style={{
                    gridTemplateColumns: `repeat(${gridSize}, ${cubeSize}px)`,
                    gap: `${cellGap}px`
                }}
            >
                {grid.map((_, i) => (
                    <div
                        key={i}
                        className="cube"
                        ref={el => cubesRef.current[i] = el}
                    >
                        <div className="cube-face cube-face--front"></div>
                        <div className="cube-face cube-face--back"></div>
                        <div className="cube-face cube-face--right"></div>
                        <div className="cube-face cube-face--left"></div>
                        <div className="cube-face cube-face--top"></div>
                        <div className="cube-face cube-face--bottom"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Cubes;
