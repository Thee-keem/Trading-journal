"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, addMonths, subMonths, addYears, subYears, isToday } from "date-fns"

// Static mock data tuned to current dates for demo
const generateCalendarData = () => {
    const data: Record<string, { pnl: number; trades: number }> = {}
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)

    for (let i = 0; i < 180; i++) {
        const d = new Date(startDate)
        d.setDate(d.getDate() + i)
        const noTrade = Math.random() > 0.55
        if (!noTrade) {
            const pnl = Math.round((Math.random() * 2500 - 900))
            data[format(d, "yyyy-MM-dd")] = {
                pnl,
                trades: Math.floor(Math.random() * 6) + 1,
            }
        }
    }
    // Pin mock trades
    data["2026-02-27"] = { pnl: 1200, trades: 1 }
    data["2026-02-26"] = { pnl: 300, trades: 2 }
    data["2026-02-25"] = { pnl: 3200, trades: 1 }
    data["2026-02-24"] = { pnl: 1500, trades: 1 }
    return data
}

const CAL_DATA = generateCalendarData()

// Monthly aggregate stats
const getMonthStats = (month: Date, data: Record<string, { pnl: number; trades: number }>) => {
    const prefix = format(month, "yyyy-MM")
    const entries = Object.entries(data).filter(([k]) => k.startsWith(prefix))
    const totalPnl = entries.reduce((s, [, v]) => s + v.pnl, 0)
    const totalTrades = entries.reduce((s, [, v]) => s + v.trades, 0)
    const wins = entries.filter(([, v]) => v.pnl > 0).length
    return { totalPnl, totalTrades, wins, tradingDays: entries.length }
}

export function PnlCalendar({
    selectedDate,
    onSelectDate,
}: {
    selectedDate: string | null
    onSelectDate: (date: string | null) => void
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date("2026-02-01"))

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const dateFormat = "yyyy-MM-dd"
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const stats = getMonthStats(currentMonth, CAL_DATA)

    return (
        <div className="mb-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-white/5 gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight">Trade Calendar</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Click a day to filter trades below</p>
                </div>

                {/* Month stats mini bar */}
                <div className="hidden lg:flex items-center gap-6 text-sm">
                    <div className="text-center">
                        <div className={`font-bold text-lg ${stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly PnL</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <div className="font-bold text-lg text-white">{stats.totalTrades}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Trades</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                        <div className="font-bold text-lg text-white">{stats.tradingDays > 0 ? Math.round((stats.wins / stats.tradingDays) * 100) : 0}%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Win Days</div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
                        <button onClick={() => setCurrentMonth(subYears(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><ChevronsLeft className="w-4 h-4" /></button>
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    </div>

                    <span className="font-semibold text-white min-w-[140px] text-center">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>

                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        <button onClick={() => setCurrentMonth(addYears(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><ChevronsRight className="w-4 h-4" /></button>
                    </div>

                    <button
                        onClick={() => {
                            setCurrentMonth(new Date())
                            onSelectDate(format(new Date(), dateFormat))
                        }}
                        className="px-3 py-1.5 text-xs font-medium border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="p-4 overflow-x-auto">
                <div className="min-w-[660px]">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                        {weekDays.map((d) => (
                            <div key={d} className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1.5">
                        {days.map((day) => {
                            const dayStr = format(day, dateFormat)
                            const data = CAL_DATA[dayStr]
                            const isSelected = selectedDate === dayStr
                            const isCurrentMonth = isSameMonth(day, monthStart)
                            const today = isToday(day)

                            // Themed styling — matching deep navy palette
                            let cellBg = "bg-white/[0.03] border-white/5"
                            let pnlColor = ""
                            let subColor = ""

                            if (data && isCurrentMonth) {
                                if (data.pnl > 1000) {
                                    cellBg = "bg-emerald-950/60 border-emerald-600/30"
                                    pnlColor = "text-emerald-300"
                                    subColor = "text-emerald-500"
                                } else if (data.pnl > 0) {
                                    cellBg = "bg-emerald-950/30 border-emerald-700/20"
                                    pnlColor = "text-emerald-400"
                                    subColor = "text-emerald-600"
                                } else if (data.pnl < -500) {
                                    cellBg = "bg-red-950/60 border-red-600/30"
                                    pnlColor = "text-red-300"
                                    subColor = "text-red-500"
                                } else if (data.pnl < 0) {
                                    cellBg = "bg-red-950/30 border-red-700/20"
                                    pnlColor = "text-red-400"
                                    subColor = "text-red-600"
                                }
                            }

                            const opacity = !isCurrentMonth ? "opacity-30" : ""

                            return (
                                <motion.button
                                    key={dayStr}
                                    whileHover={isCurrentMonth ? { scale: 1.03, zIndex: 10 } : {}}
                                    whileTap={isCurrentMonth ? { scale: 0.97 } : {}}
                                    onClick={() => isCurrentMonth && onSelectDate(isSelected ? null : dayStr)}
                                    className={`relative flex flex-col items-start justify-start p-2 h-[90px] rounded-xl border transition-all overflow-hidden ${cellBg} ${opacity} ${isSelected ? "ring-2 ring-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.3)]" : ""} ${!isCurrentMonth ? "cursor-default" : "cursor-pointer"}`}
                                >
                                    {/* Day number */}
                                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md mb-1 ${today ? "bg-blue-500 text-white" : isCurrentMonth ? "text-slate-400" : "text-slate-600"}`}>
                                        {format(day, "d")}
                                    </span>

                                    {/* PnL & trades */}
                                    {data && isCurrentMonth && (
                                        <div className="flex flex-col items-start w-full px-1">
                                            <span className={`text-base font-bold leading-tight tracking-tight ${pnlColor}`}>
                                                {data.pnl >= 0 ? "+" : ""}${Math.abs(data.pnl) >= 1000 ? (Math.abs(data.pnl) / 1000).toFixed(1) + "k" : Math.abs(data.pnl).toLocaleString()}
                                            </span>
                                            <span className={`text-[10px] font-medium mt-0.5 ${subColor}`}>
                                                {data.trades} {data.trades === 1 ? "trade" : "trades"}
                                            </span>
                                        </div>
                                    )}
                                </motion.button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-6 pb-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-950/60 border border-emerald-600/30" /> Profit</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-950/60 border border-red-600/30" /> Loss</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-white/[0.03] border border-white/5" /> No trades</div>
                {selectedDate && (
                    <button
                        onClick={() => onSelectDate(null)}
                        className="ml-auto text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        ✕ Clear selection ({selectedDate})
                    </button>
                )}
            </div>
        </div>
    )
}
