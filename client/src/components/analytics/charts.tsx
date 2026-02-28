"use client"
import React, { useMemo } from "react"
import dynamic from "next/dynamic"

const AreaChart = dynamic(() => import("recharts").then(r => r.AreaChart), { ssr: false })
const Area = dynamic(() => import("recharts").then(r => r.Area), { ssr: false })
const BarChart = dynamic(() => import("recharts").then(r => r.BarChart), { ssr: false })
const Bar = dynamic(() => import("recharts").then(r => r.Bar), { ssr: false })
const LineChart = dynamic(() => import("recharts").then(r => r.LineChart), { ssr: false })
const Line = dynamic(() => import("recharts").then(r => r.Line), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(r => r.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(r => r.YAxis), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(r => r.Tooltip), { ssr: false })
const ReferenceLine = dynamic(() => import("recharts").then(r => r.ReferenceLine), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then(r => r.ResponsiveContainer), { ssr: false })

const tooltipStyle = {
    contentStyle: { backgroundColor: "#0a0f1e", borderColor: "#1e2d45", borderRadius: "10px", color: "#f8fafc", fontSize: "12px" },
    itemStyle: { color: "#94a3b8" },
}
const axisProps = { stroke: "#1e293b", tick: { fill: "#475569", fontSize: 11 }, axisLine: false, tickLine: false }

// Equity Curve
export function EquityCurveChart({ data }: { data: { date: string; equity: number; pnl: number }[] }) {
    const sampled = data.filter((_, i) => i % 2 === 0)
    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sampled} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" {...axisProps} tickFormatter={v => v.slice(5)} interval={19} />
                <YAxis {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} domain={["auto", "auto"]} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                <ReferenceLine y={50000} stroke="#334155" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} fill="url(#eqGrad)" animationDuration={1800} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// Drawdown Curve
export function DrawdownChart({ data }: { data: { date: string; dd: number }[] }) {
    const sampled = data.filter((_, i) => i % 2 === 0)
    const minDD = Math.min(...data.map(d => d.dd))
    return (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sampled} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" {...axisProps} tickFormatter={v => v.slice(5)} interval={19} />
                <YAxis {...axisProps} tickFormatter={v => `${v.toFixed(1)}%`} domain={[minDD * 1.1, 0.5]} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "Drawdown"]} />
                <ReferenceLine y={0} stroke="#334155" />
                <ReferenceLine y={minDD} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Max DD ${minDD.toFixed(1)}%`, fill: "#ef4444", fontSize: 10 }} />
                <Area type="monotone" dataKey="dd" stroke="#ef4444" strokeWidth={1.5} fill="url(#ddGrad)" animationDuration={1800} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// PnL Distribution Histogram
export function PnlHistogram({ data }: { data: { range: string; count: number; isLoss: boolean }[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 24 }}>
                <XAxis dataKey="range" {...axisProps} angle={-35} textAnchor="end" interval={0} tick={{ fill: "#475569", fontSize: 9 }} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [Number(v), "Frequency"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1200}
                    fill="#3b82f6"
                // individual fill per cell via cell rendering is tricky without Cell import; use a split approach
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

// Monte Carlo bands
export function MonteCarloCurve({ data }: { data: { step: number; p5: number; p25: number; median: number; p75: number; p95: number }[] }) {
    const sampled = data.filter((_, i) => i % 2 === 0)
    return (
        <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={sampled} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="mcOuter" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mcInner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="step" {...axisProps} tickFormatter={v => `T${v}`} />
                <YAxis {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} domain={["auto", "auto"]} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, ""]} />
                <ReferenceLine y={50000} stroke="#334155" strokeDasharray="4 4" label={{ value: "Start", fill: "#475569", fontSize: 10 }} />
                <Area type="monotone" dataKey="p95" stroke="#6366f1" strokeWidth={0} fill="url(#mcOuter)" animationDuration={1500} dot={false} name="95th pct" />
                <Area type="monotone" dataKey="p75" stroke="#6366f1" strokeWidth={0.5} fill="url(#mcInner)" animationDuration={1500} dot={false} name="75th pct" />
                <Line type="monotone" dataKey="median" stroke="#3b82f6" strokeWidth={2.5} dot={false} animationDuration={1500} name="Median" />
                <Area type="monotone" dataKey="p25" stroke="#ef4444" strokeWidth={0.5} fill="none" animationDuration={1500} dot={false} name="25th pct" />
                <Line type="monotone" dataKey="p5" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} animationDuration={1500} name="Worst 5%" />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// Monthly PnL bars
export function MonthlyPnlBars({ data }: { data: { name: string; pnl: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "PnL"]} cursor={{ fill: "#1e293b", opacity: 0.4 }} />
                <ReferenceLine y={0} stroke="#334155" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={1200}
                    fill="#3b82f6"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
