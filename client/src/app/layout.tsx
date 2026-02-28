import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar, MobileNav } from "@/components/layout/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NovaTrade — Performance Intelligence",
  description: "A professional trader command center with AI insights.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen text-foreground bg-background antialiased selection:bg-primary/30`}>
        {/* Mesh gradient */}
        <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" />

        {/* Mobile top + bottom navbar */}
        <MobileNav />

        <div className="flex overflow-hidden h-screen">
          {/* Desktop sidebar */}
          <Sidebar />

          {/* Main content — add top padding on mobile for the header bar, bottom padding for tab bar */}
          <main className="flex-1 overflow-y-auto w-full h-screen pt-14 pb-16 md:pt-0 md:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
