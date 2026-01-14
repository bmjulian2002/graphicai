'use client';

/**
 * FlowDiagram Component - Migrated from migracion.tsx
 * Complete React Flow implementation with custom nodes, pattern detection, and sidebar
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
import {
    X, Cpu, User, GitBranch, Terminal, AlertTriangle, Zap, ArrowRight, Check,
    Brain, Plug, Monitor, Pencil, Maximize2, Minimize2, Save, Loader2
} from 'lucide-react';

// ============================================
// TYPES
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

interface ArchitecturePattern {
    type: 'router' | 'distillation' | 'autonomous';
    label: string;
    nodeIds: string[];
    position: { x: number; y: number };
}

// ============================================
// HOOK: useModelData
// ============================================

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
// TOPOLOGY ANALYSIS
// ============================================

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

const analyzeArchitecture = (nodes: Node[], edges: Edge[]): ArchitecturePattern[] => {
    const patterns: ArchitecturePattern[] = [];

    const llmNodes = nodes.filter(n => n.type === 'llmNode');
    const mcpNodes = nodes.filter(n => n.type === 'mcpNode');

    const lightLLMs = llmNodes.filter(n => getNodeBurnRate(n) < 1000);
    const heavyLLMs = llmNodes.filter(n => getNodeBurnRate(n) >= 4000);

    // Pattern 1: Router
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

    // Pattern 2: Distillation
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

    // Pattern 3: Autonomous Agent
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
// CUSTOM NODE TYPES
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data as any).userHasFreeTier && (
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
// SIDEBAR COMPONENT (Simplified for brevity)
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
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tipo: {String((node.data as any).entityType || 'Unknown')}
                    </div>
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
// MAIN COMPONENT
// ============================================

interface FlowDiagramProps {
    flowId: string;
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
}

export default function FlowDiagram({ flowId, initialNodes = [], initialEdges = [], onSave }: FlowDiagramProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [saving, setSaving] = useState(false);

    const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
    const { models, breakpoints, loading: modelsLoading } = useModelData();
    const detectedPatterns = useMemo(() => analyzeArchitecture(nodes, edges), [nodes, edges]);

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const [showAddMenu, setShowAddMenu] = useState(false);
    const addNode = useCallback((entityType: string) => {
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: entityType === 'LLM Agent' ? 'llmNode' : entityType === 'MCP Server' ? 'mcpNode' : entityType === 'Client Interface' ? 'clientNode' : 'errorNode',
            position: { x: 400, y: 300 },
            data: { label: `New ${entityType}`, shortName: entityType.split(' ')[0], entityType }
        };
        setNodes((nds) => [...nds, newNode]);
        setShowAddMenu(false);
    }, [setNodes]);

    const handleSave = async () => {
        if (!onSave) return;
        setSaving(true);
        try {
            await onSave(nodes, edges);
        } catch (error) {
            console.error('Error saving flow:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <style jsx global>{`
                .edge-heavy .react-flow__edge-path { animation-duration: 3s !important; filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.6)); stroke-linecap: round; }
                .edge-light .react-flow__edge-path { animation-duration: 0.5s !important; stroke-dasharray: 4; filter: drop-shadow(0px 0px 2px rgba(34, 197, 94, 0.3)); }
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

                {/* Save Button */}
                {onSave && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="absolute top-4 left-20 z-50 flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="text-sm font-medium">{saving ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                )}

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
