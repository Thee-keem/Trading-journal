"use client"
import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Info, ChevronDown } from "lucide-react"

// Animated counter
function useCounter(target: number, duration = 1200) {
    const [val, setVal] = useState(0)
    useEffect(() => {
        const step = target / (duration / 16)
        let cur = 0
        const id = setInterval(() => {
            cur = Math.min(cur + step, target)
            setVal(cur)
            if (cur >= target) clearInterval(id)
        }, 16)
        return () => clearInterval(id)
    }, [target, duration])
    return val
}

interface MetricCardProps {
    label: string
    value: string | number
    rawValue: number
    suffix?: string
    prefix?: string
    trend?: number          // positive = improved
    sparkData?: number[]   // kept in interface for backward compat, no longer rendered
    color?: "blue" | "emerald" | "purple" | "amber" | "red"
    tooltip?: string
    format?: "decimal" | "percent" | "dollar" | "time"
}

const colorMap = {
    blue: { text: "text-blue-400", glow: "shadow-[0_0_24px_rgba(59,130,246,0.25)]", border: "border-blue-500/20", bg: "bg-blue-500/5" },
    emerald: { text: "text-emerald-400", glow: "shadow-[0_0_24px_rgba(52,211,153,0.25)]", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
    purple: { text: "text-purple-400", glow: "shadow-[0_0_24px_rgba(168,85,247,0.25)]", border: "border-purple-500/20", bg: "bg-purple-500/5" },
    amber: { text: "text-amber-400", glow: "shadow-[0_0_24px_rgba(251,191,36,0.25)]", border: "border-amber-500/20", bg: "bg-amber-500/5" },
    red: { text: "text-red-400", glow: "shadow-[0_0_24px_rgba(239,68,68,0.25)]", border: "border-red-500/20", bg: "bg-red-500/5" },
}

export function MetricCard({
    label, value, rawValue, trend, color = "blue", tooltip, format = "decimal"
}: MetricCardProps) {
    const [hovered, setHovered] = useState(false)
    const [showTip, setShowTip] = useState(false)
    const c = colorMap[color]
    const displayed = useCounter(rawValue)

    const formatted = (() => {
        if (format === "percent") return `${displayed.toFixed(1)}%`
        if (format === "dollar") return `$${Math.abs(displayed).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
        if (format === "time") return `${Math.round(displayed)}m`
        return displayed.toFixed(2)
    })()

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className={`relative rounded-2xl border ${c.border} ${c.bg} backdrop-blur-xl p-5 transition-all duration-300 ${hovered ? c.glow : ""}`}
        >
            {/* Label row */}
            <div className="flex items-center gap-1.5 mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                {tooltip && (
                    <button
                        onMouseEnter={() => setShowTip(true)}
                        onMouseLeave={() => setShowTip(false)}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                    >
                        <Info className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Tooltip */}
            {showTip && tooltip && (
                <div className="absolute top-12 left-0 right-0 z-20 bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-slate-300 shadow-2xl">
                    {tooltip}
                </div>
            )}

            {/* Value */}
            <div className={`text-3xl font-bold tracking-tight tabular-nums ${c.text}`}>{formatted}</div>

            {/* Trend */}
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend > 0 ? "+" : ""}{trend.toFixed(1)}% vs last period
                </div>
            )}
        </motion.div>
    )
}

// Collapsible section wrapper
export function Section({
    title, subtitle, children, defaultOpen = true
}: {
    title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="mb-8">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between mb-4 group text-left"
            >
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            <motion.div
                initial={false}
                animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
            >
                {children}
            </motion.div>
        </div>
    )
}

// Glass panel
export function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 ${className}`}>
            {children}
        </div>
    )
}
