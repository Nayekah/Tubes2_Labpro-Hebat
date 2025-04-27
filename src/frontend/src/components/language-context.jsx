"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('id')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])
  
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])
  
  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id')
  }
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}