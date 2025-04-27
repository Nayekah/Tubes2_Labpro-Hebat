"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "next-themes"

export default function Wrapper() {
  const canvasRef = useRef(null)
  const { theme } = useTheme()
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    handleResize()

    const points = []
    const numPoints = 70
    const maxDistance = 150
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      points.forEach(point => {
        point.x += point.vx
        point.y += point.vy
        
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1
      })
      
      ctx.strokeStyle = theme === 'dark' ? 'rgba(150, 100, 255, 0.6)' : 'rgba(100, 50, 255, 0.6)'
      
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x
          const dy = points[i].y - points[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < maxDistance) {
            const opacity = 1 - distance / maxDistance
            
            ctx.beginPath()
            ctx.globalAlpha = opacity * 0.7
            ctx.moveTo(points[i].x, points[i].y)
            ctx.lineTo(points[j].x, points[j].y)
            ctx.stroke()
          }
        }
      }

      ctx.fillStyle = theme === 'dark' ? 'rgba(200, 200, 255, 0.6)' : 'rgba(50, 50, 100, 0.6)'
      ctx.globalAlpha = 1
      
      points.forEach(point => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })
      
      requestAnimationFrame(animate)
    }
    
    const animationId = requestAnimationFrame(animate)
    window.addEventListener('resize', handleResize)
    
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [theme])
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5,
      }}
    />
  )
}