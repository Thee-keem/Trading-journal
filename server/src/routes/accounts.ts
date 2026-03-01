import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { z } from "zod"

const AccountSchema = z.object({
    broker_name: z.string().min(1),
    account_name: z.string().min(1),
    account_type: z.enum(["Demo", "Live", "Funded"]),
    starting_balance: z.number().positive(),
    currency: z.string().default("USD"),
    leverage: z.number().int().positive(),
})

const accountsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const accounts = await fastify.prisma.tradingAccount.findMany({
            where: { user_id: (request.user as any).id },
            orderBy: { created_at: "desc" },
        })
        return reply.send({ accounts })
    })

    fastify.post("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const result = AccountSchema.safeParse(request.body)
        if (!result.success)
            return reply.status(400).send({ error: "Validation failed", details: result.error.format() })

        const account = await fastify.prisma.tradingAccount.create({
            data: { ...result.data, user_id: (request.user as any).id },
        })
        return reply.status(201).send({ account })
    })

    fastify.delete("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string }
        await fastify.prisma.tradingAccount.update({
            where: { id },
            data: { archived: true },
        })
        return reply.send({ success: true })
    })
}

export default accountsRoutes
