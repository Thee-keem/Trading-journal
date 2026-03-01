import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ImportResult {
    success: boolean;
    count: number;
    errors: string[];
}

export class BrokerImportService {
    async importFromCsv(userId: string, accountId: string, csvContent: string): Promise<ImportResult> {
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) return { success: false, count: 0, errors: ["Empty or invalid CSV"] };

        const header = lines[0].toLowerCase();
        const isMt5 = header.includes("position") && header.includes("symbol");
        const isMt4 = header.includes("ticket") && header.includes("item");

        if (!isMt5 && !isMt4) {
            return { success: false, count: 0, errors: ["Unsupported CSV format. Must be MT4 or MT5 statement."] };
        }

        const tradesToCreate: any[] = [];
        const errors: string[] = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
            try {
                const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));

                let tradeData: any = {
                    user_id: userId,
                    account_id: accountId,
                };

                if (isMt4) {
                    // Ticket,Open Time,Type,Size,Item,Price,S / L,T / P,Close Time,Price,Commission,Taxes,Swap,Profit
                    const type = cols[2].toLowerCase();
                    if (type !== "buy" && type !== "sell") continue; // Skip deposits/withdrawals

                    const pnl = parseFloat(cols[13]) + parseFloat(cols[10]) + parseFloat(cols[12]); // Profit + Commission + Swap
                    tradeData = {
                        ...tradeData,
                        pair: cols[4],
                        direction: type === "buy" ? "Long" : "Short",
                        lot_size: parseFloat(cols[3]),
                        entry: parseFloat(cols[5]),
                        exit: parseFloat(cols[9]),
                        stop_loss: parseFloat(cols[6]) || null,
                        take_profit: parseFloat(cols[7]) || null,
                        pnl: pnl,
                        result: pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "Break Even",
                        is_win: pnl > 0,
                        created_at: new Date(cols[1].replace(/\./g, "-")),
                        session: this.detectSession(new Date(cols[1].replace(/\./g, "-")))
                    };
                } else if (isMt5) {
                    // Position,Symbol,Type,Volume,Open Time,Open Price,S / L,T / P,Time,Price,Commission,Swap,Profit
                    const type = cols[2].toLowerCase();
                    if (!type.includes("buy") && !type.includes("sell")) continue;

                    const pnl = parseFloat(cols[12]) + parseFloat(cols[10]) + parseFloat(cols[11]);
                    tradeData = {
                        ...tradeData,
                        pair: cols[1],
                        direction: type.includes("buy") ? "Long" : "Short",
                        lot_size: parseFloat(cols[3]),
                        entry: parseFloat(cols[5]),
                        exit: parseFloat(cols[9]),
                        pnl: pnl,
                        result: pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "Break Even",
                        is_win: pnl > 0,
                        created_at: new Date(cols[4].replace(/\./g, "-")),
                        session: this.detectSession(new Date(cols[4].replace(/\./g, "-")))
                    };
                }

                tradesToCreate.push(tradeData);
            } catch (e: any) {
                errors.push(`Line ${i + 1}: ${e.message}`);
            }
        }

        if (tradesToCreate.length > 0) {
            await prisma.trade.createMany({
                data: tradesToCreate
            });
        }

        return {
            success: true,
            count: tradesToCreate.length,
            errors
        };
    }

    private detectSession(date: Date): string {
        const hour = date.getUTCHours();
        if (hour >= 8 && hour < 12) return "London";
        if (hour >= 13 && hour < 17) return "New York";
        if (hour >= 0 && hour < 7) return "Tokyo/Sydney";
        if (hour >= 12 && hour < 13) return "London-NY Overlap";
        return "After Hours";
    }
}
