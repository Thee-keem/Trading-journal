const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function getAuthHeader(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("nova_token")
    return token ? { "Authorization": `Bearer ${token}` } : {}
}

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
    const res = await fetch(`${API_BASE}/api/trades?${params}`, {
        headers: { ...getAuthHeader() }
    })
    if (!res.ok) throw new Error(`Trades API error ${res.status}`)
    return res.json() as Promise<{ trades: Trade[] }>
}

export async function saveTrade(tradeData: Partial<Trade>) {
    const res = await fetch(`${API_BASE}/api/trades`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader()
        },
        body: JSON.stringify(tradeData)
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error || `Failed to save trade: ${res.status}`)
    }
    return res.json() as Promise<{ trade: Trade }>
}

export async function fetchAccounts() {
    const res = await fetch(`${API_BASE}/api/accounts`, {
        headers: { ...getAuthHeader() }
    })
    if (!res.ok) throw new Error(`Accounts API error ${res.status}`)
    return res.json() as Promise<{ accounts: TradingAccount[] }>
}

export async function fetchAnalyticsSummary(account_id?: string) {
    const params = new URLSearchParams()
    if (account_id) params.set("account_id", account_id)
    const res = await fetch(`${API_BASE}/api/analytics/summary?${params}`, {
        headers: { ...getAuthHeader() }
    })
    if (!res.ok) throw new Error(`Analytics API error ${res.status}`)
    return res.json() as Promise<AnalyticsSummary>
}

export async function fetchEquityCurve(account_id?: string) {
    const params = new URLSearchParams()
    if (account_id) params.set("account_id", account_id)
    const res = await fetch(`${API_BASE}/api/analytics/equity?${params}`, {
        headers: { ...getAuthHeader() }
    })
    if (!res.ok) throw new Error(`Equity API error ${res.status}`)
    return res.json() as Promise<{ history: EquitySnapshot[] }>
}

export async function fetchInsights(account_id?: string) {
    const params = new URLSearchParams()
    if (account_id) params.set("account_id", account_id)
    const res = await fetch(`${API_BASE}/api/analytics/insights?${params}`, {
        headers: { ...getAuthHeader() }
    })
    if (!res.ok) throw new Error(`Insights API error ${res.status}`)
    return res.json() as Promise<{ insights: BehavioralInsight[] }>
}

export async function fetchAiCoachInsights(accountId?: string): Promise<{ insights: AiCoachInsight[] }> {
    const url = accountId && accountId !== "portfolio" ? `${API_BASE}/api/ai/coach?account_id=${accountId}` : `${API_BASE}/api/ai/coach`
    const res = await fetch(url, { headers: getAuthHeader() })
    if (!res.ok) throw new Error("Failed to fetch AI insights")
    return res.json()
}

export async function fetchMonteCarloResults(accountId?: string): Promise<{ simulation_results: MonteCarloData[] }> {
    const url = accountId && accountId !== "portfolio" ? `${API_BASE}/api/analytics/monte-carlo?account_id=${accountId}` : `${API_BASE}/api/analytics/monte-carlo`
    const res = await fetch(url, { headers: getAuthHeader() })
    if (!res.ok) throw new Error("Failed to fetch Monte Carlo results")
    return res.json()
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
    user_id: string
    account_id: string
    pair: string
    session: string
    direction: string
    entry: number
    exit?: number | null
    stop_loss?: number | null
    take_profit?: number | null
    lot_size: number
    contract_size?: number | null
    exchange_rate?: number | null
    fees?: number | null
    commission?: number | null
    swap?: number | null
    risk_percent?: number | null
    rr: number | null
    pnl: number | null
    result_percent?: number | null
    is_win?: boolean | null
    result: string | null
    confirmations?: string[] | null
    emotion?: string | null
    screenshot_url?: string | null
    notes?: string | null
    plan_violation?: boolean
    after_loss?: boolean
    created_at: string
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
    profit_factor: number
    avg_win: number
    avg_loss: number
}

export interface EquitySnapshot {
    date: string
    pnl: number | null
    equity: number
}

export interface BehavioralInsight {
    type: "SUCCESS" | "WARNING" | "INFO"
    title?: string
    message: string
}

export interface AiCoachInsight {
    category: string
    content: string
}

export interface MonteCarloData {
    index: number
    p5: number
    p50: number
    p95: number
}
