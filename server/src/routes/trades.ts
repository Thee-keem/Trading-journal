import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";

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
});

const tradesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const q = request.query as Record<string, string>;
        const userId = (request.user as any).id;
        const where: any = { user_id: userId };

        if (q.account_id) where.account_id = q.account_id;
        if (q.date) {
            const dayStart = new Date(q.date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(q.date);
            dayEnd.setHours(23, 59, 59, 999);
            where.created_at = { gte: dayStart, lte: dayEnd };
        }
        const trades = await fastify.prisma.trade.findMany({
            where,
            orderBy: { created_at: "desc" },
            take: q.limit ? parseInt(q.limit) : 100,
        });
        return reply.send({ trades });
    });

    fastify.post("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const result = TradeSchema.safeParse(request.body);
        if (!result.success) return reply.status(400).send({ error: "Validation failed", details: result.error.format() });

        const userId = (request.user as any).id;
        const data = {
            ...result.data,
            user_id: userId,
            direction: result.data.direction.charAt(0).toUpperCase() + result.data.direction.slice(1).toLowerCase()
        };

        // Placeholder for services that will be registered globally or imported
        // For now, importing directly. In a fully modular setup, these might be plugins.
        const { ComplianceEngine } = require("../services/compliance-engine");
        const complianceEngine = new ComplianceEngine();

        const lastTrade = await fastify.prisma.trade.findFirst({
            where: { account_id: data.account_id, user_id: userId },
            orderBy: { created_at: "desc" }
        });
        const afterLoss = lastTrade && lastTrade.result === "Loss";

        const compliance = await complianceEngine.validateTrade(userId, data.account_id, {
            ...data,
            after_loss: afterLoss
        });

        try {
            const trade = await fastify.prisma.trade.create({
                data: {
                    ...data,
                    after_loss: afterLoss || false,
                    plan_violation: !compliance.is_compliant
                }
            });
            return reply.status(201).send({ trade, compliance });
        } catch (err: any) {
            return reply.status(500).send({ error: "Failed to create trade", details: err.message });
        }
    });

    fastify.post("/import", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { account_id, csv_content } = request.body as { account_id: string; csv_content: string };
        if (!account_id || !csv_content) return reply.status(400).send({ error: "account_id and csv_content are required" });

        const { BrokerImportService } = require("../services/broker-import");
        const brokerImport = new BrokerImportService();

        const result = await brokerImport.importFromCsv((request.user as any).id, account_id, csv_content);
        return reply.send(result);
    });
};

export default tradesRoutes;
