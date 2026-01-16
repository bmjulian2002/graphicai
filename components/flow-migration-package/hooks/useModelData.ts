import { useState, useEffect } from 'react';
import { ModelData } from '../types';

export const useModelData = () => {
    const [models, setModels] = useState<ModelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [breakpoints, setBreakpoints] = useState<{ low: number; high: number } | null>(null);

    useEffect(() => {
        const fetchModelStats = async () => {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/models');
                const data = await response.json();

                if (!data || !Array.isArray(data.data)) {
                    console.warn('OpenRouter API response missing data array:', data);
                    return;
                }

                const modelList: ModelData[] = data.data.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    pricing: {
                        prompt: m.pricing.prompt,
                        completion: m.pricing.completion,
                    }
                }));

                const prices = modelList
                    .map(m => parseFloat(m.pricing.prompt))
                    .filter(p => !isNaN(p) && p > 0)
                    .sort((a, b) => a - b);

                if (prices.length > 0) {
                    const low = prices[Math.floor(prices.length * 0.33)];
                    const high = prices[Math.floor(prices.length * 0.66)];
                    setBreakpoints({ low, high });
                }

                setModels(modelList);
            } catch (error) {
                console.error('Failed to fetch model data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchModelStats();
    }, []);

    return { models, breakpoints, loading };
};
