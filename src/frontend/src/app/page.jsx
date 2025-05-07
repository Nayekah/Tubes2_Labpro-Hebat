"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, Volume2, VolumeX, Play, Pause, Music, Volume1 } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageSelector from "@/components/language-selector";
import TypingEffect from "@/components/typing-effect";
import Footer from "@/components/footer";
import Model from "@/components/model";
import UltraMinimalistButton from "@/components/minimal-button";
import { useLanguage } from "@/components/language-context";
import { translations } from "@/components/translations";
import useFade from "@/components/fade-effect";
import Navbar from "./components/navbar.jsx";
import Background from "@/components/background";

export default function Home() {
  const headerRef = useRef(null);
  const { language } = useLanguage();
  const t = translations[language];

  const [headerHeight, setHeaderHeight] = useState(0);

  const heroImage = useFade({
    threshold: 0.2,
    delay: 100,
    fadeOutDelay: 0,
    direction: "up",
  });
  const welcomeText = useFade({
    threshold: 0.3,
    delay: 300,
    fadeOutDelay: 0,
    direction: "up",
  });
  const modelSection = useFade({
    threshold: 0.1,
    delay: 200,
    fadeOutDelay: 0,
    direction: "up",
  });

  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      setHeaderHeight(height);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Background />
      <Navbar />

      {/* Main content with padding to account for fixed header */}
      <main className="flex-1 container mx-auto px-4 py-6" style={{ paddingTop: `calc(${headerHeight}px + 1.5rem)` }}>
        <div className="w-full max-w-8xl mx-auto">
          {/* Larger image area with fade effect - Fixed positioning and height */}
          <div
            ref={heroImage.ref}
            className={`h-[350px] md:h-[400px] bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg overflow-hidden relative mb-12 ${heroImage.fadeClasses}`}>
            <div className="absolute inset-0 bg-[url('/proto.jpg')] bg-cover bg-center opacity-50" 
                style={{ 
                  objectFit: "cover",
                  objectPosition: "center 30%", /* Shift image down to see more of the top */
                  backgroundPosition: "center 30%" /* Adjust this value to move the background image up or down */
                }}>
            </div>
          </div>

          {/* Welcome text with fade effect */}
          <div ref={welcomeText.ref} className={`text-center mb-12 ${welcomeText.fadeClasses}`}>
            <div className="h-6 mb-2">
              <TypingEffect />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6">{t.welcomeTitle}</h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-lg md:text-xl">{t.welcomeSubtitle}</p>
          </div>

          {/* 3D Model with fade effect */}
          <div ref={modelSection.ref} className={`pt-64 mb-16 ${modelSection.fadeClasses}`}>
            <Model />
          </div>

          {/* Start the Journey Button */}
          <div className="mb-64">
            <UltraMinimalistButton />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}