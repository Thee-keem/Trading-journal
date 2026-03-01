import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash("demo1234", 10)

    const user = await prisma.user.upsert({
        where: { email: "trader@novatrade.io" },
        update: {},
        create: {
            email: "trader@novatrade.io",
            password_hash: passwordHash,
        },
    })

    console.log("✅ Seeded user:", user.email, "ID:", user.id)

    const account = await prisma.tradingAccount.upsert({
        where: { id: "demo-account-1" },
        update: {},
        create: {
            id: "demo-account-1",
            user_id: user.id,
            account_name: "Live Account - 50k",
            broker_name: "MyBroker",
            account_type: "Live",
            starting_balance: 50000,
            currency: "USD",
            leverage: 100,
        },
    })

    console.log("✅ Seeded default account:", account.account_name, "ID:", account.id)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
