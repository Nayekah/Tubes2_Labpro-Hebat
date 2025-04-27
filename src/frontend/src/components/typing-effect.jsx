"use client"

import { useState, useEffect, useRef } from "react"

const languageTexts = [
  "Ο Αλχημιστής", // Greek
  "錬金術師", // Japanese
  "炼金术士", // Chinese (Simplified)
  "연금술사", // Korean
  "Алхимик", // Russian
  "الخيميائي", // Arabic
  "रसायनज्ञ", // Hindi
  "Der Alchimist", // German
  "L'Alchimiste", // French
  "El alquimista", // Spanish
  "O Alquimista", // Portuguese
  "L'Alchimista", // Italian
  "Alkemisten", // Swedish
  "Alchemik", // Polish
  "De Alchemist", // Dutch
  "Nhà Giả Kim", // Vietnamese
  "Umlumbi", // Zulu
  "Az Alkimista", // Hungarian
  "The Alchemist", // English
  "Sang Alkemis", // Indonesian
]

export default function TypingEffect() {
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(150)

  const currentTextRef = useRef(languageTexts[0])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDeleting) {
        setDisplayText((prev) => prev.substring(0, prev.length - 1))
        setTypingSpeed(50)

        if (displayText === "") {
          setIsDeleting(false)
          setCurrentIndex((prevIndex) => (prevIndex + 1) % languageTexts.length)
          currentTextRef.current = languageTexts[(currentIndex + 1) % languageTexts.length]
          setTypingSpeed(150)
        }
      }
      else {
        const fullText = languageTexts[currentIndex]
        setDisplayText((prev) => fullText.substring(0, prev.length + 1))

        if (displayText === fullText) {
          setTypingSpeed(800)
          setTimeout(() => {
            setIsDeleting(true)
            setTypingSpeed(50)
          }, 2000)
        } else {
          setTypingSpeed(150 + Math.random() * 100)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [displayText, isDeleting, currentIndex, typingSpeed])

  return (
    <div className="text-purple-600 text-xl inline-block">
      <span>{displayText}</span>
      <span className="animate-pulse">|</span>
    </div>
  )
}
