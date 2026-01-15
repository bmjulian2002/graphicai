
export interface BurnRateData {
    rate: number;
    formatted: string;
    color: string;
}

export interface ModelPricing {
    prompt: string;
    completion: string;
}

export interface ModelData {
    id: string;
    name: string;
    pricing: ModelPricing;
}

export interface ArchitecturePattern {
    type: 'router' | 'distillation' | 'autonomous';
    label: string;
    nodeIds: string[];
    position: { x: number; y: number };
}
