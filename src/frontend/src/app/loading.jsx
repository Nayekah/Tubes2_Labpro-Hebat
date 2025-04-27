"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useLanguage } from "@/components/language-context"
import { translations } from "@/components/translations"

export default function Loading() {
  const { theme } = useTheme()
  const { language } = useLanguage()
  const [dots, setDots] = useState(".")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return "."
        return prev + "."
      })
    }, 400)
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  const t = translations[language] || translations.en
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
      <div className="flex flex-col items-center">
        {/* GIF container with fixed dimensions and centered */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-12">
          <Image 
            src="/load.gif" 
            alt="Loading"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* Text aligned center */}
        <div className="text-center">
          <div className="text-2xl font-medium text-purple-400 mb-2">
            <span>{t.loading}</span>
            <span>{dots}</span>
          </div>
          
          <div className="text-sm text-gray-300">
            {theme === 'dark' ? t.loadingDark : t.loadingLight}
          </div>
        </div>
      </div>
    </div>
  )
}