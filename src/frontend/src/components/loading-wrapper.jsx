"use client"

import { useState, useEffect } from "react"
import Loading from "@/app/loading"
import { useRouter } from "next/navigation"

export default function LoadingWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  useEffect(() => {
    if (!isMounted) return

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)
    
    return () => clearTimeout(timer)
  }, [isMounted])
  
  useEffect(() => {
    if (!isMounted) return
    
    const handleStart = () => {
      setIsLoading(true)
    }
    
    const handleComplete = () => {
      setTimeout(() => setIsLoading(false), 300)
    }
    
    window.addEventListener('beforeunload', handleStart)
    
    return () => {
      window.removeEventListener('beforeunload', handleStart)
    }
  }, [router, isMounted])

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