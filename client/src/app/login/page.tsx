"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { TrendingUp, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

// Demo credentials for testing
const DEMO = { email: "trader@novatrade.io", password: "demo1234" }

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch("http://localhost:3001/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Login failed")
            }

            // Success
            localStorage.setItem("nova_token", data.token)
            localStorage.setItem("nova_user", JSON.stringify(data.user))

            setSuccess(true)
            await new Promise(r => setTimeout(r, 800))
            router.push("/")
        } catch (err: any) {
            setError(err.message || "Connection refused. Is the server running?")
        } finally {
            setLoading(false)
        }
    }

    const fillDemo = () => {
        setEmail(DEMO.email)
        setPassword(DEMO.password)
        setError("")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.2),transparent)]" />
            <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Animated grid lines */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
                backgroundSize: "60px 60px"
            }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl mb-4 shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                    >
                        <TrendingUp className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Nova<span className="text-blue-400">Trade</span></h1>
                    <p className="text-slate-500 text-sm mt-1">Performance Intelligence Platform</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-8 shadow-2xl">
                    <h2 className="text-lg font-bold text-white mb-1">Sign in</h2>
                    <p className="text-slate-500 text-xs mb-6">Access your trader command center</p>

                    {/* Demo quick-fill banner */}
                    <button
                        type="button"
                        onClick={fillDemo}
                        className="w-full mb-5 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 font-medium flex items-center justify-center gap-2 hover:bg-blue-500/15 transition-colors"
                    >
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Demo</span>
                        Click to fill demo credentials
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError("") }}
                                    placeholder="trader@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                                <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type={showPw ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError("") }}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {error}
                            </motion.div>
                        )}

                        {/* Success */}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Authenticated! Redirecting...
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_24px_rgba(59,130,246,0.3)] hover:shadow-[0_0_32px_rgba(59,130,246,0.5)] disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : (
                                <>Sign in <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-center gap-1 text-xs text-slate-500">
                        Don't have an account?
                        <Link href="#" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors ml-1">
                            Request access
                        </Link>
                    </div>
                </div>

                <p className="text-center text-[11px] text-slate-600 mt-5">
                    Protected by enterprise-grade security · v2.4.1
                </p>
            </motion.div>
        </div>
    )
}
