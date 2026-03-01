"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, MoreHorizontal, FileText, LayoutGrid, Table as TableIcon, Calendar, Image as ImageIcon, Tags, History as HistoryIcon, DollarSign, Percent, AlertCircle, Briefcase, Target, CheckCircle2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PnlCalendar } from "@/components/journal/pnl-calendar"
import { Modal } from "@/components/ui/modal"
import { fetchTrades, fetchAccounts, saveTrade } from "@/lib/api"

const MOCK_TRADES = [
    {
        id: "T-1004",
        date: "2026-02-27",
        pair: "XAUUSD",
        direction: "Long",
        rr: "1:3",
        pnl: "+1,200",
        pnlValue: 1200,
        pnlPercent: "3.22%",
        status: "Win",
        tag: "Session Open",
        screenshot: "https://images.unsplash.com/photo-1611974714658-71d4a1ad3bd2?auto=format&fit=crop&q=80&w=800",
        account: "TFF",
        session: "NY",
        entry: 2024.50,
        exit: 2045.20,
        confirmations: ["FVG", "Order Block", "MSS"]
    },
    {
        id: "T-1003",
        date: "2026-02-26",
        pair: "EURUSD",
        direction: "Short",
        rr: "1:2",
        pnl: "+800",
        pnlValue: 800,
        pnlPercent: "2.10%",
        status: "Win",
        tag: "News",
        screenshot: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800",
        account: "Bybit",
        session: "London",
        entry: 1.0850,
        exit: 1.0810,
        confirmations: ["News", "HTF S/R"]
    },
    {
        id: "T-1002",
        date: "2026-02-26",
        pair: "GBPUSD",
        direction: "Long",
        rr: "1:1.5",
        pnl: "-500",
        pnlValue: -500,
        pnlPercent: "-1.25%",
        status: "Loss",
        tag: "Revenge",
        screenshot: "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?auto=format&fit=crop&q=80&w=800",
        account: "Personal",
        session: "Tokyo",
        entry: 1.2650,
        exit: 1.2620,
        confirmations: ["None"]
    },
]

export default function JournalPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [viewMode, setViewMode] = useState<"Table" | "Gallery" | "Calendar">("Table")
    const [trades, setTrades] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [selectedAccountId, setSelectedAccountId] = useState<string>("all")
    const [successMsg, setSuccessMsg] = useState("")
    const [errorMsg, setErrorMsg] = useState("")

    useEffect(() => {
        const token = localStorage.getItem("nova_token")
        if (!token) {
            router.push("/login")
            return
        }
        setUser(JSON.parse(localStorage.getItem("nova_user") || "{}"))
        fetchAccountsData()
    }, [router])

    useEffect(() => {
        fetchTradesData(selectedAccountId === "all" ? undefined : selectedAccountId)
    }, [selectedAccountId])

    const fetchAccountsData = async () => {
        try {
            const data = await fetchAccounts()
            setAccounts(data.accounts || [])
        } catch (err) {
            console.error("Failed to fetch accounts:", err)
        }
    }

    const fetchTradesData = async (accId?: string) => {
        try {
            setLoading(true)
            const data = await fetchTrades({ account_id: accId })
            setTrades(data.trades || [])
        } catch (err) {
            console.error("Failed to fetch trades:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveTrade = async (e: React.FormEvent) => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)

        const entry = parseFloat(formData.get("entry") as string)
        const exit = parseFloat(formData.get("exit") as string)
        const lotSize = parseFloat(formData.get("lotSize") as string)
        const direction = formData.get("direction") as string

        // Simple PnL calculation
        let pnl = 0
        if (exit && entry) {
            const diff = direction === "LONG" ? exit - entry : entry - exit
            // Assuming standard forex lot sizing for XAUUSD/Forex roughly
            pnl = diff * lotSize * 100000
        }

        const payload = {
            account_id: formData.get("account") as string,
            pair: formData.get("pair") as string,
            session: formData.get("session") as any,
            direction: direction as any,
            entry,
            exit: exit || null,
            stop_loss: parseFloat(formData.get("sl") as string) || null,
            take_profit: parseFloat(formData.get("tp") as string) || null,
            lot_size: lotSize,
            risk_percent: parseFloat(formData.get("risk") as string) || null,
            fees: parseFloat(formData.get("fees") as string) || null,
            confirmations: (formData.get("confirmations") as string).split(",").map(c => c.trim()).filter(Boolean),
            emotion: formData.get("emotion"),
            screenshot_url: formData.get("screenshot") as string || "",
            notes: formData.get("notes") as string,
            pnl,
            result: pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "Break Even",
            is_win: pnl > 0,
        }

        try {
            setErrorMsg("")
            await saveTrade(payload)
            setSuccessMsg("Trade logged successfully!")
            setIsLogModalOpen(false)
            fetchTradesData()
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (err: any) {
            console.error("Save failed:", err)
            setErrorMsg(err.message || "Failed to log trade")
        }
    }

    const filteredTrades = trades.filter(t => {
        const matchesSearch = (t.pair || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDate = selectedDate ? t.created_at?.split("T")[0] === selectedDate : true
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

                <AnimatePresence>
                    {successMsg && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" /> {successMsg}
                        </motion.div>
                    )}
                    {errorMsg && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" /> {errorMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="px-4 py-2 bg-black/40 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none min-w-[140px] text-center font-semibold"
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                        ))}
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search pair..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-blue-500/50 min-w-[180px]"
                        />
                    </div>

                    <button onClick={() => setIsLogModalOpen(true)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap">
                        + Log Trade
                    </button>
                </div>
            </header>

            {/* Log Trade Modal */}
            <Modal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                title="Log New execution"
                className="max-w-3xl"
            >
                <form className="space-y-6" onSubmit={handleSaveTrade}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Column 1: Core Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> Account</label>
                                <select name="account" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none" required>
                                    <option value="" className="bg-slate-900">Select Account</option>
                                    {accounts.map((acc: any) => (
                                        <option key={acc.id} value={acc.id} className="bg-slate-900">
                                            {acc.account_name} - {acc.starting_balance?.toLocaleString() || "0"}
                                        </option>
                                    ))}
                                    {accounts.length === 0 && (
                                        <option value="demo-account-1" className="bg-slate-900">Default Account (Demo)</option>
                                    )}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Target className="w-3 h-3" /> Pair / Symbol</label>
                                <input name="pair" type="text" placeholder="e.g. XAUUSD" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><HistoryIcon className="w-3 h-3" /> Session</label>
                                    <select name="session" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500/50 appearance-none">
                                        <option className="bg-slate-900">New York</option>
                                        <option className="bg-slate-900">London</option>
                                        <option className="bg-slate-900">Tokyo</option>
                                        <option className="bg-slate-900">Sydney</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">Direction</label>
                                    <select name="direction" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500/50 appearance-none font-bold">
                                        <option className="bg-slate-900 text-blue-400">LONG</option>
                                        <option className="bg-slate-900 text-red-400">SHORT</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Entry/Exit & Size */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry Price</label>
                                    <input name="entry" type="number" step="any" placeholder="0.0000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exit Price</label>
                                    <input name="exit" type="number" step="any" placeholder="0.0000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stop Loss</label>
                                    <input name="sl" type="number" step="any" placeholder="0.0000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Take Profit</label>
                                    <input name="tp" type="number" step="any" placeholder="0.0000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lot Size</label>
                                    <input name="lotSize" type="number" step="0.01" defaultValue="1.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Percent className="w-3 h-3" /> Risk %</label>
                                    <input name="risk" type="number" step="0.1" placeholder="1.0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Advanced & Meta */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Fees / Swap</label>
                                <input name="fees" type="number" step="0.01" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Tags className="w-3 h-3" /> Confirmations</label>
                                <input name="confirmations" type="text" placeholder="FVG, OB, MSS..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Emotion</label>
                                <select name="emotion" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none">
                                    <option className="bg-slate-900">Neutral 😐</option>
                                    <option className="bg-slate-900">Greedy 🤑</option>
                                    <option className="bg-slate-900">Anxious 😰</option>
                                    <option className="bg-slate-900">Confident 😎</option>
                                    <option className="bg-slate-900">Frustrated 😤</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Chart Screenshot URL</label>
                        <input name="screenshot" type="text" placeholder="https://tradingview.com/x/..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trade Notes & Psychology</label>
                        <textarea name="notes" rows={3} placeholder="Describe your set-up logic, how you felt during the trade..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none"></textarea>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button type="button" onClick={() => setIsLogModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10">
                            Cancel
                        </button>
                        <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                            Confirm Execution
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Toggle Sub-nav */}
            <div className="flex items-center justify-between mb-6 bg-black/40 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl max-w-fit">
                {[
                    { id: "Table", icon: TableIcon },
                    { id: "Gallery", icon: LayoutGrid },
                    { id: "Calendar", icon: Calendar },
                ].map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setViewMode(v.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === v.id
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <v.icon className="w-4 h-4" />
                        {v.id}
                    </button>
                ))}
            </div>

            {viewMode === "Calendar" && (
                <PnlCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            )}

            {viewMode === "Table" && (
                <Card className="bg-black/60 border-white/10 backdrop-blur-3xl overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-medium tracking-wider">Date & ID</th>
                                        <th className="px-6 py-4 font-medium tracking-wider">Pair</th>
                                        <th className="px-6 py-4 font-medium tracking-wider text-center">Direction</th>
                                        <th className="px-6 py-4 font-medium tracking-wider">Session</th>
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
                                                <div className="text-white font-medium">{new Date(trade.created_at).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{trade.id.split("-")[0]}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white/90">{trade.pair}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Account: {trade.account_id?.split("-")[0]}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${trade.direction === 'Long' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                                    {trade.direction}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 font-medium">{trade.session}</td>
                                            <td className="px-6 py-4 text-slate-400 font-mono">{trade.rr || "1:2"}</td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 font-mono font-medium ${trade.result === 'Win' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {trade.result === 'Win' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                    ${trade.pnl?.toLocaleString() || "0"}
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
                    )}
                </Card>
            )}

            {viewMode === "Gallery" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTrades.map((trade, i) => (
                        <motion.div
                            key={trade.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="bg-black/40 border-white/5 backdrop-blur-3xl overflow-hidden group cursor-pointer hover:border-blue-500/30 transition-all shadow-2xl">
                                <div className="aspect-video relative overflow-hidden bg-slate-900 border-b border-white/5">
                                    {trade.screenshot_url ? (
                                        <img src={trade.screenshot_url} alt={trade.pair} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-slate-900 to-black">
                                            <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">No Screenshot</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`px-2 py-0.5 rounded-md backdrop-blur-md border text-[10px] font-bold uppercase tracking-wider ${trade.result === 'Win'
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                            }`}>
                                            {trade.result || trade.status}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 right-3">
                                        <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/70">
                                            {trade.pnlPercent || "1:2.5 RR"}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                                <HistoryIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold leading-none tracking-tight">{trade.pair}</h4>
                                                <p className="text-[10px] text-slate-500 mt-1.5 font-bold uppercase tracking-widest leading-none">
                                                    {new Date(trade.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-base font-bold tabular-nums ${trade.result === 'Win' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl || 0).toLocaleString()}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Net PnL</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border border-white/5 ${trade.direction === 'Long' || trade.direction === "LONG"
                                                ? 'bg-blue-500/10 text-blue-400'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {trade.direction?.toUpperCase()}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            {accounts.find(a => a.id === trade.account_id)?.account_name || "Account"}
                                        </span>
                                        {trade.confirmations?.slice(0, 2).map((conf: string) => (
                                            <span key={conf} className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-semibold text-purple-300">
                                                {conf}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {filteredTrades.length === 0 && (
                        <div className="col-span-full p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                            <span>No trades found for {selectedDate ? `date ${selectedDate}` : 'your search'}.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
