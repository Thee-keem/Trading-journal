"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const zod_1 = require("zod");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const fastify = (0, fastify_1.default)({ logger: true });
fastify.register(cors_1.default, { origin: "*" });
fastify.register(jwt_1.default, { secret: process.env.JWT_SECRET || "nova-secret-key-2024" });
// ─── Decorators ──────────────────────────────────────────────────────────────
fastify.decorate("authenticate", async (request, reply) => {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
});
// ─── Health ───────────────────────────────────────────────────────────────────
fastify.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }));
// ─── Schemas ──────────────────────────────────────────────────────────────────
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const TradeSchema = zod_1.z.object({
    account_id: zod_1.z.string().uuid(),
    pair: zod_1.z.string().min(2),
    session: zod_1.z.enum(["Sydney", "Tokyo", "London", "New York"]),
    direction: zod_1.z.enum(["Long", "Short", "LONG", "SHORT"]),
    entry: zod_1.z.number(),
    exit: zod_1.z.number().optional().nullable(),
    stop_loss: zod_1.z.number().optional().nullable(),
    take_profit: zod_1.z.number().optional().nullable(),
    lot_size: zod_1.z.number().positive(),
    risk_percent: zod_1.z.number().optional().nullable(),
    fees: zod_1.z.number().optional().nullable(),
    confirmations: zod_1.z.array(zod_1.z.string()).optional(),
    emotion: zod_1.z.string().optional().nullable(),
    screenshot_url: zod_1.z.string().url().optional().nullable().or(zod_1.z.string().length(0)),
    notes: zod_1.z.string().optional().nullable(),
    pnl: zod_1.z.number().optional().nullable(),
    result: zod_1.z.enum(["Win", "Loss", "Break Even"]).optional().nullable(),
    is_win: zod_1.z.boolean().optional().nullable(),
});
// ─── Auth ─────────────────────────────────────────────────────────────────────
fastify.post("/api/auth/register", async (req, reply) => {
    const result = RegisterSchema.safeParse(req.body);
    if (!result.success)
        return reply.status(400).send({ error: "Validation failed", details: result.error.format() });
    const { email, password } = result.data;
    const password_hash = await bcryptjs_1.default.hash(password, 10);
    try {
        const user = await prisma.user.create({
            data: { email, password_hash }
        });
        return reply.status(201).send({ message: "User created", id: user.id });
    }
    catch (err) {
        return reply.status(400).send({ error: "Email already exists" });
    }
});
fastify.post("/api/auth/login", async (req, reply) => {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success)
        return reply.status(400).send({ error: "Validation failed", details: result.error.format() });
    const { email, password } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return reply.status(401).send({ error: "Invalid credentials" });
    const match = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!match)
        return reply.status(401).send({ error: "Invalid credentials" });
    const token = fastify.jwt.sign({ id: user.id, email: user.email });
    return reply.send({ token, user: { id: user.id, email: user.email } });
});
// ─── Economic Calendar (live via corsproxy → https://nfs.faireconomy.media) ──
fastify.get("/api/economic-calendar", async (req, reply) => {
    const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`;
    const MAX_RETRIES = 3;
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(url, {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Cache-Control": "no-cache"
                }
            });
            if (!res.ok)
                throw new Error(`Upstream returned ${res.status}`);
            const raw = await res.json();
            if (!Array.isArray(raw))
                throw new Error("Invalid upstream format (not an array)");
            const impactMap = { "High": "High", "Medium": "Medium", "Low": "Low", "Non-Economic": "Low" };
            const events = raw.map((e, idx) => ({
                id: `${e.country}-${e.date}-${e.title}-${idx}`.replace(/[^a-z0-9]/g, "-").toLowerCase(),
                event_name: e.title,
                currency: e.country,
                impact: impactMap[e.impact] ?? "Low",
                event_time_utc: new Date(e.date).toISOString(),
                forecast: e.forecast || null,
                previous: e.previous || null,
                actual: e.actual || null,
                country: e.country,
            }));
            return reply.send({ events, source: "live", fetched_at: new Date().toISOString(), attempt });
        }
        catch (err) {
            lastError = err;
            fastify.log.warn(`Calendar fetch attempt ${attempt} failed: ${err.message}`);
            if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential-ish backoff
            }
        }
    }
    // If we reach here, all retries failed — Fallback to DB
    try {
        const events = await prisma.economicEvent.findMany({
            orderBy: { event_time_utc: "asc" },
            take: 100, // Reasonable limit
        });
        return reply.send({
            events,
            source: "db_cache",
            error: `Live fetch failed: ${lastError?.message}`,
            fetched_at: new Date().toISOString()
        });
    }
    catch (dbErr) {
        return reply.status(503).send({
            error: "Failed to fetch live economic calendar and DB cache is unavailable",
            details: lastError?.message,
            source: "error"
        });
    }
});
// ─── Sync live events to DB (called by cron/webhook) ───────────────────────
fastify.post("/api/economic-calendar/sync", async (req, reply) => {
    try {
        const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`;
        const res = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        if (!res.ok)
            throw new Error(`Upstream ${res.status}`);
        const raw = await res.json();
        if (!Array.isArray(raw))
            throw new Error("Invalid upstream format");
        const impactMap = { High: "High", Medium: "Medium", Low: "Low", "Non-Economic": "Low" };
        let upserted = 0;
        for (let i = 0; i < raw.length; i++) {
            const e = raw[i];
            const eventId = `${e.country}-${e.date}-${e.title}-${i}`.replace(/[^a-z0-9]/g, "-").toLowerCase();
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
            });
            upserted++;
        }
        return reply.send({ upserted, message: "Sync complete" });
    }
    catch (err) {
        return reply.status(500).send({ error: err?.message });
    }
});
// ─── Trades ───────────────────────────────────────────────────────────────────
fastify.get("/api/trades", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const q = req.query;
    const userId = req.user.id;
    const where = { user_id: userId };
    if (q.account_id)
        where.account_id = q.account_id;
    if (q.date) {
        const dayStart = new Date(q.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(q.date);
        dayEnd.setHours(23, 59, 59, 999);
        where.created_at = { gte: dayStart, lte: dayEnd };
    }
    const trades = await prisma.trade.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: q.limit ? parseInt(q.limit) : 100,
    });
    return reply.send({ trades });
});
fastify.post("/api/trades", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const result = TradeSchema.safeParse(req.body);
    if (!result.success)
        return reply.status(400).send({ error: "Validation failed", details: result.error.format() });
    const userId = req.user.id;
    // Normalize direction to Title Case
    const data = {
        ...result.data,
        user_id: userId,
        direction: result.data.direction.charAt(0).toUpperCase() + result.data.direction.slice(1).toLowerCase()
    };
    try {
        const trade = await prisma.trade.create({ data });
        return reply.status(201).send({ trade });
    }
    catch (err) {
        return reply.status(500).send({ error: "Failed to create trade", details: err.message });
    }
});
// ─── Accounts ────────────────────────────────────────────────────────────────
fastify.get("/api/accounts", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const accounts = await prisma.tradingAccount.findMany({
        where: { user_id: req.user.id },
        orderBy: { created_at: "desc" },
    });
    return reply.send({ accounts });
});
// ─── Analytics Summary ───────────────────────────────────────────────────────
fastify.get("/api/analytics/summary", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const q = req.query;
    const userId = req.user.id;
    const where = { user_id: userId };
    if (q.account_id)
        where.account_id = q.account_id;
    const trades = await prisma.trade.findMany({ where });
    const total = trades.length;
    const wins = trades.filter(t => t.result === "Win").length;
    const netPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    return reply.send({ total_trades: total, wins, losses: total - wins, net_pnl: netPnl, win_rate: winRate });
});
// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: "0.0.0.0" });
        console.log("✅  Server on http://localhost:3001");
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
