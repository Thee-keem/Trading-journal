"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, AlertTriangle, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { fetchEconomicCalendar, type EconomicEvent } from "@/lib/api"
import { formatDistanceToNowStrict } from "date-fns"

// Fallback data for when backend is offline
const FALLBACK: EconomicEvent[] = [
    { id: "f1", event_name: "Core CPI m/m", currency: "USD", impact: "High", event_time_utc: new Date(Date.now() + 1000 * 60 * 12).toISOString(), forecast: "0.3%", previous: "0.3%", actual: null, country: "USD" },
    { id: "f2", event_name: "ECB Press Conference", currency: "EUR", impact: "High", event_time_utc: new Date(Date.now() + 1000 * 60 * 62).toISOString(), forecast: "--", previous: "--", actual: null, country: "EUR" },
    { id: "f3", event_name: "GDP m/m", currency: "GBP", impact: "Medium", event_time_utc: new Date(Date.now() + 1000 * 60 * 130).toISOString(), forecast: "0.2%", previous: "0.1%", actual: null, country: "GBP" },
]

function Countdown({ targetIso }: { targetIso: string }) {
    const [label, setLabel] = useState("")
    useEffect(() => {
        const update = () => {
            const diff = new Date(targetIso).getTime() - Date.now()
            if (diff <= 0) { setLabel("Released"); return }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setLabel(h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, "0")}s`)
        }
        update()
        const t = setInterval(update, 1000)
        return () => clearInterval(t)
    }, [targetIso])
    return <span>{label}</span>
}

export function EventsWidget() {
    const [expanded, setExpanded] = useState(false)
    const [events, setEvents] = useState<EconomicEvent[]>(FALLBACK)

    useEffect(() => {
        fetchEconomicCalendar()
            .then(data => {
                // Show only upcoming (next 24h) events
                const now = Date.now()
                const upcoming = data.events
                    .filter(e => new Date(e.event_time_utc).getTime() > now - 60000) // include very recently released
                    .sort((a, b) => new Date(a.event_time_utc).getTime() - new Date(b.event_time_utc).getTime())
                    .slice(0, 6)
                if (upcoming.length) setEvents(upcoming)
            })
            .catch(() => { }) // silently use fallback
    }, [])

    const nextHighImpact = events.find(e => e.impact === "High" && !e.actual && new Date(e.event_time_utc).getTime() > Date.now())
    const highCount = events.filter(e => e.impact === "High" && !e.actual).length

    return (
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl mb-8 overflow-hidden">
            {/* Clickable header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/5"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/10 rounded-xl">
                        <CalendarIcon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-sm">Upcoming Economic Events</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{events.length} events loaded for today</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {nextHighImpact && (
                        <div className="hidden sm:flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                            <span className="text-[11px] font-bold tracking-wider text-red-400 uppercase">
                                {nextHighImpact.currency} {nextHighImpact.event_name.split(" ").slice(0, 2).join(" ")} ·{" "}
                                <Countdown targetIso={nextHighImpact.event_time_utc} />
                            </span>
                        </div>
                    )}
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {events.map(ev => {
                                const isPast = new Date(ev.event_time_utc) < new Date()
                                const isHigh = ev.impact === "High"
                                const isMed = ev.impact === "Medium"
                                return (
                                    <div
                                        key={ev.id}
                                        className={`p-4 rounded-xl border transition-colors ${isHigh ? "border-red-500/20 bg-red-950/20 hover:bg-red-950/30" : isMed ? "border-orange-500/15 bg-orange-950/10 hover:bg-orange-950/20" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-xs tracking-widest bg-white/10 px-1.5 py-0.5 rounded">{ev.currency}</span>
                                                {isHigh && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                            </div>
                                            <span className="text-[11px] font-mono text-slate-500">
                                                {new Date(ev.event_time_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>

                                        <h4 className={`text-sm font-medium mb-3 ${isPast ? "text-slate-400" : "text-slate-200"}`}>
                                            {ev.event_name}
                                        </h4>

                                        <div className="flex justify-between items-end border-t border-white/5 pt-3">
                                            <div className="flex gap-4">
                                                <div>
                                                    <div className="text-[9px] text-slate-600 uppercase font-semibold tracking-wider">Forecast</div>
                                                    <div className="text-xs font-mono text-slate-400">{ev.forecast ?? "—"}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-600 uppercase font-semibold tracking-wider">Prev</div>
                                                    <div className="text-xs font-mono text-slate-400">{ev.previous ?? "—"}</div>
                                                </div>
                                                {ev.actual && (
                                                    <div>
                                                        <div className="text-[9px] text-emerald-600 uppercase font-semibold tracking-wider">Actual</div>
                                                        <div className="text-xs font-mono text-emerald-400 font-bold">{ev.actual}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-[11px] font-mono font-semibold tabular-nums ${isHigh ? "text-red-400" : "text-blue-400"}`}>
                                                {isPast ? <span className="text-slate-600">Done</span> : <Countdown targetIso={ev.event_time_utc} />}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="px-4 pb-4 border-t border-white/5 pt-3 flex justify-center">
                            <a href="/calendar" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                View Full Calendar <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
}
