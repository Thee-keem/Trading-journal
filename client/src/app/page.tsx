"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Trophy, Target, Clock, ShieldCheck, Briefcase, BarChart3, Percent, TrendingDown, CircleDollarSign, History as HistoryIcon, LogOut, User as UserIcon, Zap, AlertTriangle, Lightbulb } from "lucide-react"
import { fetchTrades, fetchAccounts, fetchAnalyticsSummary, fetchEquityCurve, fetchInsights, Trade, TradingAccount, AnalyticsSummary, EquitySnapshot, BehavioralInsight } from "@/lib/api"

const WorldMapSession = dynamic(() => import("@/components/dashboard/world-map").then(m => m.WorldMapSession), {
  ssr: false,
  loading: () => <div className="h-[340px] w-full flex items-center justify-center bg-black/20 rounded-2xl animate-pulse text-muted-foreground text-sm">Loading Map...</div>
})
const EventsWidget = dynamic(() => import("@/components/dashboard/events-widget").then(m => m.EventsWidget), { ssr: false })
const TradingChecklist = dynamic(() => import("@/components/dashboard/trading-checklist").then(m => m.TradingChecklist), { ssr: false })
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
function PortfolioView({ onSelectAccount, summary, accounts }: { onSelectAccount: (id: string) => void, summary: AnalyticsSummary | null, accounts: TradingAccount[] }) {
  const totalEquity = accounts.reduce((sum, acc) => sum + acc.starting_balance, 0) + (summary?.net_pnl || 0)
  const totalPnl = summary?.net_pnl || 0
  const winRate = summary?.win_rate || 0

  return (
    <div className="space-y-6">
      {/* Top summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Portfolio Value", value: `$${totalEquity.toLocaleString()}`, sub: `Across ${accounts.length} accounts`, icon: CircleDollarSign, color: "text-blue-400", border: "border-blue-500/20 bg-blue-500/5" },
          { label: "Combined Net PnL", value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, sub: "All-time performance", icon: TrendingUp, color: totalPnl >= 0 ? "text-emerald-400" : "text-red-400", border: "border-emerald-500/20 bg-emerald-500/5" },
          { label: "Profit Factor", value: summary?.profit_factor.toFixed(2) || "0.00", sub: `Target: > 1.50`, icon: Zap, color: "text-amber-400", border: "border-amber-500/20 bg-amber-500/5" },
          { label: "Avg Win Rate", value: `${winRate.toFixed(1)}%`, sub: `Across ${summary?.total_trades || 0} total trades`, icon: Percent, color: "text-purple-400", border: "border-purple-500/20 bg-purple-500/5" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-2xl border p-5 ${s.border} backdrop-blur-xl group cursor-default`}>
            <div className="flex items-center gap-2 mb-3">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Per-account breakdown (Real Accounts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acc, i) => {
          return (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => onSelectAccount(acc.id)}
              className="group cursor-pointer"
            >
              <Card className="bg-black/40 border-white/10 backdrop-blur-xl p-5 hover:border-blue-500/40 transition-all hover:bg-white/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                    <span className="text-sm font-semibold text-white group-hover:text-blue-300">{acc.account_name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-400`}>{acc.account_type}</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Starting", value: `$${acc.starting_balance.toLocaleString()}` },
                    { label: "Currency", value: acc.currency },
                    { label: "Broker", value: acc.broker_name },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{row.label}</span>
                      <span className={`text-xs font-mono font-semibold text-slate-200`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">View Account Dashboard</span>
                  <ArrowUpRight className="w-3 h-3 text-blue-400" />
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
function SingleAccountView({ id, accounts }: { id: string, accounts: TradingAccount[] }) {
  const account = accounts.find(a => a.id === id)
  if (!account) return <div className="text-slate-500">Account not found</div>

  const stats = [
    { title: "Net Equity", value: `$${account.starting_balance.toLocaleString()}`, sub: "Starting Balance", icon: Activity, color: "text-blue-500" },
    { title: "Current Balance", value: `$${(account.starting_balance).toLocaleString()}`, sub: "Real-time tracking", icon: TrendingUp, color: "text-emerald-500" },
    { title: "Win Rate", value: "0%", sub: "0 total trades", icon: Trophy, color: "text-amber-500" },
    { title: "Profit Factor", value: "0.00", sub: "Equity Efficiency", icon: Zap, color: "text-purple-500" },
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Account Type", value: account.account_type, color: "text-blue-400" },
          { label: "Currency", value: account.currency, color: "text-slate-200" },
          { label: "Broker", value: account.broker_name, color: "text-slate-200" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-black/40 border border-white/8 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">{s.label}</div>
            <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [equityHistory, setEquityHistory] = useState<EquitySnapshot[]>([])
  const [insights, setInsights] = useState<BehavioralInsight[]>([])
  const [user, setUser] = useState<any>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>("portfolio")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("nova_token")
    const userData = localStorage.getItem("nova_user")

    if (!token) {
      router.push("/login")
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    const loadData = async (accId?: string) => {
      try {
        setLoading(true)
        const effectiveAccId = accId === "portfolio" ? undefined : accId
        const [acctsRes, tradesRes, summaryRes, equityRes, insightsRes] = await Promise.all([
          fetchAccounts(),
          fetchTrades({ limit: 5, account_id: effectiveAccId }),
          fetchAnalyticsSummary(effectiveAccId),
          fetchEquityCurve(effectiveAccId),
          fetchInsights(effectiveAccId)
        ])
        setAccounts(acctsRes.accounts)
        setTrades(tradesRes.trades)
        setSummary(summaryRes)
        setEquityHistory(equityRes.history)
        setInsights(insightsRes.insights)
      } catch (err) {
        console.error("Dashboard data fetch failed:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData(selectedAccount)
  }, [router, selectedAccount])

  const handleLogout = () => {
    localStorage.removeItem("nova_token")
    localStorage.removeItem("nova_user")
    router.push("/login")
  }

  if (!mounted) return null

  const isPortfolio = selectedAccount === "portfolio"
  const chartData = equityHistory.length > 0 ? equityHistory : []

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

          {!isPortfolio && (
            <button
              onClick={() => setSelectedAccount("portfolio")}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold text-white transition-all backdrop-blur-xl shadow-lg"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              Back to Portfolio
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2 ml-2">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Active Trader</span>
                <span className="text-xs text-white font-semibold leading-none">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all backdrop-blur-xl group shadow-lg"
                title="Logout"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
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
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/10" />)}
            </div>
          ) : isPortfolio
            ? <PortfolioView onSelectAccount={setSelectedAccount} summary={summary} accounts={accounts} />
            : <SingleAccountView id={selectedAccount} accounts={accounts} />
          }
        </motion.div>
      </AnimatePresence>

      {/* Persistent Grid: Chart/Map/Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {/* Equity chart (shown for single accounts & portfolio) */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="xl:col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
          <Card className="h-full flex flex-col relative bg-black/60 border-white/10 backdrop-blur-3xl min-h-[360px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Equity Growth Curve
              </CardTitle>
              <span className="text-xs text-slate-500 font-medium font-mono bg-white/5 px-2 py-1 rounded-md">{ACCOUNTS.find(a => a.id === selectedAccount)?.label}</span>
            </CardHeader>
            <CardContent className="flex-1 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                  <XAxis
                    dataKey="date"
                    stroke="#475569"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={["auto", "auto"]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v / 1000}k`} />
                  <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2.5} fill="url(#eqGrad)" animationDuration={1000} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* World Map - Always Visible */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full border-blue-500/20 bg-blue-950/10 min-h-[360px] relative overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-400 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4" /> Global Markets
                </CardTitle>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="h-[280px] p-0 flex items-center justify-center">
              <WorldMapSession />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Middle Grid: Tasks + AI + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <TradingChecklist />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full border-purple-500/20 bg-purple-950/10">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2 text-base">
                <Target className="w-4 h-4" /> Edge Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.length === 0 && <p className="text-xs text-slate-500 italic p-4 text-center">No insights available yet. Log more trades to see patterns.</p>}
              {insights.map((ins, i) => (
                <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors cursor-default">
                  <p className={`text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${ins.type === "SUCCESS" ? "text-emerald-400" : ins.type === "WARNING" ? "text-amber-500" : "text-blue-400"
                    }`}>
                    {ins.type === "SUCCESS" ? <Trophy className="w-3.5 h-3.5" /> : ins.type === "WARNING" ? <AlertTriangle className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                    {ins.title || "Insight"}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{ins.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <EventsWidget />
      </div>

      {/* Bottom Row: Recent Trades */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center border-b border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-slate-400" />
              Recent Executions
            </CardTitle>
            <button
              onClick={() => router.push("/journal")}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase tracking-wider flex items-center gap-1 group"
            >
              Journal <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[10px] text-muted-foreground uppercase bg-white/5">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-widest">Symbol</th>
                    <th className="px-6 py-4 font-bold tracking-widest">Direction</th>
                    <th className="px-6 py-4 font-bold tracking-widest hidden sm:table-cell">R:R</th>
                    <th className="px-6 py-4 font-bold tracking-widest">PnL Result</th>
                    <th className="px-6 py-4 font-bold tracking-widest hidden md:table-cell">Account</th>
                    <th className="px-6 py-4 font-bold tracking-widest text-right">Edge</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 && !loading && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No trades logged yet. Go to Journal to log your first trade!</td></tr>
                  )}
                  {trades.map((trade, i) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.07 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => router.push("/journal")}
                    >
                      <td className="px-6 py-4 font-bold text-white text-sm">{trade.pair}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trade.direction === "Long" || trade.direction === "LONG" ? "bg-blue-500/20 text-blue-400 border border-blue-500/10" : "bg-red-500/20 text-red-400 border border-red-500/10"}`}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs hidden sm:table-cell px-6">{trade.rr ?? "1:2"}</td>
                      <td className={`px-6 py-4 font-mono font-bold text-sm ${trade.result === "Win" ? "text-emerald-400" : "text-red-400"}`}>
                        {trade.pnl && trade.pnl > 0 ? `+$${trade.pnl.toLocaleString()}` : `$${(trade.pnl ?? 0).toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/10 px-2 py-1 rounded shadow-sm">
                          {accounts.find(a => a.id === trade.account_id)?.account_name.toUpperCase() || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end pr-2">
                          {trade.result === "Win"
                            ? <ArrowUpRight className="w-5 h-5 text-emerald-500/50" />
                            : <ArrowDownRight className="w-5 h-5 text-red-500/50" />
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
  )
}
