import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { AiCoachService } from "../services/ai-coach"
import { runMonteCarlo } from "../utils/stats-engine"

const aiCoach = new AiCoachService()

const analyticsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // ─── Summary ─────────────────────────────────────────────────────────────────
    fastify.get("/summary", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const q = request.query as Record<string, string>
        const userId = (request.user as any).id
        const where: any = { user_id: userId }
        if (q.account_id) where.account_id = q.account_id

        const trades = await fastify.prisma.trade.findMany({ where })
        const total = trades.length
        if (total === 0)
            return reply.send({ total_trades: 0, wins: 0, losses: 0, net_pnl: 0, win_rate: 0, profit_factor: 0, avg_win: 0, avg_loss: 0 })

        const wins = trades.filter(t => t.result === "Win")
        const losses = trades.filter(t => t.result === "Loss")
        const totalWins = wins.reduce((s, t) => s + (t.pnl ?? 0), 0)
        const totalLosses = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0))
        const netPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
        const winRate = (wins.length / total) * 100
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 100 : 0
        const avgWin = wins.length > 0 ? totalWins / wins.length : 0
        const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0
        return reply.send({ total_trades: total, wins: wins.length, losses: losses.length, net_pnl: netPnl, win_rate: winRate, profit_factor: profitFactor, avg_win: avgWin, avg_loss: avgLoss })
    })

    // ─── Equity Curve ───────────────────────────────────────────────────────────
    fastify.get("/equity", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const q = request.query as Record<string, string>
        const userId = (request.user as any).id
        const where: any = { user_id: userId, pnl: { not: null } }
        if (q.account_id) where.account_id = q.account_id

        const account = await fastify.prisma.tradingAccount.findFirst({
            where: { user_id: userId, ...(q.account_id ? { id: q.account_id } : {}) },
        })
        const trades = await fastify.prisma.trade.findMany({ where, orderBy: { created_at: "asc" } })
        let equity = account?.starting_balance ?? 10000
        const history = trades.map(t => {
            equity += t.pnl ?? 0
            return { date: t.created_at.toISOString(), equity: Math.round(equity * 100) / 100, pnl: t.pnl }
        })
        return reply.send({ history, starting_balance: account?.starting_balance ?? 10000 })
    })

    // ─── Insights (behavioral) ──────────────────────────────────────────────────
    fastify.get("/insights", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const q = request.query as Record<string, string>
        const userId = (request.user as any).id
        const where: any = { user_id: userId }
        if (q.account_id) where.account_id = q.account_id

        const trades = await fastify.prisma.trade.findMany({ where, orderBy: { created_at: "desc" }, take: 200 })
        const insights: any[] = []

        // Session win-rate analysis
        const sessions = ["London", "New York", "Tokyo", "Sydney"]
        for (const sess of sessions) {
            const st = trades.filter(t => t.session === sess)
            if (st.length < 5) continue
            const sw = st.filter(t => t.result === "Win")
            const wr = (sw.length / st.length) * 100
            if (wr < 40)
                insights.push({ type: "WARNING", title: "Weak Session Edge", message: `Win rate in ${sess} session is ${wr.toFixed(0)}%. Consider avoiding it.` })
            else if (wr > 60)
                insights.push({ type: "INFO", title: "Strong Session Edge", message: `Your best session is ${sess} with ${wr.toFixed(0)}% win rate.` })
        }

        // Revenge trading detection
        const afterLossTrades = trades.filter(t => t.after_loss)
        if (afterLossTrades.length > 0) {
            const afterLossWR = (afterLossTrades.filter(t => t.result === "Win").length / afterLossTrades.length) * 100
            if (afterLossWR < 40)
                insights.push({ type: "WARNING", title: "Revenge Trading Risk", message: `Win rate drops to ${afterLossWR.toFixed(0)}% on trades placed after a loss. Take a break after losses.` })
        }

        // Plan violation
        const violating = trades.filter(t => t.plan_violation)
        if (violating.length > 5) {
            const cleanPnl = trades.filter(t => !t.plan_violation).reduce((s, t) => s + (t.pnl ?? 0), 0) / (trades.filter(t => !t.plan_violation).length || 1)
            const badPnl = violating.reduce((s, t) => s + (t.pnl ?? 0), 0) / (violating.length || 1)
            if (cleanPnl > badPnl)
                insights.push({ type: "WARNING", title: "Plan Compliance", message: `Plan violations are costing you ${((1 - badPnl / cleanPnl) * 100).toFixed(0)}% in average PnL per trade.` })
        }

        // Best pair
        const pairs = [...new Set(trades.map(t => t.pair))]
        const pairStats = pairs.map(p => {
            const pt = trades.filter(t => t.pair === p)
            return { pair: p, pnl: pt.reduce((s, t) => s + (t.pnl ?? 0), 0), count: pt.length }
        })
        const bestPair = [...pairStats].sort((a, b) => b.pnl - a.pnl)[0]
        if (bestPair && bestPair.pnl > 0)
            insights.push({ type: "INFO", title: "Edge Discovery", message: `${bestPair.pair} is your most profitable pair with $${bestPair.pnl.toLocaleString()} net profit.` })

        return reply.send({ insights })
    })

    // ─── Monte Carlo ───────────────────────────────────────────────────────────
    fastify.get("/monte-carlo", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const q = request.query as Record<string, string>
        const userId = (request.user as any).id

        const account = await fastify.prisma.tradingAccount.findFirst({
            where: { id: q.account_id || undefined, user_id: userId },
        })
        if (!account && q.account_id) return reply.status(404).send({ error: "Account not found" })

        const trades = await fastify.prisma.trade.findMany({
            where: { user_id: userId, account_id: q.account_id || undefined, result: { not: null } },
        })
        const results = trades.map(t => t.pnl || 0)
        const startingBalance = account?.starting_balance || 10000
        const simulation = runMonteCarlo(results, startingBalance)
        return reply.send({ simulation_results: simulation })
    })

    // ─── AI Coach ─────────────────────────────────────────────────────────────
    fastify.get("/ai/coach", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { account_id } = request.query as { account_id?: string }
        const userId = (request.user as any).id

        const existingInsights = await fastify.prisma.aiInsight.findMany({
            where: {
                user_id: userId,
                ...(account_id ? { account_id } : {}),
                created_at: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
            },
        })
        if (existingInsights.length > 0) return { insights: existingInsights }

        const newInsights = await aiCoach.generateInsights(userId, account_id)
        if (newInsights.length > 0 && !newInsights[0].content.includes("Log more trades"))
            await aiCoach.persistInsights(userId, account_id || null, newInsights)

        return reply.send({ insights: newInsights })
    })
}

export default analyticsRoutes
