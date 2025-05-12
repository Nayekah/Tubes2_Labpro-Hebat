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
  
  // Initialize audio element WITHOUT auto-play
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
          })
        }
      }
    }
  }, [currentSong]) // Only depends on currentSong changes

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current && audioInitializedRef.current) {
      audioRef.current.volume = volume
      
      // Update muted state based on volume
      if (volume === 0 && !isMuted) {
        setIsMuted(true)
        audioRef.current.muted = true
      } else if (volume > 0 && isMuted) {
        setIsMuted(false)
        audioRef.current.muted = false
      }
    }
  }, [volume])
  
  // Handle muted changes
  useEffect(() => {
    if (audioRef.current && audioInitializedRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  const playSong = (song) => {
    setCurrentSong(song)
    
    if (audioRef.current && audioInitializedRef.current) {
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log("Play error:", err)
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