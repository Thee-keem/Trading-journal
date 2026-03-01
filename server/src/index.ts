import Fastify from "fastify"
import cors from "@fastify/cors"
import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import jwt from "@fastify/jwt"
import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"
import { AiCoachService } from "./services/ai-coach"
import { runMonteCarlo } from "./utils/stats-engine"
import { ComplianceEngine } from "./services/compliance-engine"
import { BrokerImportService } from "./services/broker-import"

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

dotenv.config()

const prisma = new PrismaClient()
const fastify = Fastify({ logger: true })
const aiCoach = new AiCoachService()
const complianceEngine = new ComplianceEngine()
const brokerImport = new BrokerImportService()

fastify.register(cors, { origin: "*" })
fastify.register(jwt, { secret: process.env.JWT_SECRET || "nova-secret-key-2024" })

// ─── Decorators ──────────────────────────────────────────────────────────────
fastify.decorate("authenticate", async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

// ─── Health ───────────────────────────────────────────────────────────────────
fastify.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }))

// ─── Schemas ──────────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const TradeSchema = z.object({
  account_id: z.string().uuid(),
  pair: z.string().min(2),
  session: z.enum(["Sydney", "Tokyo", "London", "New York"]),
  direction: z.enum(["Long", "Short", "LONG", "SHORT"]),
  entry: z.number(),
  exit: z.number().optional().nullable(),
  stop_loss: z.number().optional().nullable(),
  take_profit: z.number().optional().nullable(),
  lot_size: z.number().positive(),
  risk_percent: z.number().optional().nullable(),
  fees: z.number().optional().nullable(),
  confirmations: z.array(z.string()).optional(),
  emotion: z.string().optional().nullable(),
  screenshot_url: z.string().url().optional().nullable().or(z.string().length(0)),
  notes: z.string().optional().nullable(),
  pnl: z.number().optional().nullable(),
  result: z.enum(["Win", "Loss", "Break Even"]).optional().nullable(),
  is_win: z.boolean().optional().nullable(),
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
fastify.post("/api/auth/register", async (req, reply) => {
  const result = RegisterSchema.safeParse(req.body)
  if (!result.success) return reply.status(400).send({ error: "Validation failed", details: result.error.format() })

  const { email, password } = result.data
  const password_hash = await bcrypt.hash(password, 10)
  try {
    const user = await prisma.user.create({
      data: { email, password_hash }
    })
    return reply.status(201).send({ message: "User created", id: user.id })
  } catch (err) {
    return reply.status(400).send({ error: "Email already exists" })
  }
})

fastify.post("/api/auth/login", async (req, reply) => {
  const result = LoginSchema.safeParse(req.body)
  if (!result.success) return reply.status(400).send({ error: "Validation failed", details: result.error.format() })

  const { email, password } = result.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return reply.status(401).send({ error: "Invalid credentials" })

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) return reply.status(401).send({ error: "Invalid credentials" })

  const token = fastify.jwt.sign({ id: user.id, email: user.email })
  return reply.send({ token, user: { id: user.id, email: user.email } })
})

// ─── Economic Calendar (live via corsproxy → https://nfs.faireconomy.media) ──
fastify.get("/api/economic-calendar", async (req, reply) => {
  const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`
  const MAX_RETRIES = 3
  let lastError: any = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Cache-Control": "no-cache"
        }
      })

      if (!res.ok) throw new Error(`Upstream returned ${res.status}`)

      const raw: any = await res.json()
      if (!Array.isArray(raw)) throw new Error("Invalid upstream format (not an array)")

      const impactMap: Record<string, string> = { "High": "High", "Medium": "Medium", "Low": "Low", "Non-Economic": "Low" }

      const events = raw.map((e: any, idx: number) => ({
        id: `${e.country}-${e.date}-${e.title}-${idx}`.replace(/[^a-z0-9]/g, "-").toLowerCase(),
        event_name: e.title,
        currency: e.country,
        impact: impactMap[e.impact] ?? "Low",
        event_time_utc: new Date(e.date).toISOString(),
        forecast: e.forecast || null,
        previous: e.previous || null,
        actual: e.actual || null,
        country: e.country,
      }))

      return reply.send({ events, source: "live", fetched_at: new Date().toISOString(), attempt })
    } catch (err: any) {
      lastError = err
      fastify.log.warn(`Calendar fetch attempt ${attempt} failed: ${err.message}`)
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential-ish backoff
      }
    }
  }

  // If we reach here, all retries failed — Fallback to DB
  try {
    const events = await prisma.economicEvent.findMany({
      orderBy: { event_time_utc: "asc" },
      take: 100, // Reasonable limit
    })
    return reply.send({
      events,
      source: "db_cache",
      error: `Live fetch failed: ${lastError?.message}`,
      fetched_at: new Date().toISOString()
    })
  } catch (dbErr: any) {
    return reply.status(503).send({
      error: "Failed to fetch live economic calendar and DB cache is unavailable",
      details: lastError?.message,
      source: "error"
    })
  }
})

// ─── Sync live events to DB (called by cron/webhook) ───────────────────────
fastify.post("/api/economic-calendar/sync", async (req, reply) => {
  try {
    const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    })
    if (!res.ok) throw new Error(`Upstream ${res.status}`)
    const raw: any = await res.json()
    if (!Array.isArray(raw)) throw new Error("Invalid upstream format")
    const impactMap: Record<string, string> = { High: "High", Medium: "Medium", Low: "Low", "Non-Economic": "Low" }
    let upserted = 0
    for (let i = 0; i < raw.length; i++) {
      const e = raw[i]
      const eventId = `${e.country}-${e.date}-${e.title}-${i}`.replace(/[^a-z0-9]/g, "-").toLowerCase()
      await prisma.economicEvent.upsert({
        where: { id: eventId },
        update: { actual: e.actual || null, forecast: e.forecast || null },
        create: {
          id: eventId,
          event_name: e.title,
          currency: e.country,
          impact: impactMap[e.impact] ?? "Low",
          event_time_utc: new Date(e.date),
          forecast: e.forecast || null,
          previous: e.previous || null,
          actual: e.actual || null,
          country: e.country,
        },
      })
      upserted++
    }
    return reply.send({ upserted, message: "Sync complete" })
  } catch (err: any) {
    return reply.status(500).send({ error: err?.message })
  }
})

// ─── Trades ───────────────────────────────────────────────────────────────────
fastify.get("/api/trades", { preHandler: [fastify.authenticate] }, async (req, reply) => {
  const q = req.query as Record<string, string>
  const userId = (req.user as any).id
  const where: any = { user_id: userId }

  if (q.account_id) where.account_id = q.account_id
  if (q.date) {
    const dayStart = new Date(q.date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(q.date)
    dayEnd.setHours(23, 59, 59, 999)
    where.created_at = { gte: dayStart, lte: dayEnd }
  }
  const trades = await prisma.trade.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: q.limit ? parseInt(q.limit) : 100,
  })
  return reply.send({ trades })
})

fastify.post("/api/trades", { preHandler: [fastify.authenticate] }, async (req, reply) => {
  const result = TradeSchema.safeParse(req.body)
  if (!result.success) return reply.status(400).send({ error: "Validation failed", details: result.error.format() })

  const userId = (req.user as any).id

  // Normalize direction to Title Case
  const data = {
    ...result.data,
    user_id: userId,
    direction: result.data.direction.charAt(0).toUpperCase() + result.data.direction.slice(1).toLowerCase()
  }

  // Detect behavior and compliance
  const lastTrade = await prisma.trade.findFirst({
    where: { account_id: data.account_id, user_id: userId },
    orderBy: { created_at: "desc" }
  })
  const afterLoss = lastTrade && lastTrade.result === "Loss"

  const compliance = await complianceEngine.validateTrade(userId, data.account_id, {
    ...data,
    after_loss: afterLoss
  })

  try {
    const trade = await prisma.trade.create({
      data: {
        ...data,
        after_loss: afterLoss || false,
        plan_violation: !compliance.is_compliant
      }
    })
    return reply.status(201).send({ trade, compliance })
  } catch (err: any) {
    return reply.status(500).send({ error: "Failed to create trade", details: err.message })
  }
})

// Bulk Import
fastify.post("/api/trades/import", { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
  const { account_id, csv_content } = req.body as { account_id: string; csv_content: string }
  if (!account_id || !csv_content) return reply.status(400).send({ error: "account_id and csv_content are required" })

  const result = await brokerImport.importFromCsv(req.user.id, account_id, csv_content)
  return reply.send(result)
})

// ─── Accounts ────────────────────────────────────────────────────────────────
fastify.get("/api/accounts", { preHandler: [fastify.authenticate] }, async (req, reply) => {
  const accounts = await prisma.tradingAccount.findMany({
    where: { user_id: (req.user as any).id },
    orderBy: { created_at: "desc" },
  })
  return reply.send({ accounts })
})

// ─── Analytics Summary ───────────────────────────────────────────────────────
// ─── Analytics Summary ───────────────────────────────────────────────────────
fastify.get("/api/analytics/summary", { preHandler: [fastify.authenticate] }, async (req, reply) => {
  const q = req.query as Record<string, string>
  const userId = (req.user as any).id
  const where: any = { user_id: userId }

  if (q.account_id) where.account_id = q.account_id

  const trades = await prisma.trade.findMany({ where })
  const total = trades.length
  if (total === 0) {
    return reply.send({
      total_trades: 0, wins: 0, losses: 0, net_pnl: 0, win_rate: 0,
      profit_factor: 0, avg_win: 0, avg_loss: 0
    })
  }

  const wins = trades.filter(t => t.result === "Win")
  const losses = trades.filter(t => t.result === "Loss")

  const totalWins = wins.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const totalLosses = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0))

  const netPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const winRate = (wins.length / total) * 100
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 100 : 0
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0

  return reply.send({
    total_trades: total,
    wins: wins.length,
    losses: losses.length,
    net_pnl: netPnl,
    win_rate: winRate,
    profit_factor: profitFactor,
    avg_win: avgWin,
    avg_loss: avgLoss
  })
})

// ─── Equity Curve ───────────────────────────────────────────────────────────
fastify.get("/api/analytics/equity", { preHandler: [fastify.authenticate] }, async (req, reply) => {
  const q = req.query as Record<string, string>
  const userId = (req.user as any).id
  const where: any = { user_id: userId }
  if (q.account_id) where.account_id = q.account_id

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { created_at: "asc" }
  })

  // Start with account starting balance if single account, or 0 for portfolio
  let currentBalance = 0
  if (q.account_id) {
    const acc = await prisma.tradingAccount.findUnique({ where: { id: q.account_id } })
    currentBalance = acc?.starting_balance ?? 0
  }

  const history = trades.map(t => {
    currentBalance += (t.pnl ?? 0)
    return {
      date: t.created_at,
      pnl: t.pnl,
      equity: currentBalance
    }
  })

  return reply.send({ history })
})

// ─── Behavioral Insights ────────────────────────────────────────────────────
fastify.get("/api/analytics/insights", { preHandler: [fastify.authenticate] }, async (req, reply) => {
  const q = req.query as Record<string, string>
  const userId = (req.user as any).id
  const where: any = { user_id: userId }
  if (q.account_id) where.account_id = q.account_id

  const trades = await prisma.trade.findMany({ where })
  if (trades.length < 3) {
    return reply.send({ insights: [{ type: "INFO", message: "Log more trades to unlock behavioral insights." }] })
  }

  const insights = []

  // 1. Session Strength
  const sessions = ["London", "New York", "Tokyo", "Asian"]
  const sessionStats = sessions.map(s => {
    const sTrades = trades.filter(t => t.session === s)
    const wins = sTrades.filter(t => t.result === "Win").length
    return { session: s, winRate: sTrades.length > 0 ? (wins / sTrades.length) * 100 : 0, count: sTrades.length }
  }).filter(s => s.count > 0)

  const bestSession = [...sessionStats].sort((a, b) => b.winRate - a.winRate)[0]
  if (bestSession && bestSession.winRate > 60) {
    insights.push({
      type: "SUCCESS",
      title: "Session Strength",
      message: `Your win rate is ${bestSession.winRate.toFixed(1)}% during the ${bestSession.session} session.`
    })
  }

  // 2. Risk Alert (Loss Streaks or high fees)
  const totalFees = trades.reduce((s, t) => s + (t.fees ?? 0), 0)
  if (totalFees > 500) {
    insights.push({
      type: "WARNING",
      title: "Fee Warning",
      message: "High commission costs detected. Consider optimizing entry frequency."
    })
  }

  // 3. Pair Insight
  const pairs = [...new Set(trades.map(t => t.pair))]
  const pairStats = pairs.map(p => {
    const pTrades = trades.filter(t => t.pair === p)
    const pnl = pTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
    return { pair: p, pnl, count: pTrades.length }
  })

  const bestPair = [...pairStats].sort((a, b) => b.pnl - a.pnl)[0]
  if (bestPair && bestPair.pnl > 0) {
    insights.push({
      type: "INFO",
      title: "Edge Discovery",
      message: `${bestPair.pair} is your most profitable pair with $${bestPair.pnl.toLocaleString()} net profit.`
    })
  }

  return reply.send({ insights })
})

// ─── AI Coaching ──────────────────────────────────────────────────────────────
fastify.get("/api/ai/coach", { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
  const { account_id } = req.query as { account_id?: string }
  const userId = req.user.id

  // Check if we have recent insights in DB
  const existingInsights = await prisma.aiInsight.findMany({
    where: {
      user_id: userId,
      ...(account_id ? { account_id } : {}),
      created_at: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } // Last 24h
    }
  })

  if (existingInsights.length > 0) {
    return { insights: existingInsights }
  }

  // Generate new insights
  const newInsights = await aiCoach.generateInsights(userId, account_id)

  // Persist if they are real insights (not just "log more trades")
  if (newInsights.length > 0 && !newInsights[0].content.includes("Log more trades")) {
    await aiCoach.persistInsights(userId, account_id || null, newInsights)
  }

  return reply.send({ insights: newInsights })
})

// ─── Monte Carlo ─────────────────────────────────────────────────────────────
fastify.get("/api/analytics/monte-carlo", { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
  const { account_id } = req.query as { account_id?: string }
  const userId = req.user.id

  const account = await prisma.tradingAccount.findFirst({
    where: { id: account_id || undefined, user_id: userId }
  })

  if (!account && account_id) return reply.status(404).send({ error: "Account not found" })

  const trades = await prisma.trade.findMany({
    where: { user_id: userId, account_id: account_id || undefined, result: { not: null } }
  })

  const results = trades.map(t => t.pnl || 0)
  const startingBalance = account?.starting_balance || 10000

  const simulation = runMonteCarlo(results, startingBalance)
  return reply.send({ simulation_results: simulation })
})

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" })
    console.log("✅  Server on http://localhost:3001")
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
