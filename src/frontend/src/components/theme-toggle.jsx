"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-8 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    )
  }

  return (
    <button
      className="theme-toggle-track relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:bg-gray-300 dark:hover:bg-gray-600"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Background track with subtle icons */}
      <span className="absolute inset-0 flex items-center justify-between px-2 opacity-40">
        <Sun className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        <Moon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
      </span>
      
      {/* Sliding thumb with animated icons */}
      <span
        className={`theme-toggle-thumb relative h-6 w-6 transform rounded-full bg-white dark:bg-gray-900 shadow-md ${
          theme === "dark" ? "translate-x-9" : "translate-x-1"
        }`}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <Sun 
            className={`theme-toggle-icon absolute h-3.5 w-3.5 text-amber-500 ${
              theme === "dark" 
                ? "opacity-0 rotate-90 scale-0" 
                : "opacity-100 rotate-0 scale-100"
            }`} 
          />
          <Moon 
            className={`theme-toggle-icon absolute h-3.5 w-3.5 text-indigo-500 ${
              theme === "dark" 
                ? "opacity-100 rotate-0 scale-100" 
                : "opacity-0 -rotate-90 scale-0"
            }`} 
          />
        </span>
      </span>
    </button>
  )
}