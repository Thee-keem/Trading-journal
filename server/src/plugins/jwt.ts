import fp from "fastify-plugin";
import jwt, { FastifyJWTOptions } from "@fastify/jwt";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

export default fp(async (fastify: FastifyInstance) => {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET || "nova-secret-key-2024"
    });

    fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});
