import { BurnRateData } from '../types';

export const calculateNodeBurnRate = (data: any): BurnRateData => {
    const base = Number(data.baseTokens) || 500;
    const complexityMultiplier = {
        'simple': 1,
        'medium': 3,
        'complex': 10
    }[data.taskComplexity as string] || 1;

    const mcpFactor = Number(data.mcpFactor) || 1;
    const rate = base * complexityMultiplier * mcpFactor;

    // Color Logic
    let color = 'bg-green-500 text-white';
    if (rate >= 1000) color = 'bg-yellow-500 text-white';
    if (rate >= 4000) color = 'bg-red-500 text-white';

    if (data.userHasFreeTier && rate < 4000) {
        color = 'bg-cyan-500 text-white';
    }

    return { rate, formatted: `${(rate / 1000).toFixed(1)}k tkn`, color };
};
