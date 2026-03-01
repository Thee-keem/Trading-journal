"use client"

import React, { useState } from "react"
import { CheckCircle2, Circle, ListTodo, Zap, ShieldAlert, Sparkles } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { motion } from "framer-motion"

const DEFAULT_ITEMS = [
    { id: 1, text: "Check Economic Calendar for High Impact News", category: "Market" },
    { id: 2, text: "Identify HTF Trend and Key S/R Zones", category: "Analysis" },
    { id: 3, text: "Confirm Session Bias (London/NY Open)", category: "Session" },
    { id: 4, text: "Check Risk-to-Reward Ratio (Min 1:2)", category: "Risk" },
    { id: 5, text: "Ensure Mindset is Neutral and Focused", category: "Psychology" },
    { id: 6, text: "Verify Position Size vs Daily Loss Limit", category: "Risk" },
]

export function TradingChecklist() {
    const [items, setItems] = useState(DEFAULT_ITEMS.map(i => ({ ...i, completed: false })))

    const toggleItem = (id: number) => {
        setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i))
    }

    const completedCount = items.filter(i => i.completed).length
    const progress = (completedCount / items.length) * 100

    return (
        <Card className="h-full border-blue-500/20 bg-blue-950/5 backdrop-blur-3xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-blue-400 flex items-center gap-2 text-base">
                        <ListTodo className="w-4 h-4" /> Pre-Session Checklist
                    </CardTitle>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Ready for Execution?</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-white leading-none">{completedCount}/{items.length}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">TASKS</div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                    />
                </div>

                <div className="space-y-2">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => toggleItem(item.id)}
                            className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${item.completed
                                    ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                    : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <Circle className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
                                )}
                                <span className={`text-xs transition-colors ${item.completed ? "text-slate-400 line-through" : "text-slate-200"}`}>
                                    {item.text}
                                </span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded ${item.category === 'Risk' ? 'bg-red-500/10 text-red-400' :
                                    item.category === 'Analysis' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-white/5 text-slate-500'
                                }`}>
                                {item.category}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {progress === 100 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center gap-2 mt-4"
                    >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider italic">Strategic Edge Confirmed</span>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    )
}
