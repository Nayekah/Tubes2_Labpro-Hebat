"use client"

import { useRef, useEffect, useState } from "react"

export default function useFade({
  threshold = 0.1,
  rootMargin = "0px",
  once = false,
  delay = 0,
  fadeOutDelay = 0,
  direction = "none"
} = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const fadeInTimeout = setTimeout(() => {
            setIsVisible(true)
            setHasBeenVisible(true)
          }, delay)
          
          return () => clearTimeout(fadeInTimeout)
        } 
        else {
          if (!once || (once && hasBeenVisible)) {
            const boundingRect = entry.boundingClientRect;
            const windowHeight = window.innerHeight;
            
            const earlyFadeOutPoint = boundingRect.bottom < windowHeight * 0.2 || 
                                     boundingRect.top > windowHeight * 0.8;
                                     
            const fadeOutTimeout = setTimeout(() => {
              if (earlyFadeOutPoint || !entry.isIntersecting) {
                setIsVisible(false);
              }
            }, fadeOutDelay)
            
            return () => clearTimeout(fadeOutTimeout)
          }
        }
      },
      {
        threshold,
        rootMargin: "-10% 0px -10% 0px"
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, once, delay, fadeOutDelay, hasBeenVisible])

  let transformClass = ""
  let transitionClass = "transition-opacity"
  
  if (direction !== "none") {
    transitionClass = "transition-all"
    const distance = "20px"
    
    if (direction === "up") {
      transformClass = isVisible ? "translate-y-0" : `translate-y-[${distance}]`
    } else if (direction === "down") {
      transformClass = isVisible ? "translate-y-0" : `-translate-y-[${distance}]`
    } else if (direction === "left") {
      transformClass = isVisible ? "translate-x-0" : `translate-x-[${distance}]`
    } else if (direction === "right") {
      transformClass = isVisible ? "translate-x-0" : `-translate-x-[${distance}]`
    }
  }

  return {
    ref,
    isVisible,
    fadeClasses: `${transitionClass} duration-700 ease-out transform ${
      isVisible ? "opacity-100" : "opacity-0"
    } ${transformClass}`
  }
}