import Fastify from "fastify"
import cors from "@fastify/cors"
import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient()
const fastify = Fastify({ logger: true })

fastify.register(cors, { origin: "*" })

// ─── Health ───────────────────────────────────────────────────────────────────
fastify.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }))

// ─── Economic Calendar (live via corsproxy → https://nfs.faireconomy.media) ──
fastify.get("/api/economic-calendar", async (req, reply) => {
  try {
    const q = req.query as Record<string, string>
    const from = q.from || new Date().toISOString().split("T")[0]
    const to = q.to || (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0] })()

    // Free FF-format JSON feed
    const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`

    const res = await fetch(url, {
      headers: { "Accept": "application/json" }
    })

    if (!res.ok) throw new Error(`Upstream ${res.status}`)

    const raw: Array<{
      title: string; country: string; date: string; impact: string;
      forecast: string; previous: string; actual: string
    }> = await res.json()

    // Normalize — map FF impact to our levels
    const impactMap: Record<string, string> = { "High": "High", "Medium": "Medium", "Low": "Low", "Non-Economic": "Low" }

    const events = raw.map(e => ({
      id: `${e.country}-${e.date}-${e.title}`.replace(/\s+/g, "-").toLowerCase(),
      event_name: e.title,
      currency: e.country,
      impact: impactMap[e.impact] ?? "Low",
      event_time_utc: new Date(e.date).toISOString(),
      forecast: e.forecast || null,
      previous: e.previous || null,
      actual: e.actual || null,
      country: e.country,
    }))

    return reply.send({ events, source: "live", fetched_at: new Date().toISOString() })
  } catch (err: any) {
    fastify.log.error(err)
    // Fallback — return cached DB events if live fetch fails
    const events = await prisma.economicEvent.findMany({
      orderBy: { event_time_utc: "asc" },
    })
    return reply.send({ events, source: "db_cache", error: err?.message })
  }
})

// ─── Sync live events to DB (called by cron/webhook) ───────────────────────
fastify.post("/api/economic-calendar/sync", async (req, reply) => {
  try {
    const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`
    const res = await fetch(url, { headers: { Accept: "application/json" } })
    if (!res.ok) throw new Error(`Upstream ${res.status}`)
    const raw: Array<{
      title: string; country: string; date: string; impact: string;
      forecast: string; previous: string; actual: string
    }> = await res.json()
    const impactMap: Record<string, string> = { High: "High", Medium: "Medium", Low: "Low", "Non-Economic": "Low" }
    let upserted = 0
    for (const e of raw) {
      await prisma.economicEvent.upsert({
        where: { id: `${e.country}-${e.date}-${e.title}`.replace(/\s+/g, "-").toLowerCase() },
        update: { actual: e.actual || null, forecast: e.forecast || null },
        create: {
          id: `${e.country}-${e.date}-${e.title}`.replace(/\s+/g, "-").toLowerCase(),
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
fastify.get("/api/trades", async (req, reply) => {
  const q = req.query as Record<string, string>
  const where: any = {}
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

fastify.post("/api/trades", async (req, reply) => {
  const body = req.body as any
  const trade = await prisma.trade.create({ data: body })
  return reply.status(201).send({ trade })
})

// ─── Accounts ────────────────────────────────────────────────────────────────
fastify.get("/api/accounts", async (req, reply) => {
  const accounts = await prisma.tradingAccount.findMany({
    orderBy: { created_at: "desc" },
  })
  return reply.send({ accounts })
})

// ─── Analytics Summary ───────────────────────────────────────────────────────
fastify.get("/api/analytics/summary", async (req, reply) => {
  const q = req.query as Record<string, string>
  const where: any = {}
  if (q.account_id) where.account_id = q.account_id

  const trades = await prisma.trade.findMany({ where })
  const total = trades.length
  const wins = trades.filter(t => t.result === "Win").length
  const netPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const winRate = total > 0 ? (wins / total) * 100 : 0

  return reply.send({ total_trades: total, wins, losses: total - wins, net_pnl: netPnl, win_rate: winRate })
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
