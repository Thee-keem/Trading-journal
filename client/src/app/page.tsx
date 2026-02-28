"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Trophy, Target, Clock, ShieldCheck, Briefcase, BarChart3, Percent, TrendingDown, CircleDollarSign } from "lucide-react"

const WorldMapSession = dynamic(() => import("@/components/dashboard/world-map").then(m => m.WorldMapSession), {
  ssr: false,
  loading: () => <div className="h-[340px] w-full flex items-center justify-center bg-black/20 rounded-2xl animate-pulse text-muted-foreground text-sm">Loading Map...</div>
})
const EventsWidget = dynamic(() => import("@/components/dashboard/events-widget").then(m => m.EventsWidget), { ssr: false })
const AreaChart = dynamic(() => import("recharts").then(r => r.AreaChart), { ssr: false })
const Area = dynamic(() => import("recharts").then(r => r.Area), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(r => r.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(r => r.YAxis), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(r => r.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then(r => r.ResponsiveContainer), { ssr: false })

// ── Mock data ────────────────────────────────────────────────────────────────
const equityData = [{ n: "Jan", e: 50000 }, { n: "Feb", e: 51200 }, { n: "Mar", e: 50800 }, { n: "Apr", e: 53500 }, { n: "May", e: 54100 }, { n: "Jun", e: 56900 }, { n: "Jul", e: 58200 }]
const liveEquity = [{ n: "Jan", e: 30000 }, { n: "Feb", e: 31500 }, { n: "Mar", e: 30200 }, { n: "Apr", e: 32800 }, { n: "May", e: 33400 }, { n: "Jun", e: 35100 }, { n: "Jul", e: 36600 }]
const fundedEquity = [{ n: "Jan", e: 100000 }, { n: "Feb", e: 101200 }, { n: "Mar", e: 100500 }, { n: "Apr", e: 102800 }, { n: "May", e: 103800 }, { n: "Jun", e: 104900 }, { n: "Jul", e: 106100 }]
const demoEquity = [{ n: "Jan", e: 10000 }, { n: "Feb", e: 9800 }, { n: "Mar", e: 10100 }, { n: "Apr", e: 10200 }, { n: "May", e: 10300 }, { n: "Jun", e: 10500 }, { n: "Jul", e: 10700 }]

const ACCOUNTS = [
  { id: "portfolio", label: "Portfolio View (All)", icon: Briefcase },
  { id: "live", label: "Live Account — 50k", icon: TrendingUp },
  { id: "funded", label: "Funded Phase 1 — 100k", icon: Trophy },
  { id: "demo", label: "Demo Practice — 10k", icon: Target },
]

const ACCOUNT_STATS: Record<string, { equity: string; pnl: string; pnlPct: string; winRate: string; discipline: string; equityData: { n: string; e: number }[]; trades: number; maxDD: string; profitFactor: string }> = {
  live: { equity: "$36,600", pnl: "+$6,600", pnlPct: "+22.0%", winRate: "71%", discipline: "94/100", equityData: liveEquity, trades: 47, maxDD: "4.2%", profitFactor: "2.1" },
  funded: { equity: "$106,100", pnl: "+$6,100", pnlPct: "+6.1%", winRate: "66%", discipline: "88/100", equityData: fundedEquity, trades: 31, maxDD: "2.8%", profitFactor: "1.8" },
  demo: { equity: "$10,700", pnl: "+$700", pnlPct: "+7.0%", winRate: "58%", discipline: "79/100", equityData: demoEquity, trades: 82, maxDD: "6.1%", profitFactor: "1.4" },
}

const RECENT_TRADES = [
  { id: "T-1004", pair: "XAUUSD", direction: "Long", rr: "1:3", pnl: "+$1,200", status: "Win", account: "Live" },
  { id: "T-1003", pair: "EURUSD", direction: "Short", rr: "1:2", pnl: "+$800", status: "Win", account: "Funded" },
  { id: "T-1002", pair: "GBPUSD", direction: "Long", rr: "1:1.5", pnl: "-$500", status: "Loss", account: "Live" },
  { id: "T-1001", pair: "US30", direction: "Short", rr: "1:4", pnl: "+$3,200", status: "Win", account: "Demo" },
  { id: "T-1000", pair: "BTCUSD", direction: "Long", rr: "1:2", pnl: "+$1,500", status: "Win", account: "Live" },
]

const tooltipStyle = {
  contentStyle: { backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" },
  itemStyle: { color: "#60a5fa" }
}

// Portfolio view — rich multi-account overview
function PortfolioView() {
  const totalEquity = 36600 + 106100 + 10700
  const totalPnl = 6600 + 6100 + 700
  return (
    <div className="space-y-6">
      {/* Top summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Portfolio Value", value: `$${totalEquity.toLocaleString()}`, sub: `+$${totalPnl.toLocaleString()} all-time`, icon: CircleDollarSign, color: "text-blue-400", border: "border-blue-500/20 bg-blue-500/5" },
          { label: "Combined Net PnL", value: `+$${totalPnl.toLocaleString()}`, sub: "+10.2% portfolio return", icon: TrendingUp, color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/5" },
          { label: "Avg Win Rate", value: "65%", sub: "Across 160 total trades", icon: Percent, color: "text-amber-400", border: "border-amber-500/20 bg-amber-500/5" },
          { label: "Overall Discipline", value: "87/100", sub: "4 plan violations this month", icon: ShieldCheck, color: "text-purple-400", border: "border-purple-500/20 bg-purple-500/5" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-2xl border p-5 ${s.border} backdrop-blur-xl`}>
            <div className="flex items-center gap-2 mb-3">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Per-account breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(ACCOUNT_STATS).map(([id, acc], i) => {
          const acct = ACCOUNTS.find(a => a.id === id)!
          return (
            <motion.div key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <Card className="bg-black/40 border-white/10 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <acct.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-white">{acct.label.split("—")[0].trim()}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${acc.pnl.startsWith("+") ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{acc.pnlPct}</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Equity", value: acc.equity },
                    { label: "PnL", value: acc.pnl, color: acc.pnl.startsWith("+") ? "text-emerald-400" : "text-red-400" },
                    { label: "Win Rate", value: acc.winRate },
                    { label: "Trades", value: String(acc.trades) },
                    { label: "Max DD", value: acc.maxDD, color: "text-red-400" },
                    { label: "Profit Factor", value: acc.profitFactor },
                    { label: "Discipline", value: acc.discipline },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{row.label}</span>
                      <span className={`text-xs font-mono font-semibold ${row.color ?? "text-slate-200"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                {/* Mini equity sparkline */}
                <div className="mt-4 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={acc.equityData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="e" stroke="#3b82f6" strokeWidth={1.5} fill={`url(#grad-${id})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Single account view
function SingleAccountView({ id }: { id: string }) {
  const acc = ACCOUNT_STATS[id]
  const acct = ACCOUNTS.find(a => a.id === id)!
  const stats = [
    { title: "Net Equity", value: acc.equity, sub: `${acc.pnlPct} all-time`, icon: Activity, color: "text-blue-500" },
    { title: "Net PnL", value: acc.pnl, sub: "This account total", icon: TrendingUp, color: "text-emerald-500" },
    { title: "Win Rate", value: acc.winRate, sub: `${acc.trades} total trades`, icon: Trophy, color: "text-amber-500" },
    { title: "Discipline Score", value: acc.discipline, sub: "4 violations this month", icon: ShieldCheck, color: "text-purple-500" },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="bg-card border-white/10 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white/90 tabular-nums">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* Additional single-account stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Max Drawdown", value: acc.maxDD, color: "text-red-400" },
          { label: "Profit Factor", value: acc.profitFactor, color: "text-blue-400" },
          { label: "Total Trades", value: String(acc.trades), color: "text-slate-200" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-black/40 border border-white/8 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">{s.label}</div>
            <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState("portfolio")
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const isPortfolio = selectedAccount === "portfolio"
  const chartData = isPortfolio ? equityData : (ACCOUNT_STATS[selectedAccount]?.equityData ?? equityData)

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 sm:p-6 lg:p-8 font-sans">

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Performance Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Professional Institutional Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Alert bell */}
          <button onClick={() => alert("Notifications coming soon")} className="relative w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors backdrop-blur-xl">
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse border-2 border-slate-900" />
            <Activity className="w-4 h-4" />
          </button>

          {/* Account selector */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-2 backdrop-blur-xl">
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="bg-transparent border-none text-white focus:ring-0 outline-none text-sm font-semibold cursor-pointer appearance-none"
            >
              {ACCOUNTS.map(a => (
                <option key={a.id} value={a.id} className="bg-slate-900">{a.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Stats section — switches between Portfolio and Single */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAccount}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          {isPortfolio
            ? <PortfolioView />
            : <SingleAccountView id={selectedAccount} />
          }
        </motion.div>
      </AnimatePresence>

      {/* Equity chart + map (shown for single accounts & portfolio) */}
      {!isPortfolio && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="xl:col-span-2 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
            <Card className="h-full flex flex-col relative bg-black/60 border-white/10 backdrop-blur-3xl min-h-[320px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Equity Growth</CardTitle>
                <span className="text-xs text-slate-500 font-medium font-mono">Live · {ACCOUNTS.find(a => a.id === selectedAccount)?.label}</span>
              </CardHeader>
              <CardContent className="flex-1 min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                    <XAxis dataKey="n" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v / 1000}k`} />
                    <Area type="monotone" dataKey="e" stroke="#3b82f6" strokeWidth={2.5} fill="url(#eqGrad)" animationDuration={1500} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full border-blue-500/20 bg-blue-950/10 min-h-[320px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-blue-400 flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" /> Live Session Map
                  </CardTitle>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="h-[240px] p-2 flex items-center justify-center">
                <WorldMapSession />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Economic events widget */}
      <EventsWidget />

      {/* AI Insights + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full border-purple-500/20 bg-purple-950/10">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2 text-base">
                <Target className="w-4 h-4" /> AI Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { color: "text-emerald-400", icon: Trophy, title: "Top Strength", text: "Your edge is strongest in the London-NY overlap session with 81% win rate on XAUUSD." },
                { color: "text-amber-500", icon: ShieldCheck, title: "Risk Warning", text: "Live account violated max daily loss rule 2× this month. Consider a 24h cool-down after -2%." },
                { color: "text-blue-400", icon: BarChart3, title: "Edge Insight", text: "Profit Factor drops 40% when you trade within 15 min before high-impact news events." },
              ].map((ins, i) => (
                <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors cursor-default">
                  <p className={`text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${ins.color}`}>
                    <ins.icon className="w-3.5 h-3.5" /> {ins.title}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{ins.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-base">Recent Executions</CardTitle>
              <button
                onClick={() => router.push("/journal")}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg font-medium tracking-wider">Pair</th>
                      <th className="px-4 py-3 font-medium tracking-wider">Dir</th>
                      <th className="px-4 py-3 font-medium tracking-wider hidden sm:table-cell">R:R</th>
                      <th className="px-4 py-3 font-medium tracking-wider">PnL</th>
                      <th className="px-4 py-3 font-medium tracking-wider hidden md:table-cell">Account</th>
                      <th className="px-4 py-3 rounded-tr-lg font-medium tracking-wider text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_TRADES.map((trade, i) => (
                      <motion.tr
                        key={trade.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.07 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => router.push("/journal")}
                      >
                        <td className="px-4 py-3.5 font-semibold text-white text-sm">{trade.pair}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${trade.direction === "Long" ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}>
                            {trade.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono text-xs hidden sm:table-cell">{trade.rr}</td>
                        <td className={`px-4 py-3.5 font-mono font-semibold text-sm ${trade.status === "Win" ? "text-emerald-400" : "text-red-400"}`}>{trade.pnl}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">{trade.account}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end">
                            {trade.status === "Win"
                              ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                              : <ArrowDownRight className="w-4 h-4 text-red-500" />
                            }
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
