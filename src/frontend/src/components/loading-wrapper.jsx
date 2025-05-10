"use client"

import { useState, useEffect, useRef } from "react"
import Loading from "@/app/loading"
import { usePathname, useRouter } from "next/navigation"

export default function LoadingWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const pathnameRef = useRef("")
  const router = useRouter()
  const pathname = usePathname()

  // Initial loading when component mounts
  useEffect(() => {
    setIsMounted(true)
    
    // Set initial pathname
    pathnameRef.current = pathname
    
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)
    
    return () => clearTimeout(timer)
  }, []) // Empty dependency array - only runs once on mount
  
  // Handle route changes - use useRef to avoid infinite loop
  useEffect(() => {
    if (!isMounted) return
    
    // Only trigger loading on actual pathname changes
    if (pathname !== pathnameRef.current) {
      pathnameRef.current = pathname // Update the ref first
      
      setIsLoading(true)
      
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [pathname, isMounted])
  
  // Handle browser navigation events 
  useEffect(() => {
    if (!isMounted) return
    
    const handleStart = () => {
      setIsLoading(true)
    }
    
    window.addEventListener('beforeunload', handleStart)
    
    return () => {
      window.removeEventListener('beforeunload', handleStart)
    }
  }, [isMounted])

  if (!isMounted) {
    return <Loading />
  }
  
  return (
    <>
      {isLoading && <Loading />}
      <div 
        className={`${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
        style={{
          background: isLoading ? 'black' : 'transparent',
          transition: 'opacity 0.5s, background 0.5s'
        }}
      >
        {children}
      </div>
    </>
  )
}