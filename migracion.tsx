'use client';

/**
 * MIGRATION GUIDE
 * ===============
 * This file contains the complete, self-contained implementation of the AI Flow Diagram.
 * including the Detail Sidebar, Node Types, Data Hooks, Topological Analysis, and Edge Validation.
 * 
 * DEPENDENCIES:
 * You must install the following packages in your new project:
 * npm install @xyflow/react lucide-react framer-motion clsx tailwind-merge
 * 
 * TAILWIND CONFIG:
 * Ensure your tailwind.config.ts includes the 'animate-in', 'fade-in', 'zoom-in', 'slide-in' utilities.
 * If not, install tailwindcss-animate:
 * npm install tailwindcss-animate
 * And add `require("tailwindcss-animate")` to your plugins.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
    Controls,
    MiniMap,
    ReactFlow,
    Node,
    Edge,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    addEdge,
    BackgroundVariant,
    NodeTypes,
    Handle,
    Position,
    NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Box, Cpu, User, GitBranch, Terminal, AlertTriangle, Server, Database, Zap, Flame, ArrowRight, Check, Brain, Wrench, Plug, Monitor, Bot, Pencil, Maximize2, Minimize2 } from 'lucide-react';

// ============================================
// HOOK: useModelData (Inlined for Portability)
// ============================================
interface ModelPricing {
    prompt: string;
    completion: string;
}

interface ModelData {
    id: string;
    name: string;
    pricing: ModelPricing;
}

const useModelData = () => {
    const [models, setModels] = useState<ModelData[]>([]);
    const [breakpoints, setBreakpoints] = useState<{ low: number; high: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModelStats = async () => {
            try {
                const res = await fetch("https://openrouter.ai/api/v1/models");
                const { data } = await res.json();

                if (!data || data.length === 0) throw new Error("No data");

                const validModels = data.filter((m: any) =>
                    m.pricing && !isNaN(parseFloat(m.pricing.prompt))
                );

                const priorityOrder = ['claude-3', 'gpt-4', 'gemini', 'llama-3', 'mistral'];

                const sortedModels = validModels.sort((a: any, b: any) => {
                    const aId = a.id.toLowerCase();
                    const bId = b.id.toLowerCase();

                    const aPriority = priorityOrder.findIndex(p => aId.includes(p));
                    const bPriority = priorityOrder.findIndex(p => bId.includes(p));

                    if (aPriority !== -1 && bPriority === -1) return -1;
                    if (aPriority === -1 && bPriority !== -1) return 1;
                    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;

                    return (a.name || a.id).localeCompare(b.name || b.id);
                });

                const sample = sortedModels.slice(0, 10);
                const avgPrice = sample.reduce((acc: number, m: any) => acc + parseFloat(m.pricing.prompt), 0) / sample.length;

                setModels(sortedModels);
                setBreakpoints({
                    low: avgPrice * 0.5,
                    high: avgPrice * 1.5
                });
            } catch (error) {
                console.error("Failed to fetch model data", error);
                setBreakpoints({ low: 0.000005, high: 0.00002 });
            } finally {
                setLoading(false);
            }
        };

        fetchModelStats();
    }, []);

    return { models, breakpoints, loading };
};

// ============================================
// TOPOLOGY ANALYSIS ENGINE
// ============================================

interface ArchitecturePattern {
    type: 'router' | 'distillation' | 'autonomous';
    label: string;
    nodeIds: string[];
    position: { x: number; y: number };
}

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
const analyzeArchitecture = (nodes: Node[], edges: Edge[]): ArchitecturePattern[] => {
    const patterns: ArchitecturePattern[] = [];

    // Categorize nodes by type and capacity
    const llmNodes = nodes.filter(n => n.type === 'llmNode');
    const mcpNodes = nodes.filter(n => n.type === 'mcpNode');

    const lightLLMs = llmNodes.filter(n => getNodeBurnRate(n) < 1000);
    const heavyLLMs = llmNodes.filter(n => getNodeBurnRate(n) >= 4000);

    // Pattern 1: Router (Light → 2+ Heavy)
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

    // Pattern 2: Distillation (Heavy → Light)
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

    // Pattern 3: Autonomous Agent (Heavy → 2+ MCP)
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

// Pattern Label Component
const PatternLabel = ({ pattern }: { pattern: ArchitecturePattern }) => {
    const colorMap = {
        router: 'from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-700 dark:text-blue-300',
        distillation: 'from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-700 dark:text-purple-300',
        autonomous: 'from-emerald-500/20 to-green-500/20 border-emerald-400/30 text-emerald-700 dark:text-emerald-300'
    };

    const iconMap = {
        router: GitBranch,
        distillation: ArrowRight,
        autonomous: Brain
    };

    const Icon = iconMap[pattern.type];

    return (
        <div
            className="absolute pointer-events-none z-50 animate-in fade-in zoom-in duration-500"
            style={{
                left: `${pattern.position.x}px`,
                top: `${pattern.position.y}px`,
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full
                bg-gradient-to-r ${colorMap[pattern.type]}
                border backdrop-blur-md shadow-lg
                text-xs font-bold uppercase tracking-wide
            `}>
                <Icon className="w-3.5 h-3.5" />
                <span>{pattern.label}</span>
            </div>
        </div>
    );
};

// ============================================
// SIDEBAR COMPONENT
// ============================================
const NodeDetailSidebar = ({
    node,
    setNodes,
    setEdges,
    onClose,
    models
}: {
    node: Node | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    onClose: () => void;
    models: any[]
}) => {
    if (!node) return null;

    const updateNodeData = (key: string, value: any) => {
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            [key]: value,
                        },
                    };
                }
                return n;
            })
        );
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const deleteNode = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        setNodes((nds) => nds.filter(n => n.id !== node.id));
        setEdges((eds) => eds.filter(e => e.source !== node.id && e.target !== node.id));
        setShowDeleteConfirm(false);
        onClose();
    };

    const EntityTypeDropdown = () => {
        const currentEntityType = node.data.entityType as string;
        const entityTypes = ['LLM Agent', 'MCP Server', 'Client Interface', 'System Error', 'Database', 'Storage'];

        const handleEntityTypeChange = (newEntityType: string) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === node.id) {
                        let newNodeType = n.type;
                        if (newEntityType === 'LLM Agent') {
                            newNodeType = 'llmNode';
                        } else if (newEntityType === 'MCP Server' || newEntityType === 'Database' || newEntityType === 'Storage') {
                            newNodeType = 'mcpNode';
                        } else if (newEntityType === 'Client Interface') {
                            newNodeType = 'clientNode';
                        } else if (newEntityType === 'System Error') {
                            newNodeType = 'errorNode';
                        }

                        return {
                            ...n,
                            type: newNodeType,
                            data: { ...n.data, entityType: newEntityType },
                        };
                    }
                    return n;
                })
            );
        };

        return (
            <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider block">
                    Entity Type
                </label>
                <select
                    value={currentEntityType}
                    onChange={(e) => handleEntityTypeChange(e.target.value)}
                    className="w-full text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {entityTypes.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    const ModelDropdown = () => {
        const currentModel = (node.data.modelId as string) || '';
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = React.useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const selectedModelData = models.find(m => m.id === currentModel);
        const displayLabel = selectedModelData
            ? (selectedModelData.name || selectedModelData.id.split('/').pop())
            : 'Select a Model';

        const groupedModels = useMemo(() => {
            const groups: Record<string, any[]> = {};
            models.slice(0, 100).forEach((m: any) => {
                const provider = m.id.split('/')[0] || 'other';
                if (!groups[provider]) groups[provider] = [];
                groups[provider].push(m);
            });
            return groups;
        }, [models]);

        return (
            <div className="mb-4 relative z-50">
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        Model Selection
                    </div>
                </label>

                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full text-left text-sm bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border transition-all duration-200 ${isOpen ? 'border-blue-500/50 ring-4 ring-blue-500/10 rounded-t-2xl rounded-b-none z-20' : 'border-gray-200/60 dark:border-gray-700/60 rounded-2xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50'} px-4 py-3 flex items-center justify-between group`}
                    >
                        <span className="font-medium text-gray-700 dark:text-gray-200 truncate pr-2">
                            {displayLabel}
                        </span>
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 w-full max-h-[300px] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-x border-b border-gray-200/60 dark:border-gray-700/60 rounded-b-2xl shadow-xl shadow-gray-200/20 dark:shadow-black/20 origin-top animate-in fade-in zoom-in-[0.98] duration-200 z-[100] custom-scrollbar">
                            {Object.entries(groupedModels).map(([provider, providerModels]) => (
                                <div key={provider}>
                                    <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-700/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {provider}
                                    </div>
                                    <div className="p-2 space-y-0.5">
                                        {providerModels.map((m: any) => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    updateNodeData('modelId', m.id);
                                                    updateNodeData('cost', parseFloat(m.pricing.prompt));
                                                    updateNodeData('provider', provider);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group/item ${currentModel === m.id ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                            >
                                                <span className="truncate">{m.name || m.id.split('/').pop()}</span>
                                                {currentModel === m.id && <Check className="w-4 h-4 text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const DetailItem = ({ label, value, mono = false, icon: Icon }: any) => (
        <div className="mb-5 group">
            <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
            </h3>
            <div className={`text-sm text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-100 dark:border-gray-700/30 rounded-xl px-4 py-3 transition-all duration-200 group-hover:bg-white dark:group-hover:bg-gray-800/50 group-hover:border-gray-200 dark:group-hover:border-gray-600/50 ${mono ? 'font-mono text-xs tracking-tight' : 'font-medium'}`}>
                {value}
            </div>
        </div>
    );

    const renderDetails = () => {
        const entityType = node.data.entityType as string;

        if (entityType === 'LLM Agent') {
            return (
                <div className="space-y-1">
                    <EntityTypeDropdown />
                    <ModelDropdown />
                    <DetailItem label="Provider" value={node.data.provider} />
                    <DetailItem label="System Prompt" value={node.data.systemPrompt} />
                </div>
            );
        }

        if (entityType === 'MCP Server' || entityType === 'Database' || entityType === 'Storage') {
            return (
                <div className="space-y-1">
                    <EntityTypeDropdown />
                    <DetailItem label="Type" value={entityType} />
                    <DetailItem label="Tools" value={(node.data as any).tools?.join(', ')} mono={true} />
                </div>
            );
        }

        if (entityType === 'Client Interface') {
            return (
                <div className="space-y-1">
                    <EntityTypeDropdown />
                    <DetailItem label="Transport" value={node.data.transport} mono={true} icon={Terminal} />
                    <DetailItem label="Environment" value={String(node.data.env || 'USER=developer')} mono={true} />
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <div className="md:hidden fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="fixed md:right-6 md:top-24 md:bottom-6 md:w-96 md:h-auto md:rounded-[32px] md:translate-y-0 bottom-0 left-0 right-0 h-[85vh] rounded-t-[32px] w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl z-[60] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5 animate-in slide-in-from-bottom-full md:slide-in-from-right-4 duration-300 md:duration-300 ease-out">
                <div className="px-6 py-5 flex items-start gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0">
                        {((node.data.entityType as string) === 'LLM Agent' || !node.data.entityType) && <Brain className="w-5 h-5" />}
                        {node.data.entityType === 'MCP Server' && <Plug className="w-5 h-5" />}
                        {node.data.entityType === 'Client Interface' && <Monitor className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={(node.data as any).label}
                                    onChange={(e) => updateNodeData('label', e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500/50 rounded-lg pl-3 pr-8 py-1.5 text-sm font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-inner"
                                />
                                <Pencil className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-gray-500 backdrop-blur-sm shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {renderDetails()}
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-sm border-t border-gray-100/10 dark:border-gray-800/10 space-y-4">
                    <button onClick={deleteNode} className="w-full h-12 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl transition-all duration-200 font-semibold text-sm border border-red-500/10 active:scale-[0.98]">
                        <span className="text-lg">🗑️</span>
                        <span>Delete Entity</span>
                    </button>
                </div>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete "{String(node.data.label)}"?</h3>
                            </div>
                            <div className="flex">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-r border-gray-100 dark:border-gray-800">Cancel</button>
                                <button onClick={confirmDelete} className="flex-1 px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// ============================================
// NODES & TYPES
// ============================================

const TechnicalNode = ({ icon: Icon, label, subLabel, colorClass, selected, type = 'source', badge = null }: any) => {
    return (
        <div className={`min-w-[180px] bg-white dark:bg-gray-950 border rounded-lg shadow-sm transition-all duration-200 relative ${selected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)] dark:border-blue-400' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
            {badge && <div className="absolute -top-2.5 -right-2 z-10">{badge}</div>}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-t-lg">
                <Icon className={`w-4 h-4 ${colorClass}`} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>
            </div>
            <div className="px-3 py-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{subLabel}</div>
            </div>
            {(type === 'target' || type === 'both') && <Handle type="target" position={Position.Top} className="!bg-gray-400 !border-2 !border-white dark:!border-gray-950 !w-3 !h-3" />}
            {(type === 'source' || type === 'both') && <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !border-2 !border-white dark:!border-gray-950 !w-3 !h-3" />}
        </div>
    );
};

const LLMNode = ({ data, selected }: NodeProps) => {
    let Icon = Cpu;
    let colorClass = 'text-purple-500';
    if (data.provider === 'Google') colorClass = 'text-blue-500';
    else if (data.provider === 'OpenAI') colorClass = 'text-green-500';
    else if (data.provider === 'Anthropic') colorClass = 'text-orange-500';

    const ConsumptionBadge = (
        <div className="flex flex-col items-end gap-1">
            {data.userHasFreeTier && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span>Free</span>
                </div>
            )}
        </div>
    );

    return <TechnicalNode icon={Icon} label={data.shortName} subLabel={data.modelId} colorClass={colorClass} selected={selected} type="both" badge={ConsumptionBadge} />;
};

const MCPNode = ({ data, selected }: NodeProps) => (
    <TechnicalNode icon={Plug} label={data.shortName} subLabel="MCP Server" colorClass="text-emerald-500 dark:text-emerald-400" selected={selected} type="both" />
);

const ClientNode = ({ data, selected }: NodeProps) => (
    <TechnicalNode icon={Monitor} label={data.shortName} subLabel="Terminal / UI" colorClass="text-blue-600 dark:text-blue-400" selected={selected} type="source" />
);

const ErrorNode = ({ data, selected }: NodeProps) => (
    <TechnicalNode icon={AlertTriangle} label="Error" subLabel={data.message || 'Connection Failed'} colorClass="text-red-500" selected={selected} type="target" />
);

const nodeTypes: NodeTypes = {
    llmNode: LLMNode,
    mcpNode: MCPNode,
    clientNode: ClientNode,
    errorNode: ErrorNode,
};

// ============================================
// HELPERS & INITIAL DATA
// ============================================

const getNodeTypeFromEntity = (entityType: string): string => {
    if (entityType === 'LLM Agent') return 'llmNode';
    if (entityType === 'MCP Server' || entityType === 'Database' || entityType === 'Storage') return 'mcpNode';
    if (entityType === 'Client Interface') return 'clientNode';
    if (entityType === 'System Error') return 'errorNode';
    return 'llmNode';
};

const getDefaultDataForEntity = (entityType: string): any => {
    switch (entityType) {
        case 'LLM Agent': return { label: 'New Agent', shortName: 'Agent', entityType: 'LLM Agent', provider: 'OpenAI', modelId: 'gpt-4' };
        case 'MCP Server': return { label: 'New MCP Server', shortName: 'MCP', entityType: 'MCP Server', tools: ['read', 'write'] };
        case 'Client Interface': return { label: 'New Client', shortName: 'Client', entityType: 'Client Interface', transport: 'WebSocket' };
        default: return { label: 'New Node', entityType };
    }
};

const initialNodes: Node[] = [
    // Level 1: User Entry (Center)
    {
        id: 'user',
        type: 'clientNode',
        data: {
            label: 'Developer',
            shortName: 'User',
            icon: 'User',
            entityType: 'Client Interface',
            transport: 'VS Code',
            env: 'ACTIVE_SESSION',
        },
        position: { x: 400, y: 0 },
    },

    // Level 2: Triggers / Entry Agents
    // Column 1: Dev (Analyze)
    {
        id: 'agent-analyze',
        type: 'llmNode',
        data: {
            label: 'Analyze Changes',
            shortName: 'Analyze',
            entityType: 'LLM Agent',
            provider: 'Gemini',
            modelId: 'gemini-1.5-pro',
            systemPrompt: 'Analyzes git diffs and context to propose commit strategies.',
        },
        position: { x: 100, y: 200 },
    },
    // Column 2: Release (Start)
    {
        id: 'agent-release',
        type: 'llmNode',
        data: {
            label: 'Start Release',
            shortName: 'Release Manager',
            entityType: 'LLM Agent',
            provider: 'Anthropic',
            modelId: 'claude-3-haiku',
            systemPrompt: 'Orchestrates production deployment workflows.',
        },
        position: { x: 400, y: 200 },
    },
    // Column 3: Content (Interview)
    {
        id: 'agent-interview',
        type: 'llmNode',
        data: {
            label: 'Portfolio Interview',
            shortName: 'Interviewer',
            entityType: 'LLM Agent',
            provider: 'Anthropic',
            modelId: 'claude-3-haiku',
            systemPrompt: 'Interactively gathers project info via natural language.',
        },
        position: { x: 700, y: 200 },
    },

    // Level 3: Workers / Processors
    // Column 1: Dev (Commit)
    {
        id: 'worker-commit',
        type: 'llmNode',
        data: {
            label: 'Commit Flow',
            shortName: 'Git Ops',
            entityType: 'LLM Agent',
            provider: 'Anthropic',
            modelId: 'claude-3-haiku',
            systemPrompt: 'Executes git commands: add, commit, push, history-update.',
            capacityCategory: 'heavy',
        },
        position: { x: 100, y: 450 },
    },
    // Column 2: Release (Deploy)
    {
        id: 'worker-deploy',
        type: 'llmNode',
        data: {
            label: 'Deploy Prod',
            shortName: 'Deployer',
            entityType: 'LLM Agent',
            provider: 'Anthropic',
            modelId: 'claude-3-haiku',
            systemPrompt: 'Manages critical main branch merges and Vercel deployments.',
            capacityCategory: 'heavy',
        },
        position: { x: 400, y: 450 },
    },
    // Column 3: Content (Update)
    {
        id: 'worker-update',
        type: 'llmNode',
        data: {
            label: 'Portfolio Update',
            shortName: 'Content Ops',
            entityType: 'LLM Agent',
            provider: 'Google',
            modelId: 'gemini-1.5-pro',
            systemPrompt: 'Updates JSON data files with structured project info.',
        },
        position: { x: 700, y: 450 },
    },

    // Level 4: Services & Tools (MCP)
    // Dev Stream Tools
    {
        id: 'mcp-github',
        type: 'mcpNode',
        data: {
            label: 'GitHub Integration',
            shortName: 'MCP GitHub',
            entityType: 'MCP Server',
            tools: ['create_pr', 'push', 'merge'],
            resources: 'Repository',
        },
        position: { x: 50, y: 700 }, // Slightly left to allow room for logger
    },
    {
        id: 'service-logger',
        type: 'llmNode',
        data: {
            label: 'Obsidian Logger',
            shortName: 'Logger',
            entityType: 'LLM Agent',
            provider: 'Anthropic',
            modelId: 'claude-3-haiku',
            systemPrompt: 'Generates markdown logs for Obsidian vault.',
        },
        position: { x: 250, y: 700 }, // Center-Left, listening to dev/release
    },

    // Content Stream Tools
    {
        id: 'mcp-fs',
        type: 'mcpNode',
        data: {
            label: 'FileSystem',
            shortName: 'MCP FS',
            entityType: 'MCP Server',
            tools: ['read_file', 'write_file', 'list_dir'],
            resources: 'Local Files',
        },
        position: { x: 600, y: 700 },
    },
    {
        id: 'mcp-obsidian',
        type: 'mcpNode',
        data: {
            label: 'Obsidian Vault',
            shortName: 'MCP Obsidian',
            entityType: 'Storage',
            tools: ['create_note', 'append'],
            resources: 'Log Entry',
        },
        position: { x: 800, y: 700 },
    },
];

const rawEdges: Edge[] = [
    // User -> Triggers
    { id: 'e-u-1', source: 'user', target: 'agent-analyze', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e-u-2', source: 'user', target: 'agent-release', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e-u-3', source: 'user', target: 'agent-interview', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },

    // Triggers -> Workers
    { id: 'e-t-1', source: 'agent-analyze', target: 'worker-commit', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e-t-2', source: 'agent-release', target: 'worker-deploy', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e-t-3', source: 'agent-interview', target: 'worker-update', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },

    // Workers -> Services/Tools
    { id: 'e-w-1', source: 'worker-commit', target: 'mcp-github', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },
    { id: 'e-w-2', source: 'worker-deploy', target: 'mcp-github', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },
    { id: 'e-w-3', source: 'worker-update', target: 'mcp-fs', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },

    // Logger Connections (Cross-cutting)
    { id: 'e-l-1', source: 'worker-commit', target: 'service-logger', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.5, strokeDasharray: '5,5' } },
    { id: 'e-l-2', source: 'worker-deploy', target: 'service-logger', animated: true, style: { stroke: '#a855f7', strokeWidth: 1.5, strokeDasharray: '5,5' } },
    { id: 'e-l-3', source: 'service-logger', target: 'mcp-obsidian', animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function MigratedFlowDiagram() {

    // State initialization
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Hooks & Analysis
    const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
    const { models, breakpoints, loading: modelsLoading } = useModelData();
    const detectedPatterns = useMemo(() => analyzeArchitecture(nodes, edges), [nodes, edges]);

    // Helpers
    const getEdgeStyle = useCallback((modelId: string | undefined): any => {
        if (!modelId || !breakpoints || models.length === 0) return { strokeWidth: 2, className: '' };
        const model = models.find((m: any) => m.id === modelId);
        if (!model) return { strokeWidth: 2, className: '' };
        const price = parseFloat(model.pricing.prompt);
        if (price < breakpoints.low) return { strokeWidth: 1, className: 'edge-light' };
        if (price > breakpoints.high) return { strokeWidth: 5, className: 'edge-heavy' };
        return { strokeWidth: 2.5, className: '' };
    }, [models, breakpoints]);

    const resolveNodeType = useCallback((node: Node | undefined) => {
        if (!node) return 'unknown';
        const entityType = node.data.entityType as string;
        if (entityType === 'LLM Agent') return 'llmNode';
        if (entityType === 'MCP Server' || entityType === 'Database' || entityType === 'Storage') return 'mcpNode';
        if (entityType === 'Client Interface') return 'clientNode';
        if (entityType === 'System Error') return 'errorNode';
        return node.type;
    }, []);

    const validateConnection = useCallback((sourceNode: Node, targetNode: Node) => {
        const sourceType = resolveNodeType(sourceNode);
        const targetType = resolveNodeType(targetNode);
        let style: React.CSSProperties = { stroke: '#3b82f6', strokeWidth: 2 };
        let animated = true;
        let className = '';

        if (sourceType === 'llmNode') {
            const dynamicStyle = getEdgeStyle(sourceNode.data.modelId as string);
            style.strokeWidth = dynamicStyle.strokeWidth;
            className = dynamicStyle.className;
        }

        const isClientToMCP = sourceType === 'clientNode' && targetType === 'mcpNode';
        const isMCPToClient = sourceType === 'mcpNode' && targetType === 'clientNode';
        const isMCPToMCP = sourceType === 'mcpNode' && targetType === 'mcpNode';
        const isClientToClient = sourceType === 'clientNode' && targetType === 'clientNode';
        const isErrorNode = sourceType === 'errorNode' || targetType === 'errorNode';

        if (isErrorNode || isClientToMCP || isMCPToClient || isMCPToMCP || isClientToClient) {
            style = { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '0' };
            animated = false;
        } else if (sourceType === 'mcpNode' || targetType === 'mcpNode') {
            if (sourceType === 'llmNode') {
                const dynamicStyle = getEdgeStyle(sourceNode.data.modelId as string);
                style = { stroke: '#22c55e', strokeWidth: dynamicStyle.strokeWidth };
                className = dynamicStyle.className;
            } else {
                style = { stroke: '#22c55e', strokeWidth: 2 };
            }
        }
        return { style, animated, className };
    }, [resolveNodeType, getEdgeStyle]);

    // Handlers
    const onConnect = useCallback((params: Connection) => {
        const sourceNode = nodes.find((n) => n.id === params.source);
        const targetNode = nodes.find((n) => n.id === params.target);
        if (!sourceNode || !targetNode) return;
        const validationProps = validateConnection(sourceNode, targetNode);
        setEdges((eds) => addEdge({ ...params, ...validationProps }, eds));
    }, [setEdges, nodes, validateConnection]);

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const [showAddMenu, setShowAddMenu] = useState(false);
    const addNode = useCallback((entityType: string) => {
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: getNodeTypeFromEntity(entityType),
            position: { x: 400, y: 300 },
            data: getDefaultDataForEntity(entityType)
        };
        setNodes((nds) => [...nds, newNode]);
        setShowAddMenu(false);
    }, [setNodes]);

    return (
        <>
            <style jsx global>{`
                body.source-is-client .react-flow__node-llmNode { animation: pulse-green 1.5s infinite; box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); }
                body.source-is-client .react-flow__node-mcpNode { opacity: 0.5; filter: grayscale(1); }
                body.source-is-agent .react-flow__node-llmNode, body.source-is-agent .react-flow__node-mcpNode { animation: pulse-blue 1.5s infinite; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
                .edge-heavy .react-flow__edge-path { animation-duration: 3s !important; filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.6)); stroke-linecap: round; }
                .edge-light .react-flow__edge-path { animation-duration: 0.5s !important; stroke-dasharray: 4; filter: drop-shadow(0px 0px 2px rgba(34, 197, 94, 0.3)); }
                @keyframes pulse-blue { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
                @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
            `}</style>

            <div className={`relative bg-gray-50 dark:bg-gray-900 overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'w-full h-[600px] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg'}`}>
                {/* Fullscreen Toggle */}
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="absolute top-4 left-4 z-50 p-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-700 dark:text-gray-200 hover:scale-110 active:scale-95 group"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                {/* Add Entity Button */}
                <div className="absolute top-4 right-4 z-50">
                    <div className="relative">
                        <button
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-900/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-sm text-gray-900 dark:text-gray-100 hover:scale-105 active:scale-95"
                        >
                            <span className={`text-base transition-transform duration-300 ${showAddMenu ? 'rotate-45' : ''}`}>+</span>
                            <span>Add</span>
                        </button>
                        {showAddMenu && (
                            <div className="absolute top-full right-0 mt-3 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200">
                                {['LLM Agent', 'MCP Server', 'Client Interface', 'Database', 'Storage'].map((type, idx) => (
                                    <button
                                        key={type}
                                        onClick={() => addNode(type)}
                                        className={`w-full text-left px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 ${idx !== 0 ? 'border-t border-gray-100/50 dark:border-gray-800/50' : ''}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {modelsLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">Loading models...</span>
                    </div>
                )}

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
                >
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="bg-gray-50 dark:bg-gray-900" />

                    {/* Render Pattern Labels */}
                    {detectedPatterns.map((pattern, idx) => (
                        <PatternLabel key={`pattern-${pattern.type}-${idx}`} pattern={pattern} />
                    ))}

                    <Controls className="!bg-gray-900/90 !border-gray-800 shadow-xl rounded-xl overflow-hidden [&>button]:!bg-transparent [&>button]:!border-gray-800 [&>button]:!text-gray-200 hover:[&>button]:!bg-gray-800 [&>button>svg]:!fill-current" position="bottom-left" />
                </ReactFlow>

                <NodeDetailSidebar
                    node={selectedNode}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    onClose={() => setSelectedNodeId(null)}
                    models={models}
                />
            </div>
        </>
    );
}
