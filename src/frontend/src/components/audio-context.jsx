"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from "react"

// Define the song database
const songDatabase = [
  { id: 1, title: "Next Door", artist: "Zachz Winner", url: "../music/nextdoor.mp3" },
  { id: 2, title: "Mortals", artist: "Warriyo", url: "../music/mortals.mp3" },
  { id: 3, title: "Consume", artist: "Chase Atlantic", url: "../music/consume.mp3" },
  { id: 4, title: "Un-Apex", artist: "Tk Ling", url: "../music/unapex.mp3" },
  { id: 5, title: "ETA", artist: "NewJeans", url: "../music/eta.mp3" },
];

const AudioContext = createContext()

export function AudioProvider({ children }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [currentSong, setCurrentSong] = useState({
    id: 5,
    title: "ETA",
    artist: "NewJeans",
    url: "/music/eta.mp3",
  })
  const audioRef = useRef(null)
  const audioInitializedRef = useRef(false)
  
  // Initialize audio element - use ref instead of state to prevent loops
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioInitializedRef.current) {
      audioRef.current = new Audio(currentSong.url)
      audioRef.current.volume = volume
      audioRef.current.loop = true
      
      // Set up event listeners
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      
      audioRef.current.addEventListener('play', handlePlay)
      audioRef.current.addEventListener('pause', handlePause)
      
      audioInitializedRef.current = true
      
      // Clean up
      return () => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.removeEventListener('play', handlePlay)
          audioRef.current.removeEventListener('pause', handlePause)
        }
      }
    }
  }, []) // Empty dependency array to run only once
  
  // Handle song changes
  useEffect(() => {
    if (audioRef.current && audioInitializedRef.current) {
      const wasPlaying = !audioRef.current.paused
      audioRef.current.src = currentSong.url
      audioRef.current.load()
      
      if (wasPlaying) {
        const playPromise = audioRef.current.play()
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log("Play error:", err)
            // Auto-retry play on user interaction
            const handleUserInteraction = () => {
              audioRef.current.play()
              document.removeEventListener('click', handleUserInteraction)
            }
            document.addEventListener('click', handleUserInteraction)
          })
        }
      }
    }
  }, [currentSong]) // Only depends on currentSong changes

  // Handle volume changes - without depending on isMuted in dependencies
  useEffect(() => {
    if (audioRef.current && audioInitializedRef.current) {
      audioRef.current.volume = volume
      
      // Update muted state based on volume without creating a loop
      if (volume === 0 && !isMuted) {
        setIsMuted(true)
        audioRef.current.muted = true
      } else if (volume > 0 && isMuted) {
        setIsMuted(false)
        audioRef.current.muted = false
      }
    }
  }, [volume]) // Only depends on volume changes
  
  // Separate effect for muted changes to avoid loops
  useEffect(() => {
    if (audioRef.current && audioInitializedRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  // Persist audio state between page loads
  useEffect(() => {
    if (typeof window !== 'undefined' && audioInitializedRef.current) {
      const handleBeforeUnload = () => {
        // We need to store playback state before unload
        if (audioRef.current && !audioRef.current.paused) {
          localStorage.setItem('music-playing', 'true')
          localStorage.setItem('current-song', JSON.stringify(currentSong))
          localStorage.setItem('volume-level', volume.toString())
        }
      }
      
      window.addEventListener('beforeunload', handleBeforeUnload)
      
      // Try to restore state - but only once
      const restoreState = () => {
        const wasPlaying = localStorage.getItem('music-playing') === 'true'
        const savedSong = localStorage.getItem('current-song')
        const savedVolume = localStorage.getItem('volume-level')
        
        if (savedVolume) {
          setVolume(parseFloat(savedVolume))
        }
        
        if (savedSong) {
          try {
            setCurrentSong(JSON.parse(savedSong))
          } catch (e) {
            console.error("Failed to parse saved song", e)
          }
        }
        
        if (wasPlaying && audioRef.current) {
          // We need to wait for user interaction before playing
          const handleUserInteraction = () => {
            audioRef.current.play().catch(err => console.log("Play error on restore:", err))
            document.removeEventListener('click', handleUserInteraction)
          }
          document.addEventListener('click', handleUserInteraction)
        }
      }
      
      // Only restore once
      restoreState()
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, []) // Empty dependency to run once

  const playSong = (song) => {
    setCurrentSong(song)
    
    if (audioRef.current && audioInitializedRef.current) {
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log("Play error:", err)
          // Auto-retry play on user interaction
          const handleUserInteraction = () => {
            audioRef.current.play()
            document.removeEventListener('click', handleUserInteraction)
          }
          document.addEventListener('click', handleUserInteraction)
        })
      }
      
      setIsPlaying(true)
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current && audioInitializedRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        const playPromise = audioRef.current.play()
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log("Play error on toggle:", err)
            // Auto-retry play on user interaction
            const handleUserInteraction = () => {
              audioRef.current.play()
              setIsPlaying(true)
              document.removeEventListener('click', handleUserInteraction)
            }
            document.addEventListener('click', handleUserInteraction)
          })
        }
      }
    }
  }

  return (
    <AudioContext.Provider value={{
      isMuted,
      setIsMuted,
      isPlaying,
      setIsPlaying,
      volume,
      setVolume,
      currentSong,
      setCurrentSong,
      playSong,
      togglePlayPause,
      songDatabase
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}