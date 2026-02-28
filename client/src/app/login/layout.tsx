import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign In — NovaTrade",
}

// Login page uses its own standalone layout — no sidebar/navbar
export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
