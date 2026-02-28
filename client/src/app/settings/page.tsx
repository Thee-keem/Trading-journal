"use client"

import React from "react"
import { User, Shield, CreditCard, Bell } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-transparent p-6 sm:p-8 lg:p-10 font-sans pb-24">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-purple-200">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1">Manage accounts and preferences</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                <div className="md:col-span-1 space-y-2">
                    {["Account Profile", "Trading Accounts", "Notifications", "Billing"].map((tab, i) => (
                        <button
                            key={i}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="md:col-span-3">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
                        <div className="mb-6 pb-6 border-b border-white/10 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                                NT
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Nova Trader</h2>
                                <p className="text-sm text-slate-400">Pro Plan</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-2">Email Address</label>
                                    <input type="email" defaultValue="hello@novatrade.app" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-2">Display Name</label>
                                    <input type="text" defaultValue="Nova Trader" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-2">Default Currency</label>
                                <select className="w-full md:w-1/2 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                                    <option>USD ($)</option>
                                    <option>EUR (€)</option>
                                    <option>GBP (£)</option>
                                </select>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button onClick={() => alert("Settings saved")} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
