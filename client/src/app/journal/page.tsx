"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, MoreHorizontal, FileText } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PnlCalendar } from "@/components/journal/pnl-calendar"

const MOCK_TRADES = [
    { id: "T-1004", date: "2026-02-27", pair: "XAUUSD", direction: "Long", rr: "1:3", pnl: "+1,200", pnlValue: 1200, status: "Win", tag: "Session Open" },
    { id: "T-1003", date: "2026-02-26", pair: "EURUSD", direction: "Short", rr: "1:2", pnl: "+800", pnlValue: 800, status: "Win", tag: "News" },
    { id: "T-1002", date: "2026-02-26", pair: "GBPUSD", direction: "Long", rr: "1:1.5", pnl: "-500", pnlValue: -500, status: "Loss", tag: "Revenge" },
    { id: "T-1001", date: "2026-02-25", pair: "US30", direction: "Short", rr: "1:4", pnl: "+3,200", pnlValue: 3200, status: "Win", tag: "A+ Setup" },
    { id: "T-1000", date: "2026-02-24", pair: "BTCUSD", direction: "Long", rr: "1:2", pnl: "+1,500", pnlValue: 1500, status: "Win", tag: "Swing" },
]

export default function JournalPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const filteredTrades = MOCK_TRADES.filter(t => {
        const matchesSearch = t.pair.toLowerCase().includes(searchTerm.toLowerCase()) || t.tag.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDate = selectedDate ? t.date === selectedDate : true
        return matchesSearch && matchesDate
    })

    return (
        <div className="min-h-screen bg-transparent p-6 sm:p-8 lg:p-10 font-sans pb-24">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
                        Trade Journal
                    </h1>
                    <p className="text-muted-foreground mt-1">Review and log your executions</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search pair, tag..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-blue-500/50 min-w-[200px]"
                        />
                    </div>
                    <button onClick={() => alert("Filter modal coming soon")} className="p-2 bg-black/40 border border-white/10 rounded-full text-slate-300 hover:text-white transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button onClick={() => alert("Log trade modal coming soon")} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-medium transition-colors whitespace-nowrap">
                        + Log Trade
                    </button>
                </div>
            </header>

            <PnlCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            <Card className="bg-black/60 border-white/10 backdrop-blur-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 font-medium tracking-wider">Date & ID</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Pair</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Direction</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Tags</th>
                                <th className="px-6 py-4 font-medium tracking-wider">R:R</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Result</th>
                                <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTrades.map((trade, i) => (
                                <motion.tr
                                    key={trade.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="text-white font-medium">{trade.date}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{trade.id}</div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-white/90">{trade.pair}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${trade.direction === 'Long' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                            {trade.direction}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300">
                                            {trade.tag}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-mono">{trade.rr}</td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 font-mono font-medium ${trade.status === 'Win' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {trade.status === 'Win' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                            {trade.pnl}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTrades.length === 0 && (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                            <span>No trades found for {selectedDate ? `date ${selectedDate}` : 'your search'}.</span>
                            {selectedDate && (
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                >
                                    Clear date filter
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
