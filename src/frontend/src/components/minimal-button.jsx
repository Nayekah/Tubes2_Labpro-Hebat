"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useFade from "./fade-effect"
import { useLanguage } from "./language-context"
import { useTheme } from "next-themes"

export default function UltraMinimalistButton() {
  const { language } = useLanguage()
  const { theme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  const buttonFade = useFade({ 
    threshold: 0.5, 
    delay: 400, 
    fadeOutDelay: 0,
    direction: "up" 
  })

  const buttonText = language === 'id' ? "Mulai Perjalanan" : "Start the Journey"

  const handleClick = () => {
    router.push('/visual')
  }
  
  return (
    <div 
      ref={buttonFade.ref}
      className={`flex justify-center ${buttonFade.fadeClasses}`}
    >
      <button 
        className="relative inline-block font-light text-sm tracking-wider uppercase px-8 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        aria-label={buttonText}
      >
        {/* Background with conditional styling based on hover state and theme */}
        <div 
          className={`absolute inset-0 rounded-full transition-colors duration-300 ease-out
            ${isHovered 
              ? 'bg-purple-600' 
              : 'bg-white dark:bg-black border border-black dark:border-white'}`}
        ></div>
        
        {/* Button text with conditional color based on hover state */}
        <span className={`relative z-10 transition-colors duration-300
          ${isHovered 
            ? 'text-white' 
            : 'text-black dark:text-white'}`}
        >
          {buttonText}
        </span>
      </button>
    </div>
  )
}