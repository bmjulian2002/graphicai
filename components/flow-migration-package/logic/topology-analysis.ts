import { Node, Edge } from '@xyflow/react';
import { ArchitecturePattern } from '../types';

// Helper to calculate burn rate for pattern detection
const getNodeBurnRate = (node: Node): number => {
    const data = node.data;
    const base = Number(data.baseTokens) || 500;
    const complexityMultiplier = {
        'simple': 1,
        'medium': 3,
        'complex': 10
    }[data.taskComplexity as string] || 1;
    const mcpFactor = Number(data.mcpFactor) || 1;
    return base * complexityMultiplier * mcpFactor;
};

// Analyze graph topology to detect AI architecture patterns
export const analyzeArchitecture = (nodes: Node[], edges: Edge[]): ArchitecturePattern[] => {
    const patterns: ArchitecturePattern[] = [];

    // Categorize nodes by type and capacity
    const llmNodes = nodes.filter(n => n.type === 'llmNode');
    const mcpNodes = nodes.filter(n => n.type === 'mcpNode');

    const lightLLMs = llmNodes.filter(n => getNodeBurnRate(n) < 1000);
    const heavyLLMs = llmNodes.filter(n => getNodeBurnRate(n) >= 4000);

    // Pattern 1: Router (Light -> 2+ Heavy)
    lightLLMs.forEach(lightNode => {
        const outgoingToHeavy = edges.filter(e =>
            e.source === lightNode.id &&
            heavyLLMs.some(h => h.id === e.target)
        );

        if (outgoingToHeavy.length >= 2) {
            const targetNodes = outgoingToHeavy.map(e => nodes.find(n => n.id === e.target)!);
            const avgX = (lightNode.position.x + targetNodes.reduce((sum, n) => sum + n.position.x, 0) / targetNodes.length) / 2;
            const avgY = Math.min(lightNode.position.y, ...targetNodes.map(n => n.position.y)) - 60;

            patterns.push({
                type: 'router',
                label: 'Router: Distribución de Carga',
                nodeIds: [lightNode.id, ...outgoingToHeavy.map(e => e.target)],
                position: { x: avgX, y: avgY }
            });
        }
    });

    // Pattern 2: Distillation (Heavy -> Light)
    heavyLLMs.forEach(heavyNode => {
        const outgoingToLight = edges.filter(e =>
            e.source === heavyNode.id &&
            lightLLMs.some(l => l.id === e.target)
        );

        if (outgoingToLight.length > 0) {
            outgoingToLight.forEach(edge => {
                const lightNode = nodes.find(n => n.id === edge.target)!;
                const avgX = (heavyNode.position.x + lightNode.position.x) / 2;
                const avgY = Math.min(heavyNode.position.y, lightNode.position.y) - 60;

                patterns.push({
                    type: 'distillation',
                    label: 'Pipeline: Refinamiento de Datos',
                    nodeIds: [heavyNode.id, lightNode.id],
                    position: { x: avgX, y: avgY }
                });
            });
        }
    });

    // Pattern 3: Autonomous Agent (Heavy -> 2+ MCP)
    heavyLLMs.forEach(heavyNode => {
        const outgoingToMCP = edges.filter(e =>
            e.source === heavyNode.id &&
            mcpNodes.some(m => m.id === e.target)
        );

        if (outgoingToMCP.length >= 2) {
            const targetNodes = outgoingToMCP.map(e => nodes.find(n => n.id === e.target)!);
            const avgX = (heavyNode.position.x + targetNodes.reduce((sum, n) => sum + n.position.x, 0) / targetNodes.length) / 2;
            const avgY = Math.min(heavyNode.position.y, ...targetNodes.map(n => n.position.y)) - 60;

            patterns.push({
                type: 'autonomous',
                label: 'Agente Autónomo',
                nodeIds: [heavyNode.id, ...outgoingToMCP.map(e => e.target)],
                position: { x: avgX, y: avgY }
            });
        }
    });

    return patterns;
};
