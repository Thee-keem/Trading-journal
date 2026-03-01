export interface MonteCarloResult {
    index: number;
    p5: number;
    p50: number;
    p95: number;
}

export function runMonteCarlo(
    historicalResults: number[], // List of R-multiples or PnL amounts
    startingEquity: number,
    numTrades: number = 100,
    numSimulations: number = 1000
): MonteCarloResult[] {
    if (historicalResults.length === 0) return [];

    const simulations: number[][] = [];

    for (let s = 0; s < numSimulations; s++) {
        let currentEquity = startingEquity;
        const path: number[] = [currentEquity];

        for (let t = 0; t < numTrades; t++) {
            // Randomly sample a historical result
            const randomIndex = Math.floor(Math.random() * historicalResults.length);
            const result = historicalResults[randomIndex];
            currentEquity += result;
            path.push(currentEquity);
        }
        simulations.push(path);
    }

    // Aggregate results by trade index (path step)
    const aggregated: MonteCarloResult[] = [];

    for (let t = 0; t <= numTrades; t++) {
        const valuesAtT = simulations.map(path => path[t]).sort((a, b) => a - b);

        aggregated.push({
            index: t,
            p5: valuesAtT[Math.floor(numSimulations * 0.05)],
            p50: valuesAtT[Math.floor(numSimulations * 0.50)],
            p95: valuesAtT[Math.floor(numSimulations * 0.95)]
        });
    }

    return aggregated;
}
