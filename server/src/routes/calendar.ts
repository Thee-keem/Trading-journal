import { FastifyInstance, FastifyPluginAsync } from "fastify"

const calendarRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_request, reply) => {
        const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`
        const MAX_RETRIES = 3
        const impactMap: Record<string, string> = { High: "High", Medium: "Medium", Low: "Low", "Non-Economic": "Low" }
        let lastError: any = null

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await fetch(url, {
                    headers: {
                        Accept: "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Cache-Control": "no-cache",
                    },
                })
                if (!res.ok) throw new Error(`Upstream returned ${res.status}`)

                const raw: any = await res.json()
                if (!Array.isArray(raw)) throw new Error("Invalid upstream format (not an array)")

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
                return reply.send({ events, source: "live", fetched_at: new Date().toISOString() })
            } catch (err: any) {
                lastError = err
                if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt))
            }
        }

        // DB Fallback
        try {
            const events = await fastify.prisma.economicEvent.findMany({
                orderBy: { event_time_utc: "asc" },
                take: 100,
            })
            return reply.send({ events, source: "db_cache", error: `Live fetch failed: ${lastError?.message}`, fetched_at: new Date().toISOString() })
        } catch {
            return reply.status(503).send({ error: "Live and cache fetch both failed", source: "error" })
        }
    })

    fastify.post("/sync", async (_request, reply) => {
        const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`
        const impactMap: Record<string, string> = { High: "High", Medium: "Medium", Low: "Low", "Non-Economic": "Low" }
        try {
            const res = await fetch(url, {
                headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
            })
            if (!res.ok) throw new Error(`Upstream ${res.status}`)
            const raw: any = await res.json()
            if (!Array.isArray(raw)) throw new Error("Invalid upstream format")
            let upserted = 0
            for (let i = 0; i < raw.length; i++) {
                const e = raw[i]
                const eventId = `${e.country}-${e.date}-${e.title}-${i}`.replace(/[^a-z0-9]/g, "-").toLowerCase()
                await fastify.prisma.economicEvent.upsert({
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
}

export default calendarRoutes
