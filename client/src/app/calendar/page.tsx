"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { fetchEconomicCalendar, type EconomicEvent } from "@/lib/api"
import { formatDistanceToNowStrict } from "date-fns"

const CURRENCIES = ["All", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "XAU"]
const IMPACTS = ["All", "High", "Medium", "Low"]

// Fallback mock data shown while backend is starting / offline
const FALLBACK_EVENTS: EconomicEvent[] = [
    { id: "f1", event_name: "Core CPI m/m", currency: "USD", impact: "High", event_time_utc: new Date(Date.now() + 60 * 15 * 1000).toISOString(), forecast: "0.3%", previous: "0.3%", actual: null, country: "USD" },
    { id: "f2", event_name: "ECB Press Conference", currency: "EUR", impact: "High", event_time_utc: new Date(Date.now() + 60 * 65 * 1000).toISOString(), forecast: null, previous: null, actual: null, country: "EUR" },
    { id: "f3", event_name: "GDP m/m", currency: "GBP", impact: "Medium", event_time_utc: new Date(Date.now() + 60 * 180 * 1000).toISOString(), forecast: "0.2%", previous: "0.1%", actual: null, country: "GBP" },
    { id: "f4", event_name: "BOJ Rate Decision", currency: "JPY", impact: "High", event_time_utc: new Date(Date.now() - 60 * 60 * 1000).toISOString(), forecast: "-0.1%", previous: "-0.1%", actual: "0.0%", country: "JPY" },
    { id: "f5", event_name: "BOC Rate Statement", currency: "CAD", impact: "Medium", event_time_utc: new Date(Date.now() + 60 * 600 * 1000).toISOString(), forecast: "4.5%", previous: "4.5%", actual: null, country: "CAD" },
    { id: "f6", event_name: "Unemployment Claims", currency: "USD", impact: "Medium", event_time_utc: new Date(Date.now() + 60 * 1200 * 1000).toISOString(), forecast: "215K", previous: "213K", actual: null, country: "USD" },
    { id: "f7", event_name: "ISM Manufacturing PMI", currency: "USD", impact: "Medium", event_time_utc: new Date(Date.now() + 60 * 90 * 1000).toISOString(), forecast: "49.5", previous: "49.3", actual: null, country: "USD" },
    { id: "f8", event_name: "Non-Farm Payrolls", currency: "USD", impact: "High", event_time_utc: new Date(Date.now() + 60 * 720 * 1000).toISOString(), forecast: "180K", previous: "175K", actual: null, country: "USD" },
]

// Countdown hook
function useCountdown(targetIso: string) {
    const [diff, setDiff] = useState(new Date(targetIso).getTime() - Date.now())
    useEffect(() => {
        const t = setInterval(() => setDiff(new Date(targetIso).getTime() - Date.now()), 1000)
        return () => clearInterval(t)
    }, [targetIso])
    if (diff <= 0) return "Released"
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${String(s).padStart(2, "0")}s`
}

function ImpactBadge({ impact }: { impact: string }) {
    const cfg = {
        High: "text-red-400 bg-red-500/10 border-red-500/20",
        Medium: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        Low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    }[impact] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20"

    const dot = {
        High: "bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]",
        Medium: "bg-orange-500",
        Low: "bg-slate-500",
    }[impact] ?? "bg-slate-500"

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest border ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {impact}
        </span>
    )
}

function EventRow({ ev, index }: { ev: EconomicEvent; index: number }) {
    const countdown = useCountdown(ev.event_time_utc)
    const isPast = new Date(ev.event_time_utc) < new Date()
    const isVerySoon = !isPast && new Date(ev.event_time_utc).getTime() - Date.now() < 30 * 60 * 1000

    return (
        <motion.tr
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            className={`border-b border-white/5 transition-colors group ${isVerySoon ? "bg-orange-500/5 hover:bg-orange-500/10" : "hover:bg-white/[0.02]"}`}
        >
            <td className="px-5 py-4">
                <div className={`font-mono font-semibold text-sm ${isPast ? "text-slate-500" : "text-slate-200"}`}>
                    {new Date(ev.event_time_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                    {new Date(ev.event_time_utc).toLocaleDateString([], { month: "short", day: "numeric" })}
                </div>
            </td>
            <td className="px-5 py-4">
                <span className="font-bold text-white tracking-widest bg-white/10 px-2 py-1 rounded-md text-xs">
                    {ev.currency}
                </span>
            </td>
            <td className="px-5 py-4"><ImpactBadge impact={ev.impact} /></td>
            <td className="px-5 py-4">
                <div className={`font-medium text-sm ${isPast ? "text-slate-400" : "text-slate-100"}`}>{ev.event_name}</div>
            </td>
            <td className="px-5 py-4">
                {ev.actual ? (
                    <span className="font-mono font-bold text-emerald-400 text-sm">{ev.actual}</span>
                ) : (
                    <span className="font-mono text-slate-600 text-sm">—</span>
                )}
            </td>
            <td className="px-5 py-4 font-mono text-slate-400 text-sm">{ev.forecast ?? "—"}</td>
            <td className="px-5 py-4 font-mono text-slate-400 text-sm">{ev.previous ?? "—"}</td>
            <td className="px-5 py-4">
                {isPast ? (
                    <span className="text-[11px] text-slate-600 font-medium">Released</span>
                ) : (
                    <span className={`font-mono font-semibold text-sm tabular-nums ${isVerySoon ? "text-orange-400" : "text-blue-400"}`}>
                        {countdown}
                    </span>
                )}
            </td>
        </motion.tr>
    )
}

export default function CalendarPage() {
    const [events, setEvents] = useState<EconomicEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [source, setSource] = useState<string>("loading")
    const [lastFetched, setLastFetched] = useState<Date | null>(null)

    const [filterImpact, setFilterImpact] = useState("All")
    const [filterCurrency, setFilterCurrency] = useState("All")
    const [highOnly, setHighOnly] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        setError(null)
        try {
            const data = await fetchEconomicCalendar()
            setEvents(data.events)
            setSource(data.source)
            setLastFetched(new Date(data.fetched_at))
        } catch (e: any) {
            setError(e.message)
            // Fall back to mock data
            setEvents(FALLBACK_EVENTS)
            setSource("offline_fallback")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const t = setInterval(() => load(true), 5 * 60 * 1000)
        return () => clearInterval(t)
    }, [load])

    const filtered = events.filter(ev => {
        if (highOnly && ev.impact !== "High") return false
        if (filterImpact !== "All" && ev.impact !== filterImpact) return false
        if (filterCurrency !== "All" && ev.currency !== filterCurrency) return false
        return true
    }).sort((a, b) => new Date(a.event_time_utc).getTime() - new Date(b.event_time_utc).getTime())

    const highImpactSoon = events.filter(e =>
        e.impact === "High" &&
        !e.actual &&
        new Date(e.event_time_utc).getTime() - Date.now() < 30 * 60 * 1000 &&
        new Date(e.event_time_utc).getTime() > Date.now()
    )

    return (
        <div className="min-h-screen bg-transparent p-6 sm:p-8 lg:p-10 pb-24 font-sans">
            <header className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
                            Economic Calendar
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-muted-foreground">Global macroeconomic events — live data</p>
                            {source === "live" ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                    <Wifi className="w-3 h-3" /> Live
                                </span>
                            ) : source === "offline_fallback" ? (
                                <span className="flex items-center gap-1 text-xs text-orange-400 font-medium">
                                    <WifiOff className="w-3 h-3" /> Offline / Demo data
                                </span>
                            ) : null}
                            {lastFetched && (
                                <span className="text-xs text-slate-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {formatDistanceToNowStrict(lastFetched)} ago
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* High impact only toggle */}
                        <button
                            onClick={() => setHighOnly(!highOnly)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${highOnly ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-black/40 border-white/10 text-slate-400 hover:text-white"}`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                            High Impact Only
                        </button>

                        <select
                            value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}
                            className="px-4 py-2 bg-black/40 border border-white/10 rounded-full text-sm text-white focus:outline-none appearance-none cursor-pointer"
                        >
                            {CURRENCIES.map(c => <option key={c} value={c}>{c === "All" ? "All Currencies" : c}</option>)}
                        </select>

                        <select
                            value={filterImpact} onChange={e => setFilterImpact(e.target.value)}
                            className="px-4 py-2 bg-black/40 border border-white/10 rounded-full text-sm text-white focus:outline-none appearance-none cursor-pointer"
                        >
                            {IMPACTS.map(i => <option key={i} value={i}>{i === "All" ? "All Impacts" : `${i} Impact`}</option>)}
                        </select>

                        <button
                            onClick={() => load(true)}
                            disabled={refreshing}
                            className="p-2 bg-black/40 border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* High impact alert banner */}
                <AnimatePresence>
                    {highImpactSoon.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 text-red-300"
                        >
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                            <div className="text-sm font-medium">
                                ⚠ High Impact Alert:{" "}
                                <span className="text-red-200 font-bold">
                                    {highImpactSoon.map(e => `${e.currency} ${e.event_name}`).join(" · ")}
                                </span>
                                {" "}in under 30 min — manage your risk accordingly.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden">
                {loading ? (
                    <div className="p-12">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-4 mb-5 animate-pulse">
                                <div className="h-10 w-20 bg-white/5 rounded-lg" />
                                <div className="h-10 w-12 bg-white/5 rounded-lg" />
                                <div className="h-10 w-24 bg-white/5 rounded-lg" />
                                <div className="h-10 flex-1 bg-white/5 rounded-lg" />
                                <div className="h-10 w-16 bg-white/5 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-[11px] text-slate-500 uppercase tracking-widest bg-white/[0.03] border-b border-white/5">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Time (Local)</th>
                                    <th className="px-5 py-4 font-semibold">Currency</th>
                                    <th className="px-5 py-4 font-semibold">Impact</th>
                                    <th className="px-5 py-4 font-semibold">Event</th>
                                    <th className="px-5 py-4 font-semibold">Actual</th>
                                    <th className="px-5 py-4 font-semibold">Forecast</th>
                                    <th className="px-5 py-4 font-semibold">Previous</th>
                                    <th className="px-5 py-4 font-semibold">Countdown</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((ev, i) => (
                                    <EventRow key={ev.id} ev={ev} index={i} />
                                ))}
                            </tbody>
                        </table>

                        {filtered.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="text-4xl mb-3">📅</div>
                                <div className="text-slate-400 font-medium">No events match your filters</div>
                                <button
                                    onClick={() => { setFilterImpact("All"); setFilterCurrency("All"); setHighOnly(false) }}
                                    className="mt-3 text-blue-400 text-sm hover:text-blue-300 transition-colors"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {error && (
                <p className="mt-4 text-xs text-slate-600 text-center">
                    ⚡ Using demo data — backend at localhost:3001 unreachable ({error})
                </p>
            )}
        </div>
    )
}
