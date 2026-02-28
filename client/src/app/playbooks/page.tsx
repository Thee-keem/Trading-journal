"use client"

import React from "react"
import { motion } from "framer-motion"
import { BookOpen, AlertCircle, CheckCircle2, ShieldX } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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
    return (
        <div className="min-h-screen bg-transparent p-6 sm:p-8 lg:p-10 font-sans pb-24">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
                        Strategy Playbooks
                    </h1>
                    <p className="text-muted-foreground mt-1">Define and track your specific setups</p>
                </div>
                <button onClick={() => alert("New playbook modal coming soon")} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-medium transition-colors">
                    + New Playbook
                </button>
            </header>

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
