import React from "react";
import { useState, useEffect, useRef } from "react";
import { Search, Volume2, VolumeX, Play, Pause, Music, Volume1 } from "lucide-react";
import LanguageSelector from "@/components/language-selector";
import { useLanguage } from "@/components/language-context";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import { translations } from "@/components/translations";
import Wrapper from "@/components/background";

const Navbar = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const songDatabase = [
    { id: 1, title: "Next Door", artist: "Zachz Winner", url: "../music/nextdoor.mp3" },
    { id: 2, title: "Mortals", artist: "Warriyo", url: "../music/mortals.mp3" },
    { id: 3, title: "Consume", artist: "Chase Atlantic", url: "../music/consume.mp3" },
    { id: 4, title: "Un-Apex", artist: "Tk Ling", url: "../music/unapex.mp3" },
    { id: 5, title: "ETA", artist: "NewJeans", url: "../music/eta.mp3" },
  ];

  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showVolumeBar, setShowVolumeBar] = useState(false);
  const [currentSong, setCurrentSong] = useState({
    title: "ETA",
    artist: "NewJeans",
    url: "/music/eta.mp3",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const audioRef = useRef(null);
  const volumeBarRef = useRef(null);
  const headerRef = useRef(null);

  const filteredSongs = songDatabase.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playSong = (song) => {
    setCurrentSong(song);
    setShowResults(false);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch((err) => console.log("Play error:", err));
        setIsPlaying(true);
      }
    }, 100);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => console.log("Play error:", err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleVolumeBar = () => {
    setShowVolumeBar(!showVolumeBar);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;

      if (newVolume === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setShowResults(false);
      }

      if (showVolumeBar && !e.target.closest(".volume-container") && !e.target.closest(".volume-button")) {
        setShowVolumeBar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showVolumeBar]);

  useEffect(() => {
    // Only update the volume when it changes
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-4 w-4" />;
    } else if (volume < 0.5) {
      return <Volume1 className="h-4 w-4" />;
    } else {
      return <Volume2 className="h-4 w-4" />;
    }
  };

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-10 backdrop-blur-sm bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/ikuyo.png" alt="Ikuyoooo" width={70} height={70} className="text-purple-600" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative md:flex items-center search-container">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 w-64"
              />
            </div>

            {/* Dropdown hasil pencarian */}
            {showResults && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t.songsAvailable} ({filteredSongs.length})
                </div>

                {filteredSongs.length > 0 ? (
                  filteredSongs.map((song) => (
                    <div
                      key={song.id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                      onClick={() => playSong(song)}>
                      <Music className="h-4 w-4 mr-2 text-purple-500" />
                      <div>
                        <div className="font-medium">{song.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{song.artist}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t.noMatchingSongs}</div>
                )}
              </div>
            )}
          </div>

          {/* Player controls with toggle volume bar */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
            <button
              onClick={togglePlayPause}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <div className="mx-3 max-w-32 truncate">
              <div className="font-medium text-sm">{currentSong.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{currentSong.artist}</div>
            </div>

            {/* Volume control with togglable bar */}
            <div className="relative volume-container">
              <button
                onClick={toggleVolumeBar}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors volume-button"
                aria-label={isMuted ? "Unmute" : "Atur Volume"}>
                {getVolumeIcon()}
              </button>

              {showVolumeBar && (
                <div
                  ref={volumeBarRef}
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 w-24">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">{Math.round(volume * 100)}%</div>
                </div>
              )}
            </div>
          </div>

          <ThemeToggle />
          <LanguageSelector />
        </div>
      </div>
      <audio ref={audioRef} src={currentSong.url} loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      <Wrapper />

      {/* Fixed Header */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-10 backdrop-blur-sm bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/ikuyo.png" alt="Ikuyoooo" width={70} height={70} className="text-purple-600" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative md:flex items-center search-container">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 w-64"
                />
              </div>

              {/* Dropdown hasil pencarian */}
              {showResults && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t.songsAvailable} ({filteredSongs.length})
                  </div>

                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
                      <div
                        key={song.id}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                        onClick={() => playSong(song)}>
                        <Music className="h-4 w-4 mr-2 text-purple-500" />
                        <div>
                          <div className="font-medium">{song.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{song.artist}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t.noMatchingSongs}</div>
                  )}
                </div>
              )}
            </div>

            {/* Player controls with toggle volume bar */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <button
                onClick={togglePlayPause}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>

              <div className="mx-3 max-w-32 truncate">
                <div className="font-medium text-sm">{currentSong.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{currentSong.artist}</div>
              </div>

              {/* Volume control with togglable bar */}
              <div className="relative volume-container">
                <button
                  onClick={toggleVolumeBar}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors volume-button"
                  aria-label={isMuted ? "Unmute" : "Atur Volume"}>
                  {getVolumeIcon()}
                </button>

                {showVolumeBar && (
                  <div
                    ref={volumeBarRef}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 w-24">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">{Math.round(volume * 100)}%</div>
                  </div>
                )}
              </div>
            </div>

            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>
      </header>
    </header>
  );
};

export default Navbar;
