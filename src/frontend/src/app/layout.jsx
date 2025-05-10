import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-context"
import { AudioProvider } from "@/components/audio-context"
import LoadingWrapper from "@/components/loading-wrapper"
import localFont from 'next/font/local'

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Labpro Hebat 😹",
  description: "Platform terkemuka untuk aplikasi yang inovatif dan jaringan rantai blok",
}

/* 
const helvetica = localFont({
  src: [
    {
      path: '../../public/fonts/helvetica.woff',
      weight: '400',
      style: 'normal',
    }
  ],
  variable: '--font-helvetica',
})
*/

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <AudioProvider>
              <LoadingWrapper>
                {children}
              </LoadingWrapper>
            </AudioProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}