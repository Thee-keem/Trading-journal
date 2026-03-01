import { PrismaClient, Trade, TradingPlan } from "@prisma/client";

const prisma = new PrismaClient();

export interface ComplianceResult {
    is_compliant: boolean;
    violations: string[];
}

export class ComplianceEngine {
    async validateTrade(userId: string, accountId: string, proposedTrade: any): Promise<ComplianceResult> {
        const violations: string[] = [];

        // 1. Fetch active trading plan for this account or user
        const plan = await prisma.tradingPlan.findFirst({
            where: {
                user_id: userId,
                OR: [
                    { account_id: accountId },
                    { account_id: null }
                ]
            },
            orderBy: { created_at: "desc" }
        });

        if (!plan) return { is_compliant: true, violations: [] };

        // 2. Check Daily Rules
        if (plan.max_trades_per_day) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const tradesToday = await prisma.trade.count({
                where: {
                    account_id: accountId,
                    created_at: { gte: startOfDay }
                }
            });

            if (tradesToday >= plan.max_trades_per_day) {
                violations.push(`Max trades per day reached (${plan.max_trades_per_day}).`);
            }
        }

        // 3. Check Session Rules
        if (plan.allowed_sessions && Array.isArray(plan.allowed_sessions)) {
            if (!plan.allowed_sessions.includes(proposedTrade.session)) {
                violations.push(`Trading session ${proposedTrade.session} is not in your allowed list.`);
            }
        }

        // 4. Check Risk per trade (if provided in plan rules JSON)
        const riskRules = plan.risk_rules as any;
        if (riskRules?.max_risk_percent && proposedTrade.risk_percent > riskRules.max_risk_percent) {
            violations.push(`Risk per trade (${proposedTrade.risk_percent}%) exceeds plan limit (${riskRules.max_risk_percent}%).`);
        }

        return {
            is_compliant: violations.length === 0,
            violations
        };
    }
}
