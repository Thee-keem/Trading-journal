"use client"

import React, { useState } from "react"
import { User, Shield, CreditCard, Bell, Plus, Wallet, Briefcase, Key, ShieldCheck, Save, CheckCircle2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("Account Profile")
    const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

    const tabs = [
        { name: "Account Profile", icon: User },
        { name: "Trading Accounts", icon: Wallet },
        { name: "Notifications", icon: Bell },
        { name: "Security", icon: Shield },
        { name: "Billing", icon: CreditCard },
    ]

    const handleSave = () => {
        setSaveStatus("saving")
        setTimeout(() => {
            setSaveStatus("saved")
            setTimeout(() => setSaveStatus("idle"), 2000)
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-transparent p-6 sm:p-8 lg:p-10 font-sans pb-24">
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage accounts and preferences</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left text-sm font-semibold transition-all border ${activeTab === tab.name
                                ? "bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent"
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.name ? 'text-blue-400' : ''}`} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl min-h-[600px] shadow-2xl">
                        {activeTab === "Account Profile" && (
                            <div className="space-y-8">
                                <div className="pb-8 border-b border-white/10 flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                                        NT
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Nova Trader</h2>
                                        <p className="text-sm text-blue-400 font-medium">Institutional Tier • Active</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">Email Address</label>
                                            <input type="email" defaultValue="hello@novatrade.app" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">Display Name</label>
                                            <input type="text" defaultValue="Nova Trader" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">Timezone</label>
                                        <select className="w-full md:w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 appearance-none bg-no-repeat bg-[right_1rem_center]">
                                            <option className="bg-slate-900">UTC (Universal Time)</option>
                                            <option className="bg-slate-900">EST (Eastern Standard Time)</option>
                                            <option className="bg-slate-900">BST (London Time)</option>
                                        </select>
                                    </div>

                                    <div className="pt-8 flex justify-end">
                                        <button
                                            onClick={handleSave}
                                            disabled={saveStatus !== "idle"}
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {saveStatus === "idle" && <><Save className="w-4 h-4" /> Save Preferences</>}
                                            {saveStatus === "saving" && <span className="animate-pulse">Updating...</span>}
                                            {saveStatus === "saved" && <><CheckCircle2 className="w-4 h-4" /> Updated Successfully</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Trading Accounts" && (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">Linked Trading Accounts</h3>
                                    <button
                                        onClick={() => setIsAddAccountModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-full text-sm font-bold transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> Link New Account
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { name: "IC Markets Live", type: "Raw Spreads", balance: "$24,560", active: true },
                                        { name: "FTMO Challenge", type: "Prop Firm", balance: "$100,000", active: true },
                                        { name: "Oanda Demo", type: "Paper Trading", balance: "$50,000", active: false },
                                    ].map((acc, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${acc.active ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                                                    <Briefcase className={`w-5 h-5 ${acc.active ? 'text-emerald-500' : 'text-slate-500'}`} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold">{acc.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{acc.type}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-mono font-bold">{acc.balance}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-tighter ${acc.active ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                    {acc.active ? 'Connected' : 'Disconnected'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "Notifications" && (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                <div className="p-4 bg-yellow-500/10 rounded-full mb-6">
                                    <Bell className="w-10 h-10 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Notification Preferences</h3>
                                <p className="text-slate-400 max-w-sm">Configuring push, email, and telegram alerts for your trade execution.</p>
                                <button className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold border border-white/10 transition-all">
                                    Connect Telegram Bot
                                </button>
                            </div>
                        )}

                        {(activeTab === "Security" || activeTab === "Billing") && (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-50">
                                <Clock className="w-12 h-12 text-slate-500 mb-4" />
                                <h3 className="text-xl font-bold text-white">System Update Required</h3>
                                <p className="text-slate-400">This module is currently undergoing security hardening.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Account Modal */}
            <Modal
                isOpen={isAddAccountModalOpen}
                onClose={() => setIsAddAccountModalOpen(false)}
                title="Link New Trading Account"
            >
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsAddAccountModalOpen(false); alert("Account linked! (Mock)"); }}>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">BROKER NAME</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 appearance-none bg-no-repeat bg-[right_1rem_center] cursor-pointer">
                            <option className="bg-slate-900">IC Markets</option>
                            <option className="bg-slate-900">FTMO</option>
                            <option className="bg-slate-900">Oanda</option>
                            <option className="bg-slate-900">Pepperstone</option>
                            <option className="bg-slate-900">Other (MT4/MT5 Bridge)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">ACCOUNT TYPE</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 appearance-none">
                                <option className="bg-slate-900">Live Account</option>
                                <option className="bg-slate-900">Demo Account</option>
                                <option className="bg-slate-900">Prop Evaluation</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">CURRENCY</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 appearance-none">
                                <option className="bg-slate-900">USD</option>
                                <option className="bg-slate-900">EUR</option>
                                <option className="bg-slate-900">GBP</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">ACCOUNT LOGIN / ID</label>
                        <input type="text" placeholder="MT4/MT5 Account Number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 font-mono" required />
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-200/80 leading-relaxed">
                            We use read-only API keys where possible. Your trading password is never stored on our servers.
                        </p>
                    </div>

                    <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] uppercase tracking-tighter">
                        Authorize Connection
                    </button>
                </form>
            </Modal>
        </div>
    )
}

function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
