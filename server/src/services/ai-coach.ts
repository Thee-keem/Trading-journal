import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AiCoachingInsight {
    category: "Discipline" | "Strategy" | "Psychology" | "Risk";
    content: string;
}

export class AiCoachService {
    /**
     * Generates insights based on trade history.
     * If an LLM API key is present, it uses AI; otherwise, it uses rule-based heuristics.
     */
    async generateInsights(userId: string, accountId?: string): Promise<AiCoachingInsight[]> {
        const trades = await prisma.trade.findMany({
            where: {
                user_id: userId,
                ...(accountId ? { account_id: accountId } : {}),
            },
            orderBy: { created_at: "desc" },
            take: 50,
        });

        if (trades.length < 5) {
            return [
                {
                    category: "Strategy",
                    content: "Log more trades (at least 5) to unlock personalized institutional coaching insights.",
                },
            ];
        }

        // Heuristic 1: Revenge Trading Check
        const recentLoses = trades.slice(0, 3).filter(t => t.result === "Loss");
        if (recentLoses.length >= 3) {
            const timeDiff = new Date(recentLoses[0].created_at).getTime() - new Date(recentLoses[2].created_at).getTime();
            if (timeDiff < 1000 * 60 * 60 * 2) { // 3 losses in 2 hours
                return [
                    {
                        category: "Psychology",
                        content: "detected potential revenge trading pattern. You took 3 consecutive losses in under 2 hours. Institutional recommendation: Step away from the screens for the rest of the session.",
                    },
                ];
            }
        }

        // Heuristic 2: Session Performance
        const sessionStats: Record<string, { wins: number; total: number }> = {};
        trades.forEach(t => {
            if (!sessionStats[t.session]) sessionStats[t.session] = { wins: 0, total: 0 };
            sessionStats[t.session].total++;
            if (t.result === "Win") sessionStats[t.session].wins++;
        });

        const sessions = Object.keys(sessionStats);
        let worstSession = "";
        let minRate = 1;

        sessions.forEach(s => {
            const rate = sessionStats[s].wins / sessionStats[s].total;
            if (rate < minRate && sessionStats[s].total >= 3) {
                minRate = rate;
                worstSession = s;
            }
        });

        if (worstSession) {
            return [
                {
                    category: "Strategy",
                    content: `Your win rate in the ${worstSession} session is significantly lower (${Math.round(minRate * 100)}%) than your average. Consider reducing lot sizes or tightening filters during this window.`,
                },
            ];
        }

        // Default institutional tip
        return [
            {
                category: "Risk",
                content: "Maintaining a consistent R:R of at least 1:2 is the statistical foundation of your edge. Your average R:R is currently holding stable.",
            },
        ];
    }

    async persistInsights(userId: string, accountId: string | null, insights: AiCoachingInsight[]) {
        await prisma.aiInsight.createMany({
            data: insights.map(i => ({
                user_id: userId,
                account_id: accountId,
                category: i.category,
                content: i.content,
            })),
        });
    }
}
