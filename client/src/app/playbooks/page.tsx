"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, AlertCircle, CheckCircle2, ShieldX, Plus, ListChecks } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"

const PLAYBOOKS = [
    {
        id: 1,
        name: "London Breakout",
        winRate: "72%",
        stats: "45 Trades",
        conditions: ["Asian Range < 30 pips", "Price holding above 50 EMA"],
        confirmations: ["15m Candle close above Asian High", "Volume spike > 2x average"],
        invalidations: ["High Impact News within 30m"],
    },
    {
        id: 2,
        name: "New York Reversal",
        winRate: "64%",
        stats: "28 Trades",
        conditions: ["London extended > 1.5 ADR", "Imbalance formed into HTF POI"],
        confirmations: ["Market Structure Shift on 5m", "FVG created on displacement"],
        invalidations: ["Trend is too strong on 1H", "No significant liquidity swept"],
    }
]

export default function PlaybooksPage() {
    const [isNewPlaybookModalOpen, setIsNewPlaybookModalOpen] = useState(false)

    return (
        <div className="min-h-screen bg-transparent p-6 sm:p-8 lg:p-10 font-sans pb-24">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
                        Strategy Playbooks
                    </h1>
                    <p className="text-muted-foreground mt-1">Define and track your specific setups</p>
                </div>
                <button onClick={() => setIsNewPlaybookModalOpen(true)} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-medium transition-colors">
                    + New Playbook
                </button>
            </header>

            <Modal
                isOpen={isNewPlaybookModalOpen}
                onClose={() => setIsNewPlaybookModalOpen(false)}
                title="Define New Trading Playbook"
            >
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsNewPlaybookModalOpen(false); alert("Playbook created! (Mock)"); }}>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 tracking-wider">PLAYBOOK NAME</label>
                        <input type="text" placeholder="e.g. London Session Range Breakout" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50" required />
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-400 tracking-wider flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-400" /> SETUP CONDITIONS (HTF CONTEXT)
                            </label>
                            <textarea rows={2} placeholder="Price must be in a 4H FVG, Asian range < 20 pips..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none font-sans"></textarea>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-400 tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ENTRY CONFIRMATIONS (LTF TRIGGER)
                            </label>
                            <textarea rows={2} placeholder="Market Structure Shift on 1m, displacement through level..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none font-sans"></textarea>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-400 tracking-wider flex items-center gap-2">
                                <ShieldX className="w-3.5 h-3.5 text-red-400" /> INVALIDATIONS (WHY TO SKIP)
                            </label>
                            <textarea rows={2} placeholder="High impact news within 1 hour, price swept liquidity too early..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none font-sans"></textarea>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 tracking-wider">RISK MODEL</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 appearance-none">
                                <option className="bg-slate-900">Fixed 1% Risk</option>
                                <option className="bg-slate-900">Reduced 0.5% Risk</option>
                                <option className="bg-slate-900">Aggressive 2% Risk</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 tracking-wider">EST. PROFIT FACTOR</label>
                            <input type="number" step="0.1" defaultValue="2.0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                        Save Playbook Configuration
                    </button>
                </form>
            </Modal>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {PLAYBOOKS.map((pb, i) => (
                    <motion.div
                        key={pb.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="h-full border-white/10 bg-black/40 backdrop-blur-xl group hover:border-purple-500/30 transition-colors">
                            <CardHeader className="border-b border-white/5 pb-4">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl text-white flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-purple-400" />
                                        {pb.name}
                                    </CardTitle>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-bold text-xl">{pb.winRate}</div>
                                        <div className="text-xs text-slate-500">{pb.stats}</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                                        <AlertCircle className="w-4 h-4 text-blue-400" />
                                        Conditions
                                    </h4>
                                    <ul className="space-y-2">
                                        {pb.conditions.map((item, j) => (
                                            <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        Confirmations
                                    </h4>
                                    <ul className="space-y-2">
                                        {pb.confirmations.map((item, j) => (
                                            <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                                        <ShieldX className="w-4 h-4 text-red-400" />
                                        Invalidations
                                    </h4>
                                    <ul className="space-y-2">
                                        {pb.invalidations.map((item, j) => (
                                            <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
