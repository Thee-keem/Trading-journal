"use client"

import { usePathname } from "next/navigation"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar, MobileNav } from "@/components/layout/sidebar"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/register"

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen text-foreground bg-background antialiased selection:bg-primary/30`}>
        {/* Mesh gradient */}
        <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" />

        {!isAuthPage && <MobileNav />}

        <div className="flex overflow-hidden h-screen">
          {!isAuthPage && <Sidebar />}

          <main className={`flex-1 overflow-y-auto w-full h-screen ${!isAuthPage ? "pt-14 pb-16 md:pt-0 md:pb-0" : ""}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
