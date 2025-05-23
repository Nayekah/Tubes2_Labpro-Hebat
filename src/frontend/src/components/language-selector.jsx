"use client"

import { useState, useRef, useEffect } from "react"
import { Globe, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "./language-context"
import { translations } from "./translations"
import { useTheme } from "next-themes"

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const languages = [
    { code: 'id', label: 'Bahasa' },
    { code: 'en', label: 'English' }
  ]
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelectLanguage = (langCode) => {
    setLanguage(langCode)
    setIsOpen(false)
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="outline" 
        className="text-sm flex items-center gap-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300">{translations[language].language}</span>
        <ChevronDown className={`h-4 w-4 transform transition-transform text-gray-600 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                onClick={() => handleSelectLanguage(lang.code)}
              >
                <span className="text-gray-700 dark:text-gray-300">{lang.label}</span>
                {language === lang.code && <Check className="h-4 w-4 text-green-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}