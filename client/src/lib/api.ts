// Centralised API client for the Fastify backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function fetchEconomicCalendar(from?: string, to?: string) {
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    const res = await fetch(`${API_BASE}/api/economic-calendar?${params}`, {
        next: { revalidate: 300 }, // cache 5 min in Next.js
    })
    if (!res.ok) throw new Error(`Calendar API error ${res.status}`)
    return res.json() as Promise<{
        events: EconomicEvent[]
        source: string
        fetched_at: string
        error?: string
    }>
}

export async function fetchTrades(opts?: { account_id?: string; date?: string; limit?: number }) {
    const params = new URLSearchParams()
    if (opts?.account_id) params.set("account_id", opts.account_id)
    if (opts?.date) params.set("date", opts.date)
    if (opts?.limit) params.set("limit", String(opts.limit))
    const res = await fetch(`${API_BASE}/api/trades?${params}`)
    if (!res.ok) throw new Error(`Trades API error ${res.status}`)
    return res.json() as Promise<{ trades: Trade[] }>
}

export async function fetchAccounts() {
    const res = await fetch(`${API_BASE}/api/accounts`)
    if (!res.ok) throw new Error(`Accounts API error ${res.status}`)
    return res.json() as Promise<{ accounts: TradingAccount[] }>
}

export async function fetchAnalyticsSummary(account_id?: string) {
    const params = new URLSearchParams()
    if (account_id) params.set("account_id", account_id)
    const res = await fetch(`${API_BASE}/api/analytics/summary?${params}`)
    if (!res.ok) throw new Error(`Analytics API error ${res.status}`)
    return res.json() as Promise<AnalyticsSummary>
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface EconomicEvent {
    id: string
    event_name: string
    currency: string
    impact: "High" | "Medium" | "Low"
    event_time_utc: string
    forecast: string | null
    previous: string | null
    actual: string | null
    country: string
}

export interface Trade {
    id: string
    pair: string
    direction: string
    rr: number | null
    pnl: number | null
    result: string | null
    created_at: string
    session: string
}

export interface TradingAccount {
    id: string
    broker_name: string
    account_name: string
    account_type: string
    starting_balance: number
    currency: string
    created_at: string
}

export interface AnalyticsSummary {
    total_trades: number
    wins: number
    losses: number
    net_pnl: number
    win_rate: number
}
