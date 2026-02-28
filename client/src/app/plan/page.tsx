"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, CalendarClock, Globe2, BrainCircuit, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Save } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TradingPlanModule() {
    const [activeTab, setActiveTab] = useState("risk")
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
    const [complianceScore, setComplianceScore] = useState(85)

    const sections = [
        { id: "risk", title: "Risk Rules", icon: ShieldAlert, color: "text-red-400" },
        { id: "daily", title: "Daily Limit Rules", icon: CalendarClock, color: "text-blue-400" },
        { id: "session", title: "Session Rules", icon: Globe2, color: "text-emerald-400" },
        { id: "psychology", title: "Psychology & Discipline", icon: BrainCircuit, color: "text-purple-400" },
    ]

    const handleSave = () => {
        setSaveStatus("saving")
        setTimeout(() => {
            setSaveStatus("saved")
            setTimeout(() => setSaveStatus("idle"), 2000)
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-transparent p-6 sm:p-8 lg:p-10 font-sans text-foreground pb-24">
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
                        Structured Trading Plan
                    </h1>
                    <p className="text-muted-foreground mt-1">Rule-based compliance and restriction framework</p>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Animated Compliance Meter */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/10 rounded-full backdrop-blur-xl shrink-0">
                        <div className="text-sm font-medium text-slate-300">Compliance</div>
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${complianceScore}%` }}
                                className={`h-full ${complianceScore > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                            />
                        </div>
                        <div className="text-white font-bold text-sm">{complianceScore}%</div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saveStatus !== "idle"}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all focus:ring-2 focus:ring-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saveStatus === "idle" && <><Save className="w-4 h-4" /> Save Plan</>}
                        {saveStatus === "saving" && <span className="animate-pulse">Saving...</span>}
                        {saveStatus === "saved" && <><CheckCircle2 className="w-4 h-4" /> Saved</>}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Nav */}
                <div className="lg:col-span-1 space-y-2">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveTab(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all ${activeTab === section.id
                                ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                                }`}
                        >
                            <section.icon className={`w-5 h-5 ${activeTab === section.id ? section.color : ""}`} />
                            <span className="font-semibold">{section.title}</span>
                        </button>
                    ))}

                    <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div className="flex gap-2 items-start text-sm">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                            <div className="text-yellow-200/80">
                                <p className="font-medium text-yellow-400 mb-1">Plan Lock Active</p>
                                Any changes to risk parameters will invoke a 24-hour cooldown period.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === "risk" && <RiskRulesSection />}
                            {activeTab === "daily" && <DailyRulesSection />}
                            {activeTab === "session" && <SessionRulesSection />}
                            {activeTab === "psychology" && <PsychologyRulesSection />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

function InputField({ label, placeholder, suffix, type = "text", defaultValue }: any) {
    return (
        <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-semibold text-slate-300">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono placeholder-slate-600"
                />
                {suffix && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{suffix}</span>
                )}
            </div>
        </div>
    )
}

function RiskRulesSection() {
    return (
        <Card className="min-h-[500px]">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    Risk Management Parameters
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Max Risk Per Trade" defaultValue="1.0" suffix="%" />
                    <InputField label="Max Daily Loss" defaultValue="-3.0" suffix="%" />
                    <InputField label="Max Weekly Loss" defaultValue="-6.0" suffix="%" />
                    <InputField label="Minimum Required R:R" defaultValue="1:2" />
                </div>

                <div className="pt-6 border-t border-white/10">
                    <h4 className="text-white font-medium mb-4">Hard Stop Conditions</h4>
                    <div className="space-y-4">
                        {[
                            "Account drawdown exceeds maximum allowed",
                            "3 consecutive losses reached",
                            "Emotional interference detected"
                        ].map((rule, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="w-5 h-5 shrink-0 rounded-full border-2 border-slate-500 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 bg-slate-500 rounded-full"></div>
                                </div>
                                <span className="text-slate-300 text-sm">{rule}</span>
                            </div>
                        ))}
                        <button onClick={() => alert("Add condition modal coming soon")} className="text-sm text-blue-400 font-medium hover:text-blue-300 py-2">+ Add hard stop condition</button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function DailyRulesSection() {
    return (
        <Card className="min-h-[500px]">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <CalendarClock className="w-6 h-6 text-blue-500" />
                    </div>
                    Daily Execution Rules
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Max Trades Per Day" type="number" defaultValue="4" />
                    <InputField label="Consecutive Loss Limit" type="number" defaultValue="2" />
                </div>

                <div>
                    <label className="text-sm font-semibold text-slate-300 block mb-3">News Filter</label>
                    <select className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none appearance-none">
                        <option>Stop trading 30m before/after High Impact News</option>
                        <option>Must close open trades before High Impact News</option>
                        <option>No news restrictions</option>
                    </select>
                </div>

                <div className="pt-6 border-t border-white/10">
                    <h4 className="text-white font-medium mb-4 flex items-center justify-between">
                        Pre-Trade Checklist
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Required before entry</span>
                    </h4>
                    <div className="space-y-3">
                        {[
                            "Context is fully aligned with HTF bias",
                            "Clear entry criteria met (MSS + FVG)",
                            "Risk is completely accepted",
                            "I feel physically and mentally well"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-white/5 transition-colors group">
                                <div className="w-5 h-5 rounded border border-slate-600 bg-black/50 group-hover:border-blue-500 transition-colors"></div>
                                <span className="text-slate-300 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SessionRulesSection() {
    return (
        <Card className="min-h-[500px]">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Globe2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    Session & Timing Rules
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
                <div className="space-y-4">
                    <h4 className="text-slate-300 font-semibold mb-2">Allowed Trading Windows</h4>
                    {[
                        { session: "London", times: "08:00 - 12:00 UTC", active: true },
                        { session: "New York AM", times: "13:30 - 16:00 UTC", active: true },
                        { session: "New York PM", times: "18:00 - 20:00 UTC", active: false },
                        { session: "Tokyo/Sydney", times: "00:00 - 06:00 UTC", active: false },
                    ].map((s, i) => (
                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${s.active ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-black/40'}`}>
                            <div>
                                <div className={`font-semibold ${s.active ? 'text-emerald-400' : 'text-slate-400'}`}>{s.session}</div>
                                <div className="text-xs text-slate-500 font-mono mt-1">{s.times}</div>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${s.active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${s.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t border-white/10">
                    <InputField label="Session Specific Note" placeholder="e.g. Do not trade London open on Mondays" />
                </div>
            </CardContent>
        </Card>
    )
}

function PsychologyRulesSection() {
    return (
        <Card className="min-h-[500px]">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <BrainCircuit className="w-6 h-6 text-purple-500" />
                    </div>
                    Psychology & Discipline
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 mt-4">

                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-5">
                    <h4 className="text-purple-300 font-semibold mb-2">Post-Loss Cooldown Protocol</h4>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                        Mandatory break required after taking a full 1R loss to prevent revenge trading and emotional spiral.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => alert("Cooldown set to 15m")} className="flex-1 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-sm font-medium text-white hover:bg-purple-500/20 transition-colors">15 Minutes</button>
                        <button onClick={() => alert("Cooldown set to 30m")} className="flex-1 py-2 bg-purple-600 border border-purple-500 rounded-lg text-sm font-medium text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">30 Minutes</button>
                        <button onClick={() => alert("Cooldown set to 1h")} className="flex-1 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-sm font-medium text-white hover:bg-purple-500/20 transition-colors">1 Hour</button>
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-medium mb-4 block">Revenge Trading Restrictions</h4>
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 cursor-pointer">
                            <input type="checkbox" defaultChecked className="mt-1 bg-black border-slate-600 rounded" />
                            <div>
                                <div className="text-sm font-semibold text-slate-200">Enforce Daily Limit Lock</div>
                                <div className="text-xs text-slate-500 mt-0.5">App will refuse to track entries after max daily loss is reached.</div>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 cursor-pointer">
                            <input type="checkbox" defaultChecked className="mt-1 bg-black border-slate-600 rounded" />
                            <div>
                                <div className="text-sm font-semibold text-slate-200">Force Journal Entry</div>
                                <div className="text-xs text-slate-500 mt-0.5">Must write a 50-word journal entry after a loss before taking the next trade.</div>
                            </div>
                        </label>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
