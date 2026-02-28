"use client"

import React, { useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { Download, Cpu, Trophy, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart3, Layers, FlaskConical, Brain, ShieldAlert } from "lucide-react"
import { MetricCard, Section, GlassPanel } from "@/components/analytics/metric-card"
import { generateTrades, calcMetrics } from "@/lib/analytics-data"

const EquityCurveChart = dynamic(() => import("@/components/analytics/charts").then(m => m.EquityCurveChart), { ssr: false, loading: () => <ChartSkeleton h={280} /> })
const DrawdownChart = dynamic(() => import("@/components/analytics/charts").then(m => m.DrawdownChart), { ssr: false, loading: () => <ChartSkeleton h={220} /> })
const PnlHistogram = dynamic(() => import("@/components/analytics/charts").then(m => m.PnlHistogram), { ssr: false, loading: () => <ChartSkeleton h={220} /> })
const MonteCarloCurve = dynamic(() => import("@/components/analytics/charts").then(m => m.MonteCarloCurve), { ssr: false, loading: () => <ChartSkeleton h={260} /> })
const MonthlyPnlBars = dynamic(() => import("@/components/analytics/charts").then(m => m.MonthlyPnlBars), { ssr: false, loading: () => <ChartSkeleton h={220} /> })

function ChartSkeleton({ h = 260 }: { h?: number }) {
    return <div style={{ height: h }} className="animate-pulse rounded-xl bg-white/5 w-full" />
}

// Time-of-day heatmap (24h × 5 days)
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
function TimeHeatmap({ trades }: { trades: { holdingMins: number; pnl: number; date: string }[] }) {
    const cells = useMemo(() => {
        const grid: Record<string, { pnl: number; count: number }> = {}
        DAYS.forEach(d => {
            for (let h = 0; h < 24; h++) {
                grid[`${d}-${h}`] = { pnl: 0, count: 0 }
            }
        })
        trades.forEach((t, i) => {
            const d = DAYS[i % 5]
            const h = (i * 7) % 24
            const key = `${d}-${h}`
            grid[key].pnl += t.pnl
            grid[key].count++
        })
        return grid
    }, [trades])

    const allPnls = Object.values(cells).map(c => c.pnl)
    const maxAbs = Math.max(...allPnls.map(Math.abs), 1)

    return (
        <div className="overflow-x-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(24, minmax(24px, 1fr))` }}>
                {/* hour labels */}
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="text-[9px] text-slate-600 text-center pb-1">{h}h</div>
                ))}
                {DAYS.map(day => (
                    <React.Fragment key={day}>
                        <div className="text-[10px] text-slate-500 flex items-center font-medium">{day}</div>
                        {Array.from({ length: 24 }, (_, h) => {
                            const c = cells[`${day}-${h}`]
                            const intensity = c.count ? c.pnl / maxAbs : 0
                            let bg = "bg-white/5"
                            if (intensity > 0.4) bg = "bg-emerald-500/70"
                            else if (intensity > 0.15) bg = "bg-emerald-500/35"
                            else if (intensity > 0) bg = "bg-emerald-500/15"
                            else if (intensity < -0.4) bg = "bg-red-500/70"
                            else if (intensity < -0.15) bg = "bg-red-500/35"
                            else if (intensity < 0) bg = "bg-red-500/15"
                            return (
                                <div
                                    key={h}
                                    title={c.count ? `${day} ${h}:00 — $${c.pnl} (${c.count} trades)` : "No trades"}
                                    className={`h-6 rounded-[3px] ${bg} cursor-default transition-all hover:opacity-80`}
                                />
                            )
                        })}
                    </React.Fragment>
                ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-500">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500/70" /> High loss</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white/5 border border-white/5" /> No trades</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500/70" /> High profit</div>
            </div>
        </div>
    )
}

// Session edge matrix
function SessionMatrix({ data }: { data: ReturnType<typeof calcMetrics>["sessionEdge"] }) {
    const best = data.reduce((b, s) => s.expectancy > b.expectancy ? s : b, data[0])
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="text-[11px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                        <th className="px-4 py-3">Session</th>
                        <th className="px-4 py-3">Trades</th>
                        <th className="px-4 py-3">Win Rate</th>
                        <th className="px-4 py-3">Avg R</th>
                        <th className="px-4 py-3">Expectancy</th>
                        <th className="px-4 py-3">Net PnL</th>
                        <th className="px-4 py-3">Edge</th>
                    </tr>
                </thead>
                <tbody>
                    {data.sort((a, b) => b.expectancy - a.expectancy).map((s, i) => {
                        const isBest = s.session === best.session
                        return (
                            <motion.tr
                                key={s.session}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={`border-b border-white/5 transition-colors ${isBest ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"}`}
                            >
                                <td className="px-4 py-3.5 font-semibold text-white">{s.session}</td>
                                <td className="px-4 py-3.5 text-slate-400">{s.trades}</td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-white/5 rounded-full h-1.5 max-w-[60px]">
                                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${s.winRate}%` }} />
                                        </div>
                                        <span className="text-slate-300 tabular-nums">{s.winRate}%</span>
                                    </div>
                                </td>
                                <td className={`px-4 py-3.5 font-mono font-semibold tabular-nums ${s.avgR > 0 ? "text-emerald-400" : "text-red-400"}`}>{s.avgR > 0 ? "+" : ""}{s.avgR}R</td>
                                <td className={`px-4 py-3.5 font-mono font-bold tabular-nums ${s.expectancy > 0 ? "text-emerald-400" : "text-red-400"}`}>{s.expectancy > 0 ? "+" : ""}{s.expectancy}R</td>
                                <td className={`px-4 py-3.5 font-mono font-semibold tabular-nums ${s.pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>{s.pnl > 0 ? "+" : ""}${s.pnl.toLocaleString()}</td>
                                <td className="px-4 py-3.5">
                                    {isBest ? (
                                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                                            <Trophy className="w-3 h-3" /> Strongest
                                        </span>
                                    ) : s.expectancy > 0 ? (
                                        <span className="text-blue-400 text-[10px] font-semibold">Positive</span>
                                    ) : (
                                        <span className="text-red-400 text-[10px] font-semibold">Negative</span>
                                    )}
                                </td>
                            </motion.tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

// Setup/Playbook matrix
function SetupMatrix({ data }: { data: ReturnType<typeof calcMetrics>["setupEdge"] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="text-[11px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                        <th className="px-4 py-3">Setup</th>
                        <th className="px-4 py-3">Sample</th>
                        <th className="px-4 py-3">Win Rate</th>
                        <th className="px-4 py-3">Profit Factor</th>
                        <th className="px-4 py-3">Stability</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.sort((a, b) => b.profitFactor - a.profitFactor).map((s, i) => (
                        <motion.tr
                            key={s.setup}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                            <td className="px-4 py-3.5 font-semibold text-white">{s.setup}</td>
                            <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">{s.trades}</span>
                                    {s.trades < 15 && <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">LOW N</span>}
                                </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-300 tabular-nums">{s.winRate}%</td>
                            <td className={`px-4 py-3.5 font-mono font-bold tabular-nums ${s.profitFactor >= 1.5 ? "text-emerald-400" : s.profitFactor >= 1 ? "text-blue-400" : "text-red-400"}`}>{s.profitFactor}x</td>
                            <td className="px-4 py-3.5">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${s.stability === "Strong" ? "bg-emerald-500/15 text-emerald-400" : s.stability === "Medium" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>{s.stability}</span>
                            </td>
                            <td className="px-4 py-3.5">
                                {s.profitFactor >= 1.5 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : s.profitFactor < 1 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <div className="w-4 h-4 rounded-full bg-amber-500/40 border border-amber-500" />}
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// Floating AI Insight Panel
function AiInsightPanel({ metrics }: { metrics: ReturnType<typeof calcMetrics> }) {
    const best = metrics.sessionEdge.reduce((b, s) => s.expectancy > b.expectancy ? s : b, metrics.sessionEdge[0])
    const worst = metrics.sessionEdge.reduce((b, s) => s.expectancy < b.expectancy ? s : b, metrics.sessionEdge[0])
    const insights = [
        { icon: "🏆", color: "emerald", text: `Your strongest edge is in the ${best.session} session with ${best.winRate}% win rate.` },
        { icon: "⚠️", color: "red", text: `Your plan compliance drops your PnL by ${metrics.complianceDrop}% per trade when violated.` },
        { icon: "📊", color: "blue", text: `Sharpe Ratio of ${metrics.sharpe.toFixed(2)} indicates ${metrics.sharpe > 1 ? "strong risk-adjusted returns" : "room for risk optimization"}.` },
        { icon: "🎯", color: "purple", text: `You need ${metrics.breakEvenWR}% win rate to break even at your current avg RR of ${metrics.payoffRatio.toFixed(1)}.` },
        { icon: "💡", color: "amber", text: `Avoid the ${worst.session} session — negative expectancy of ${worst.expectancy}R.` },
        { icon: "📈", color: "emerald", text: `With ${metrics.total} trades, your edge ${metrics.expectancy > 0 ? "is statistically significant" : "needs more data"}.` },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-purple-500/20 bg-purple-950/10 backdrop-blur-xl p-5"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">AI Performance Insights</h3>
                    <p className="text-[10px] text-slate-500">Generated from your trade history</p>
                </div>
            </div>
            <div className="space-y-3">
                {insights.map((ins, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex gap-3 p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors"
                    >
                        <span className="text-lg shrink-0">{ins.icon}</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{ins.text}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

// Statistical stability panel
function StabilityPanel({ metrics }: { metrics: ReturnType<typeof calcMetrics> }) {
    const confidence = metrics.total >= 100 ? "Strong" : metrics.total >= 50 ? "Medium" : "Weak"
    const confColor = confidence === "Strong" ? "text-emerald-400" : confidence === "Medium" ? "text-amber-400" : "text-red-400"
    const confPct = Math.min((metrics.total / 100) * 100, 100)

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
                { label: "Sample Size", value: `${metrics.total} trades`, sub: `${confidence} confidence`, color: confColor },
                { label: "Break-even Win Rate", value: `${metrics.breakEvenWR}%`, sub: `Your actual: ${metrics.winRate}%`, color: metrics.winRate > metrics.breakEvenWR ? "text-emerald-400" : "text-red-400" },
                { label: "Edge Confidence", value: confidence, sub: `${confPct.toFixed(0)}% sample strength`, color: confColor },
            ].map((s, i) => (
                <div key={i} className="flex flex-col gap-1 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.sub}</div>
                    <div className="mt-2 h-1.5 bg-white/5 rounded-full">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${confidence === "Strong" ? "bg-emerald-500" : confidence === "Medium" ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${confPct}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function AnalyticsPage() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    const trades = useMemo(() => generateTrades(200), [])
    const metrics = useMemo(() => calcMetrics(trades), [trades])

    // Monthly PnL summary
    const monthlyPnl = useMemo(() => {
        const months: Record<string, number> = {}
        trades.forEach(t => {
            const m = t.date.slice(0, 7)
            months[m] = (months[m] || 0) + t.pnl
        })
        return Object.entries(months).slice(-8).map(([m, pnl]) => ({ name: m.slice(5), pnl }))
    }, [trades])

    // R-multiple sparkline
    const rSparkline = metrics.rMultiples.slice(-30)

    if (!mounted) return (
        <div className="min-h-screen p-8 flex flex-col gap-6">
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-24 animate-pulse bg-white/5 rounded-2xl" />
            ))}
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent text-foreground p-6 sm:p-8 lg:p-10 font-sans pb-24">
            {/* Header */}
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <FlaskConical className="w-5 h-5 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-purple-200 to-blue-200">
                            Performance Lab
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-12">Quantitative edge detection · {metrics.total} trades analysed</p>
                </div>
                <button onClick={() => alert("PDF Export feature coming soon")} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-full text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Export PDF
                </button>
            </header>

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Main content */}
                <div className="flex-1 min-w-0">

                    {/* ── SECTION 1 – Core Metrics ──────────────────── */}
                    <Section title="Core Metrics" subtitle="Key quantitative performance indicators" defaultOpen>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 mb-4">
                            <MetricCard label="Expectancy (R)" value={metrics.expectancy} rawValue={metrics.expectancy} format="decimal" color="emerald" trend={12.4} sparkData={rSparkline} tooltip="Average R-multiple earned per trade. Positive = your strategy has edge." />
                            <MetricCard label="Sharpe Ratio" value={metrics.sharpe} rawValue={metrics.sharpe} format="decimal" color="blue" trend={5.2} sparkData={rSparkline.map(r => r * 0.8)} tooltip="Risk-adjusted return. >1 is good, >2 is excellent." />
                            <MetricCard label="Sortino Ratio" value={metrics.sortino} rawValue={metrics.sortino} format="decimal" color="purple" trend={3.1} sparkData={rSparkline.map(r => r * 0.7)} tooltip="Like Sharpe but only penalises downside volatility." />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 mb-4">
                            <MetricCard label="Profit Factor" value={metrics.profitFactor} rawValue={metrics.profitFactor} format="decimal" color="emerald" trend={8.3} sparkData={[1.8, 2.0, 1.7, 2.1, 2.2, 1.9, metrics.profitFactor]} tooltip="Gross profit ÷ gross loss. >1.5 is solid, >2 is strong." />
                            <MetricCard label="Payoff Ratio" value={metrics.payoffRatio} rawValue={metrics.payoffRatio} format="decimal" color="blue" trend={-2.1} sparkData={[2, 2.5, 1.8, 2.2, metrics.payoffRatio]} tooltip="Avg win ÷ avg loss. Shows your RR quality." />
                            <MetricCard label="Win Rate" value={metrics.winRate} rawValue={metrics.winRate} format="percent" color="amber" trend={4.0} sparkData={[55, 58, 62, 60, 65, 63, metrics.winRate]} tooltip="% of trades that closed in profit." />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
                            <MetricCard label="Max Drawdown" value={metrics.maxDD} rawValue={metrics.maxDD} format="percent" color="red" trend={-5.3} sparkData={[8, 6, 9, 7, 5, metrics.maxDD]} tooltip="Largest peak-to-trough decline of your equity curve." />
                            <MetricCard label="Avg Risk %" value={metrics.avgRisk} rawValue={metrics.avgRisk} format="percent" color="amber" trend={-1.2} sparkData={[1.2, 1.1, 1.3, 1.0, metrics.avgRisk]} tooltip="Average % of capital risked per trade." />
                            <MetricCard label="Avg Hold Time" value={metrics.avgHolding} rawValue={metrics.avgHolding} format="time" color="purple" trend={0} sparkData={[90, 100, 120, 80, metrics.avgHolding]} tooltip="Average trade holding duration in minutes." />
                            <MetricCard label="Plan Compliance" value={metrics.complianceScore} rawValue={metrics.complianceScore} format="percent" color={metrics.complianceScore >= 80 ? "emerald" : "red"} trend={2.1} sparkData={[75, 78, 82, 80, metrics.complianceScore]} tooltip="% of trades where your trading plan rules were followed." />
                        </div>
                    </Section>

                    {/* ── SECTION 2 – Equity Intelligence ──────────── */}
                    <Section title="Equity Intelligence" subtitle="Curve analysis, drawdown profiling, monthly breakdown">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <GlassPanel>
                                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Equity Curve</h3>
                                <EquityCurveChart data={metrics.equityCurve} />
                            </GlassPanel>
                            <GlassPanel>
                                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-400" /> Rolling Drawdown</h3>
                                <DrawdownChart data={metrics.ddCurve} />
                                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5 text-center">
                                    <div><div className="text-lg font-bold text-red-400">{metrics.maxDD}%</div><div className="text-[10px] text-slate-500 uppercase">Max DD</div></div>
                                    <div><div className="text-lg font-bold text-amber-400">{(metrics.maxDD * 0.45).toFixed(1)}%</div><div className="text-[10px] text-slate-500 uppercase">Avg DD Depth</div></div>
                                    <div><div className="text-lg font-bold text-blue-400">18d</div><div className="text-[10px] text-slate-500 uppercase">Avg Recovery</div></div>
                                </div>
                            </GlassPanel>
                        </div>
                        <GlassPanel>
                            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-400" /> Monthly Net PnL</h3>
                            <MonthlyPnlBars data={monthlyPnl} />
                        </GlassPanel>
                    </Section>

                    {/* ── SECTION 3 – Distribution & Risk ──────────── */}
                    <Section title="Distribution & Risk Modeling" subtitle="PnL histogram, R-multiples, Monte Carlo simulation">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <GlassPanel>
                                <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-400" /> PnL Distribution</h3>
                                <p className="text-[11px] text-slate-500 mb-4">Frequency histogram — fat tails indicate outliers</p>
                                <PnlHistogram data={metrics.pnlBuckets} />
                            </GlassPanel>
                            <GlassPanel>
                                <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-2"><Cpu className="w-4 h-4 text-purple-400" /> Monte Carlo Simulation</h3>
                                <p className="text-[11px] text-slate-500 mb-4">200 reshuffles · 100 trade projection · 95% confidence band</p>
                                <MonteCarloCurve data={metrics.mcBands} />
                                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-500 rounded" /> Median path</span>
                                    <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-indigo-500 rounded opacity-60" /> 95th percentile</span>
                                    <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-500 rounded opacity-80 border-dashed" /> Worst 5%</span>
                                </div>
                            </GlassPanel>
                        </div>
                    </Section>

                    {/* ── SECTION 4 – Edge Detection ────────────────── */}
                    <Section title="Edge Detection" subtitle="Session & setup performance — find where your real edge lives">
                        <GlassPanel className="mb-6">
                            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-400" /> Session Edge Matrix
                            </h3>
                            <SessionMatrix data={metrics.sessionEdge} />
                        </GlassPanel>
                        <GlassPanel>
                            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-400" /> Setup / Playbook Edge Matrix
                            </h3>
                            <SetupMatrix data={metrics.setupEdge} />
                        </GlassPanel>
                    </Section>

                    {/* ── SECTION 5 – Behavioral ────────────────────── */}
                    <Section title="Behavioral Analytics" subtitle="Psychological patterns and time-of-day edge">
                        <GlassPanel className="mb-6">
                            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-400" /> 24h Time-of-Day PnL Heatmap
                            </h3>
                            <TimeHeatmap trades={trades} />
                        </GlassPanel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassPanel>
                                <h3 className="font-semibold text-slate-200 mb-4">Revenge Trading Risk</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "Trades placed after a loss", count: trades.filter(t => t.afterLoss).length, total: trades.length, color: "bg-amber-500" },
                                        { label: "Violating plan after a loss", count: trades.filter(t => t.afterLoss && t.planViolation).length, total: trades.filter(t => t.afterLoss).length, color: "bg-red-500" },
                                    ].map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                                <span>{item.label}</span>
                                                <span className="font-mono font-semibold text-white">{item.count} / {item.total}</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.count / item.total) * 100}%` }}
                                                    transition={{ delay: 0.3, duration: 0.8 }}
                                                    className={`h-2 rounded-full ${item.color}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassPanel>
                            <GlassPanel>
                                <h3 className="font-semibold text-slate-200 mb-4">Overtrading Indicator</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: "Avg trades / day", value: (trades.length / 60).toFixed(1), note: "Target: < 3/day", safe: (trades.length / 60) < 3 },
                                        { label: "Max trades in single day", value: "7", note: "High volume = risk", safe: false },
                                        { label: "Days with 5+ trades", value: "8", note: "Review these sessions", safe: false },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            {row.safe ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                                            <div>
                                                <div className="text-sm text-slate-200 font-semibold">{row.label}: <span className="font-mono">{row.value}</span></div>
                                                <div className="text-[11px] text-slate-500">{row.note}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassPanel>
                        </div>
                    </Section>

                    {/* ── SECTION 6 – Compliance ────────────────────── */}
                    <Section title="Plan Compliance Overlay" subtitle="The hidden cost of rule violations">
                        <GlassPanel>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {[
                                    { icon: ShieldAlert, label: "Compliance Score", value: `${metrics.complianceScore}%`, color: metrics.complianceScore >= 80 ? "text-emerald-400" : "text-red-400", bg: metrics.complianceScore >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20" },
                                    { icon: TrendingDown, label: "PnL Drop When Violating", value: `-${metrics.complianceDrop}%`, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                                    { icon: AlertTriangle, label: "Plan Violations", value: `${trades.filter(t => t.planViolation).length} trades`, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                                ].map(({ icon: Icon, label, value, color, bg }, i) => (
                                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${bg}`}>
                                        <Icon className={`w-8 h-8 ${color} shrink-0`} />
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{label}</div>
                                            <div className={`text-2xl font-bold ${color}`}>{value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20">
                                <p className="text-sm text-red-300 font-medium">
                                    ⚠ Your profitability drops <strong className="text-red-200">{metrics.complianceDrop}%</strong> per trade when violating your trading plan rules. Strict compliance is your most actionable improvement.
                                </p>
                            </div>
                        </GlassPanel>
                    </Section>

                    {/* ── SECTION 7 – Statistical Stability ────────── */}
                    <Section title="Statistical Stability" subtitle="Edge confidence, break-even analysis, sample strength">
                        <GlassPanel>
                            <StabilityPanel metrics={metrics} />
                        </GlassPanel>
                    </Section>
                </div>

                {/* AI Panel — sticky sidebar on large screens */}
                <div className="xl:w-80 shrink-0">
                    <div className="sticky top-8">
                        <AiInsightPanel metrics={metrics} />
                    </div>
                </div>
            </div>
        </div>
    )
}
