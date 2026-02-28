// Shared mock performance data for Analytics — simulates a real trader's 200-trade history
import { subDays, format, addDays } from "date-fns"

export interface TradeRecord {
    date: string
    session: string
    setup: string
    direction: "Long" | "Short"
    pair: string
    rMultiple: number
    pnl: number
    riskPct: number
    holdingMins: number
    planViolation: boolean
    afterLoss: boolean
}

const sessions = ["London", "New York", "Tokyo", "Sydney", "London-NY Overlap"]
const setups = ["London Breakout", "NY Reversal", "Asian Range", "OB Retest", "FVG Fill"]
const pairs = ["XAUUSD", "EURUSD", "GBPUSD", "US30", "BTCUSD", "USDJPY"]

const seedRnd = (seed: number) => {
    let s = seed
    return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
    }
}

export const generateTrades = (count = 200): TradeRecord[] => {
    const rnd = seedRnd(42)
    const trades: TradeRecord[] = []
    let lastWasLoss = false

    for (let i = 0; i < count; i++) {
        const session = sessions[Math.floor(rnd() * sessions.length)]
        const setup = setups[Math.floor(rnd() * setups.length)]
        const isWin = rnd() > 0.38
        const planViolation = rnd() > 0.85
        const afterLoss = lastWasLoss && rnd() > 0.5
        const riskPct = planViolation ? 1.5 + rnd() * 2 : 0.5 + rnd() * 1
        const rMult = isWin ? 1 + rnd() * 3.5 : -(0.5 + rnd() * 1.5)
        const pnl = rMult * riskPct * 500

        trades.push({
            date: format(subDays(new Date(), count - i), "yyyy-MM-dd"),
            session,
            setup,
            direction: rnd() > 0.5 ? "Long" : "Short",
            pair: pairs[Math.floor(rnd() * pairs.length)],
            rMultiple: Math.round(rMult * 100) / 100,
            pnl: Math.round(pnl),
            riskPct: Math.round(riskPct * 10) / 10,
            holdingMins: Math.floor(20 + rnd() * 220),
            planViolation,
            afterLoss,
        })
        lastWasLoss = !isWin
    }
    return trades
}

// Aggregate calculations
export const calcMetrics = (trades: TradeRecord[]) => {
    const wins = trades.filter(t => t.rMultiple > 0)
    const losses = trades.filter(t => t.rMultiple <= 0)
    const total = trades.length
    const winRate = wins.length / total
    const avgWinR = wins.reduce((s, t) => s + t.rMultiple, 0) / (wins.length || 1)
    const avgLossR = Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0) / (losses.length || 1))
    const expectancy = winRate * avgWinR - (1 - winRate) * avgLossR
    const payoffRatio = avgWinR / (avgLossR || 1)
    const profitFactor = wins.reduce((s, t) => s + t.pnl, 0) / Math.abs(losses.reduce((s, t) => s + t.pnl, 0) || 1)
    const netPnl = trades.reduce((s, t) => s + t.pnl, 0)
    const avgRisk = trades.reduce((s, t) => s + t.riskPct, 0) / total
    const avgHolding = Math.round(trades.reduce((s, t) => s + t.holdingMins, 0) / total)
    const rMultiples = trades.map(t => t.rMultiple)
    const meanR = rMultiples.reduce((s, r) => s + r, 0) / total
    const stdR = Math.sqrt(rMultiples.reduce((s, r) => s + (r - meanR) ** 2, 0) / total)
    const sharpe = meanR / (stdR || 1)
    const downsideR = rMultiples.filter(r => r < 0)
    const stdDown = Math.sqrt(downsideR.reduce((s, r) => s + r ** 2, 0) / (downsideR.length || 1))
    const sortino = meanR / (stdDown || 1)
    const breakEvenWR = avgLossR / (avgWinR + avgLossR)

    // Equity curve
    let eq = 50000
    const equityCurve = trades.map((t, i) => {
        eq += t.pnl
        return { i, date: t.date, equity: eq, pnl: t.pnl }
    })

    // Max drawdown
    let peak = 50000, maxDD = 0
    equityCurve.forEach(p => {
        if (p.equity > peak) peak = p.equity
        const dd = (peak - p.equity) / peak
        if (dd > maxDD) maxDD = dd
    })

    // Drawdown series
    peak = 50000
    const ddCurve = equityCurve.map(p => {
        if (p.equity > peak) peak = p.equity
        return { i: p.i, date: p.date, dd: -((peak - p.equity) / peak) * 100 }
    })

    // Session edge
    const sessionEdge = sessions.map(sess => {
        const st = trades.filter(t => t.session === sess)
        const sw = st.filter(t => t.rMultiple > 0)
        return {
            session: sess,
            trades: st.length,
            winRate: st.length ? Math.round((sw.length / st.length) * 100) : 0,
            avgR: st.length ? Math.round((st.reduce((s, t) => s + t.rMultiple, 0) / st.length) * 100) / 100 : 0,
            expectancy: st.length ? Math.round(((sw.length / st.length) * (sw.reduce((s, t) => s + t.rMultiple, 0) / (sw.length || 1)) - ((st.length - sw.length) / st.length) * Math.abs(st.filter(t => t.rMultiple <= 0).reduce((s, t) => s + t.rMultiple, 0) / (st.filter(t => t.rMultiple <= 0).length || 1))) * 100) / 100 : 0,
            pnl: st.reduce((s, t) => s + t.pnl, 0),
        }
    })

    // Setup edge
    const setupEdge = setups.map(setup => {
        const st = trades.filter(t => t.setup === setup)
        const sw = st.filter(t => t.rMultiple > 0)
        const sl = st.filter(t => t.rMultiple <= 0)
        const pf = sw.reduce((s, t) => s + t.pnl, 0) / Math.abs(sl.reduce((s, t) => s + t.pnl, 0) || 1)
        return {
            setup,
            trades: st.length,
            winRate: st.length ? Math.round((sw.length / st.length) * 100) : 0,
            profitFactor: Math.round(pf * 100) / 100,
            stability: st.length >= 20 ? "Strong" : st.length >= 10 ? "Medium" : "Low",
        }
    })

    // Monte Carlo
    const monteCarloRuns = 200
    const simLength = 100
    const mcEquities: number[][] = []
    const startEq = 50000
    const allPnls = trades.map(t => t.pnl)

    for (let run = 0; run < monteCarloRuns; run++) {
        let eq = startEq
        const curve: number[] = [eq]
        for (let s = 0; s < simLength; s++) {
            const pick = allPnls[Math.floor(Math.random() * allPnls.length)]
            eq += pick
            curve.push(eq)
        }
        mcEquities.push(curve)
    }

    // Compute percentile bands at each step
    const mcBands = Array.from({ length: simLength + 1 }, (_, step) => {
        const vals = mcEquities.map(r => r[step]).sort((a, b) => a - b)
        return {
            step,
            p5: vals[Math.floor(vals.length * 0.05)],
            p25: vals[Math.floor(vals.length * 0.25)],
            median: vals[Math.floor(vals.length * 0.5)],
            p75: vals[Math.floor(vals.length * 0.75)],
            p95: vals[Math.floor(vals.length * 0.95)],
        }
    })

    // PnL distribution buckets
    const bucketSize = 250
    const min = Math.floor(Math.min(...trades.map(t => t.pnl)) / bucketSize) * bucketSize
    const max = Math.ceil(Math.max(...trades.map(t => t.pnl)) / bucketSize) * bucketSize
    const pnlBuckets: { range: string; count: number; isLoss: boolean }[] = []
    for (let v = min; v < max; v += bucketSize) {
        pnlBuckets.push({
            range: v >= 0 ? `+$${v}` : `$${v}`,
            count: trades.filter(t => t.pnl >= v && t.pnl < v + bucketSize).length,
            isLoss: v < 0,
        })
    }

    // Compliance stats
    const violating = trades.filter(t => t.planViolation)
    const cleanPnlPerTrade = trades.filter(t => !t.planViolation).reduce((s, t) => s + t.pnl, 0) / (trades.filter(t => !t.planViolation).length || 1)
    const violatingPnlPerTrade = violating.reduce((s, t) => s + t.pnl, 0) / (violating.length || 1)
    const complianceDrop = cleanPnlPerTrade > 0 ? Math.round((1 - violatingPnlPerTrade / cleanPnlPerTrade) * 100) : 0
    const complianceScore = Math.round((1 - violating.length / total) * 100)

    return {
        total, winRate: Math.round(winRate * 100), avgWinR, avgLossR, expectancy, payoffRatio,
        profitFactor, netPnl, avgRisk, avgHolding, sharpe, sortino, maxDD: Math.round(maxDD * 100),
        breakEvenWR: Math.round(breakEvenWR * 100), equityCurve, ddCurve, sessionEdge, setupEdge,
        mcBands, pnlBuckets, complianceScore, complianceDrop,
        rMultiples: trades.map(t => t.rMultiple),
    }
}
