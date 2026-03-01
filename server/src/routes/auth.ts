import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.post("/register", async (request, reply) => {
        const result = RegisterSchema.safeParse(request.body);
        if (!result.success) return reply.status(400).send({ error: "Validation failed", details: result.error.format() });

        const { email, password } = result.data;
        const password_hash = await bcrypt.hash(password, 10);
        try {
            const user = await fastify.prisma.user.create({
                data: { email, password_hash }
            });
            return reply.status(201).send({ message: "User created", id: user.id });
        } catch (err) {
            return reply.status(400).send({ error: "Email already exists" });
        }
    });

    fastify.post("/login", async (request, reply) => {
        const result = LoginSchema.safeParse(request.body);
        if (!result.success) return reply.status(400).send({ error: "Validation failed", details: result.error.format() });

        const { email, password } = result.data;
        const user = await fastify.prisma.user.findUnique({ where: { email } });
        if (!user) return reply.status(401).send({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return reply.status(401).send({ error: "Invalid credentials" });

        const token = fastify.jwt.sign({ id: user.id, email: user.email });
        return reply.send({ token, user: { id: user.id, email: user.email } });
    });
};

export default authRoutes;
