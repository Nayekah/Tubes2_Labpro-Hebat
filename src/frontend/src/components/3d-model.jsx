"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Box, Sphere, Environment, Text, Ring } from "@react-three/drei"
import useFade from "./fade-effect"
import { useTheme } from "next-themes"

function ContributorRing({ contributors }) {
  const groupRef = useRef()
  const { theme } = useTheme()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    groupRef.current.rotation.y = time * 0.2
  })
  
  return (
    <group ref={groupRef}>
      {/* Ring */}
      <Ring
        args={[2.8, 3, 64]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <meshBasicMaterial 
          color={theme === 'dark' ? "#4b5563" : "#d1d5db"} 
          opacity={0.3}
          transparent
        />
      </Ring>
      
      {/* Contributors positioned on the ring */}
      {contributors.map((contributor, index) => {
        const angle = (Math.PI * 2 * index) / contributors.length
        const radius = 2.9
        
        return (
          <Text
            key={contributor.id}
            position={[
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius
            ]}
            fontSize={0.2}
            color={theme === 'dark' ? "#9ca3af" : "#6b7280"}
            anchorX="center"
            anchorY="middle"
            font="/fonts/helvetica.woff"
          >
            {contributor.name}
          </Text>
        )
      })}
    </group>
  )
}

function WireframeSphere() {
  const sphereRef = useRef()
  const boxRef = useRef()
  
  const [sphereOpacity, setSphereOpacity] = useState(0)
  const [boxOpacity, setBoxOpacity] = useState(0)
  const { theme } = useTheme()

  const contributors = [
    { name: "countz_zero", id: "10122010" },
    { name: "Farr36", id: "13523069" },
    { name: "Nayekah", id: "13523090" }
  ]

  useEffect(() => {
    const boxFadeIn = setTimeout(() => {
      setBoxOpacity(0.3)
    }, 500)
    
    const sphereFadeIn = setTimeout(() => {
      setSphereOpacity(1)
    }, 1000)
    
    return () => {
      clearTimeout(boxFadeIn)
      clearTimeout(sphereFadeIn)
    }
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    sphereRef.current.rotation.y = time * 0.1
    sphereRef.current.rotation.x = time * 0.05

    boxRef.current.rotation.y = time * 0.05
    boxRef.current.rotation.x = time * 0.025
    
    const pulsingOpacity = 0.7 + Math.sin(time * 0.5) * 0.3
    sphereRef.current.material.opacity = sphereOpacity * pulsingOpacity
  })
  
  const boxColor = theme === 'dark' ? "#FFFFFF" : "#333333"
  const sphereColor = theme === 'dark' ? "#CCCCCC" : "#666666"

  return (
    <>
      <Box
        ref={boxRef}
        args={[3, 3, 3]}
        position={[0, 0, 0]}
        material-color={boxColor}
        material-wireframe={true}
        material-transparent={true}
        material-opacity={boxOpacity}
      >
        <meshStandardMaterial wireframe color={boxColor} transparent opacity={boxOpacity} />
      </Box>
      <Sphere
        ref={sphereRef}
        args={[1.5, 32, 32]}
        position={[0, 0, 0]}
        material-color={sphereColor}
        material-wireframe={true}
        material-transparent={true}
        material-opacity={sphereOpacity}
      >
        <meshStandardMaterial wireframe color={sphereColor} transparent opacity={sphereOpacity} />
      </Sphere>
      
      <ContributorRing contributors={contributors} />
    </>
  )
}

export default function Model() {
  const modelFade = useFade({ 
    threshold: 0.2, 
    delay: 100, 
    fadeOutDelay: 0,
    once: false,
    direction: "up" 
  })

  return (
    <div 
      ref={modelFade.ref}
      className={`w-full h-[500px] rounded-lg overflow-hidden ${modelFade.fadeClasses}`}
    >
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <WireframeSphere />
        <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={0.5} />
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}