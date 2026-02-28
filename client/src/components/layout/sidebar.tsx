"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutDashboard, Target, LineChart, BookOpen, History,
    Settings, ChevronLeft, ChevronRight, TrendingUp, Calendar as CalendarIcon, Menu, X
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Trading Plan", href: "/plan", icon: Target },
    { name: "Analytics", href: "/analytics", icon: LineChart },
    { name: "Journal", href: "/journal", icon: History },
    { name: "Playbooks", href: "/playbooks", icon: BookOpen },
    { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    { name: "Settings", href: "/settings", icon: Settings },
]

// ── Desktop sidebar ────────────────────────────────────────────────────────
export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <motion.div
            initial={false}
            animate={{ width: collapsed ? 72 : 244 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="relative z-20 hidden md:flex flex-col h-screen bg-black/50 border-r border-white/8 backdrop-blur-xl shrink-0"
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/5 shrink-0">
                {!collapsed ? (
                    <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg shrink-0">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span>Nova<span className="text-blue-400">Trade</span></span>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-5 px-2 flex flex-col gap-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden",
                                isActive ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-desktop"
                                    className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <item.icon className={cn("w-5 h-5 shrink-0 z-10 transition-colors", isActive ? "text-blue-400" : "group-hover:text-blue-400")} />
                            {!collapsed && <span className="ml-3 text-sm z-10 whitespace-nowrap">{item.name}</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-white/5 shrink-0">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
                </button>
            </div>
        </motion.div>
    )
}

// ── Mobile top navbar ──────────────────────────────────────────────────────
export function MobileNav() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const current = navigation.find(n => n.href === pathname)

    return (
        <>
            {/* Top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-black/70 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    Nova<span className="text-blue-400">Trade</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">{current?.name ?? "Dashboard"}</span>
                    <button
                        onClick={() => setOpen(!open)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Drawer overlay */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 250 }}
                            className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#0a0f1e] border-l border-white/10 shadow-2xl flex flex-col"
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-5 h-14 border-b border-white/5">
                                <div className="flex items-center gap-2 font-bold text-white">
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded-lg">
                                        <TrendingUp className="w-4 h-4 text-white" />
                                    </div>
                                    Nova<span className="text-blue-400">Trade</span>
                                </div>
                                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Nav items */}
                            <nav className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-1">
                                {navigation.map((item, i) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <motion.div
                                            key={item.name}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => setOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                                                    isActive
                                                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-400" : "")} />
                                                {item.name}
                                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                            </Link>
                                        </motion.div>
                                    )
                                })}
                            </nav>

                            {/* Footer */}
                            <div className="px-4 pb-6 pt-3 border-t border-white/5">
                                <Link
                                    href="/login"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <Settings className="w-5 h-5" /> Account Settings
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom tab bar (alternative compact mobile nav) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 h-16 bg-black/80 backdrop-blur-xl border-t border-white/10">
                {navigation.slice(0, 5).map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-[10px] font-medium",
                                isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "")} />
                            {item.name.split(" ")[0]}
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
