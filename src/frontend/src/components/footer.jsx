"use client"

import { Mail, Github, Linkedin, Twitter, ExternalLink } from "lucide-react"
import { useLanguage } from "./language-context"
import { translations } from "./translations"
import useFade from "./fade-effect"

export default function Footer() {
  const { language } = useLanguage()
  const t = translations[language]
  
  const footerFade = useFade({ 
    threshold: 0.2, 
    delay: 100, 
    fadeOutDelay: 0,
    direction: "up" 
  })

  return (
    <footer 
      ref={footerFade.ref}
      className={`bg-black text-white py-8 px-4 ${footerFade.fadeClasses}`}
    >
      <div className="container mx-auto">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="mailto:your-email@example.com" className="hover:text-gray-400 transition-colors">
            <Mail size={20} />
            <span className="sr-only">Email</span>
          </a>
          <a href="https://github.com/Nayekah/Tubes2_Labpro-Hebat" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
            <Github size={20} />
            <span className="sr-only">GitHub</span>
          </a>
          <a href="https://linkedin.com/in/your-profile" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
            <Linkedin size={20} />
            <span className="sr-only">LinkedIn</span>
          </a>
          <a href="https://twitter.com/your-username" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
            <Twitter size={20} />
            <span className="sr-only">Twitter</span>
          </a>
          <a href="https://your-website.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
            <ExternalLink size={20} />
            <span className="sr-only">Website</span>
          </a>
        </div>

        <div className="text-center text-sm text-gray-400 mb-2">{t.footerCopyright}</div>

        <div className="text-center text-xs text-gray-500 max-w-3xl mx-auto">
          {t.footerDisclaimer}
        </div>
      </div>
    </footer>
  )
}