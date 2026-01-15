import React, { useState, useEffect, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
    Terminal, Zap, X, Brain, Plug, Monitor, Database, Box, AlertTriangle,
    Pencil, Cpu, Check, ArrowRight, GitBranch
} from 'lucide-react';
import { ModelData } from '../types';

interface NodeDetailSidebarProps {
    node: Node | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    onClose: () => void;
    models: ModelData[];
}

export const NodeDetailSidebar = ({
    node,
    setNodes,
    setEdges,
    onClose,
    models
}: NodeDetailSidebarProps) => {
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
        const types = ['LLM Agent', 'MCP Server', 'Client Interface', 'Database', 'Storage'];
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

        const handleEntityTypeChange = (newEntityType: string) => {
            updateNodeData('entityType', newEntityType);

            // Reset type-specific data
            const newType = newEntityType === 'LLM Agent' ? 'llmNode' :
                newEntityType === 'Client Interface' ? 'clientNode' :
                    (newEntityType === 'MCP Server' || newEntityType === 'Database' || newEntityType === 'Storage') ? 'mcpNode' : 'llmNode';

            setNodes((nds) => nds.map((n) => {
                if (n.id === node.id) {
                    return { ...n, type: newType };
                }
                return n;
            }));

            setIsOpen(false);
        };

        return (
            <div className="mb-6 relative z-50" ref={dropdownRef}>
                <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Entity Type
                </h3>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between text-sm text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-100 dark:border-gray-700/30 rounded-xl px-4 py-3 hover:bg-white dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-600/50 transition-all duration-200"
                >
                    <span className="font-medium">{node.data.entityType as string}</span>
                    <span className="text-xs text-gray-400">Change</span>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                        {types.map((type) => (
                            <button
                                key={type}
                                onClick={() => handleEntityTypeChange(type)}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                ${type === node.data.entityType ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/10' : 'text-gray-600 dark:text-gray-300'}
                                `}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                )}
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

        const findCheaperAlternative = useMemo(() => {
            if (!selectedModelData || !selectedModelData.pricing) return null;

            const currentCost = parseFloat(selectedModelData.pricing.prompt) || 0;
            if (currentCost < 5) return null;

            const provider = selectedModelData.id.split('/')[0];

            const alternatives = models.filter(m => {
                const cost = parseFloat(m.pricing?.prompt) || 0;
                return cost > 0 && cost < (currentCost * 0.5);
            });

            const sameProviderAlt = alternatives.find(m => m.id.includes(provider) && (m.id.includes('haiku') || m.id.includes('flash') || m.id.includes('turbo')));

            if (sameProviderAlt) return sameProviderAlt;

            const popularEfficient = alternatives.find(m =>
                m.id.includes('gemini-1.5-flash') ||
                m.id.includes('claude-3-haiku') ||
                m.id.includes('gpt-3.5-turbo')
            );

            return popularEfficient || null;
        }, [selectedModelData, models]);

        const suggestion = findCheaperAlternative;

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
            <div className="mb-6" ref={dropdownRef}>
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        AI Model
                    </span>
                    {!isOpen && suggestion && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full cursor-help flex items-center gap-1 ring-1 ring-green-500/20" title="Cheaper alternative available">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            Smart Pick
                        </span>
                    )}
                </label>

                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full text-left text-sm 
                        bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm
                        border transition-all duration-200
                        ${isOpen
                                ? 'border-blue-500/50 ring-4 ring-blue-500/10 rounded-t-2xl rounded-b-none z-20'
                                : 'border-gray-200/60 dark:border-gray-700/60 rounded-2xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                            }
                        px-4 py-3 flex items-center justify-between group`}
                    >
                        <span className="font-medium text-gray-700 dark:text-gray-200 truncate pr-2">
                            {displayLabel}
                        </span>
                        <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-gray-500'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 w-full max-h-[300px] overflow-y-auto 
                            bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
                            border-x border-b border-gray-200/60 dark:border-gray-700/60 
                            rounded-b-2xl shadow-xl shadow-gray-200/20 dark:shadow-black/20 origin-top animate-in fade-in zoom-in-[0.98] duration-200
                            z-[100]
                        ">
                            {suggestion && (
                                <div
                                    onClick={() => {
                                        updateNodeData('modelId', suggestion.id);
                                        updateNodeData('cost', parseFloat(suggestion.pricing.prompt));
                                        updateNodeData('provider', suggestion.id.split('/')[0]);
                                        setIsOpen(false);
                                    }}
                                    className="sticky top-0 z-20 m-2 p-3 rounded-xl border border-green-500/20 bg-green-50/50 dark:bg-green-500/10 cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-500/20 transition-all group/banner"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 p-1.5 bg-green-500/20 rounded-full text-green-600 dark:text-green-400">
                                            <Zap className="w-3.5 h-3.5 fill-current" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-tight mb-0.5">
                                                Recommended
                                            </h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">
                                                Switch to <strong className="text-green-700 dark:text-green-400 font-bold">{suggestion.name || suggestion.id.split('/').pop()}</strong> to save &gt;50%.
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-green-500/70 -translate-x-2 opacity-0 group-hover/banner:opacity-100 group-hover/banner:translate-x-0 transition-all duration-300" />
                                    </div>
                                </div>
                            )}

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
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group/item
                                            ${currentModel === m.id
                                                        ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20'
                                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                    }`}
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

    const ComplexityControl = () => {
        const complexityMap = { 'simple': 0, 'medium': 1, 'complex': 2 };
        const reverseMap = ['simple', 'medium', 'complex'];
        const currentComplexity = (node.data.taskComplexity as string) || 'simple';
        const sliderValue = complexityMap[currentComplexity as keyof typeof complexityMap] || 0;

        const isFree = (node.data.userHasFreeTier as boolean) || false;

        return (
            <div className="mb-8 space-y-6 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                <div className="group">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5" />
                            Task Complexity
                        </h3>
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full ring-1 ring-blue-500/20">
                            {['1x', '3x', '10x'][sliderValue]} Multiplier
                        </span>
                    </div>

                    <div className="relative pt-1 px-1">
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="1"
                            value={sliderValue}
                            onChange={(e) => updateNodeData('taskComplexity', reverseMap[parseInt(e.target.value)])}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-all"
                        />
                        <div className="flex justify-between mt-3 text-[10px] font-medium uppercase tracking-wide">
                            <span className={`transition-colors duration-200 ${sliderValue === 0 ? 'text-blue-600 dark:text-blue-400 font-bold scale-110' : 'text-gray-400'}`}>Simple</span>
                            <span className={`transition-colors duration-200 ${sliderValue === 1 ? 'text-blue-600 dark:text-blue-400 font-bold scale-110' : 'text-gray-400'}`}>Medium</span>
                            <span className={`transition-colors duration-200 ${sliderValue === 2 ? 'text-blue-600 dark:text-blue-400 font-bold scale-110' : 'text-gray-400'}`}>Complex</span>
                        </div>
                    </div>
                </div>

                <div className="group">
                    <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        Billing Mode
                    </h3>
                    <div className="bg-gray-200/50 dark:bg-black/40 p-1 rounded-xl flex relative">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 shadow-sm rounded-lg transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                            ${isFree ? 'left-[calc(50%+2px)] translate-x-0' : 'left-1'}`}
                        />

                        <button
                            onClick={() => updateNodeData('userHasFreeTier', false)}
                            className={`flex-1 relative z-10 py-2 text-xs font-semibold text-center rounded-lg transition-colors
                            ${!isFree ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => updateNodeData('userHasFreeTier', true)}
                            className={`flex-1 relative z-10 py-2 text-xs font-semibold text-center rounded-lg transition-colors flex items-center justify-center gap-1.5
                            ${isFree ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                        >
                            <span>Free Tier</span>
                            {isFree && <Zap className="w-3 h-3 fill-current animate-pulse" />}
                        </button>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">
                            {isFree ? 'Zero cost estimation applied' : 'Standard market rates applied'}
                        </span>
                    </div>
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
            <div className={`
                text-sm text-gray-700 dark:text-gray-200 
                bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm
                border border-gray-100 dark:border-gray-700/30
                rounded-xl px-4 py-3
                transition-all duration-200 group-hover:bg-white dark:group-hover:bg-gray-800/50 group-hover:border-gray-200 dark:group-hover:border-gray-600/50
                ${mono ? 'font-mono text-xs tracking-tight' : 'font-medium'}
            `}>
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

                    <ComplexityControl />

                    <div className="mb-5 group">
                        <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                            System Prompt
                        </h3>
                        <textarea
                            value={String(node.data.systemPrompt || '')}
                            onChange={(e) => updateNodeData('systemPrompt', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="w-full text-sm text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-100 dark:border-gray-700/30 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-white dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-none min-h-[100px]"
                            placeholder="Enter system prompt..."
                        />
                    </div>
                    <DetailItem label="Cost / 1M" value={(() => {
                        const rawCost = node.data.cost as string | number;
                        let costNum = typeof rawCost === 'string' ? parseFloat(rawCost) : rawCost;
                        if (isNaN(costNum)) return 'Unknown';
                        if (costNum < 0.01 && costNum > 0) costNum = costNum * 1_000_000;
                        return `$${costNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
                    })()} mono={true} />
                </div>
            );
        }

        if (entityType === 'MCP Server' || entityType === 'Database' || entityType === 'Storage') {
            return (
                <div className="space-y-1">
                    <EntityTypeDropdown />

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Server Type</h3>
                        <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md px-3 py-2.5">
                            {entityType}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Available Tools</h3>
                        <div className="flex flex-wrap gap-2">
                            {(node.data as any).tools?.map((tool: string, idx: number) => (
                                <span key={idx} className="text-xs font-mono bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/30">
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </div>

                    <DetailItem label="Resources" value={(node.data as any).resources || 'N/A'} />

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span>Active</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (entityType === 'Client Interface') {
            return (
                <div className="space-y-1">
                    <EntityTypeDropdown />

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Interface Type</h3>
                        <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md px-3 py-2.5">
                            Terminal
                        </div>
                    </div>

                    <DetailItem label="Transport" value={node.data.transport} mono={true} icon={Terminal} />
                    <DetailItem label="Session ID" value={(node.data as any).sessionId || 'dev-session-01'} mono={true} />

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Environment</h3>
                        <div className="text-xs font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md px-3 py-2.5 whitespace-pre-wrap">
                            {String(node.data.env || 'USER=developer\nSESSION_ID=dev-01')}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span>Connected</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (entityType === 'System Error') {
            return (
                <div className="space-y-1">
                    <EntityTypeDropdown />

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Error Type</h3>
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-md px-3 py-2.5 font-medium">
                            Protocol Violation
                        </div>
                    </div>

                    <DetailItem label="Error Code" value="MCP_DIRECT_CONNECTION" mono={true} />
                    <DetailItem label="Message" value={node.data.message || 'Direct MCP connections are not allowed'} />

                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-md text-xs text-red-600 dark:text-red-400">
                        <strong>Suggested Fix:</strong>
                        <ul className="mt-2 ml-4 list-disc space-y-1">
                            <li>Add an LLM Agent between Client and MCP Server</li>
                            <li>Route through Orchestrator</li>
                        </ul>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <div
                className="md:hidden fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="fixed md:right-6 md:top-24 md:bottom-6 md:w-96 md:h-auto md:rounded-[32px] md:translate-y-0 bottom-0 left-0 right-0 h-[85vh] rounded-t-[32px] w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl z-[60] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5 animate-in slide-in-from-bottom-full md:slide-in-from-right-4 duration-300 md:duration-300 ease-out">
                <div className="md:hidden w-full flex items-center justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                </div>
                <div className="px-6 py-5 flex items-start gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0">
                        {((node.data.entityType as string) === 'LLM Agent' || !node.data.entityType) && <Brain className="w-5 h-5" />}
                        {node.data.entityType === 'MCP Server' && <Plug className="w-5 h-5" />}
                        {node.data.entityType === 'Client Interface' && <Monitor className="w-5 h-5" />}
                        {node.data.entityType === 'Database' && <Database className="w-5 h-5" />}
                        {node.data.entityType === 'Storage' && <Box className="w-5 h-5" />}
                        {node.data.entityType === 'System Error' && <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={(node.data as any).label}
                                    onChange={(e) => updateNodeData('label', e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500/50 rounded-lg pl-3 pr-8 py-1.5 text-sm font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-inner"
                                    placeholder="Node Name"
                                />
                                <Pencil className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors text-gray-500 backdrop-blur-sm shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                            {String(node.data.entityType || 'Entity')}
                        </p>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {renderDetails()}
                </div>

                <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-sm border-t border-gray-100/10 dark:border-gray-800/10 space-y-4">
                    <button
                        onClick={deleteNode}
                        className="w-full h-12 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl transition-all duration-200 font-semibold text-sm border border-red-500/10 active:scale-[0.98]"
                    >
                        <span className="text-lg">🗑️</span>
                        <span>Delete Entity</span>
                    </button>
                    <div className="text-[10px] text-gray-400/60 text-center font-mono">
                        ID: {node.id.split('-').slice(-1)[0]}
                    </div>
                </div>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowDeleteConfirm(false)}
                        />

                        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <span className="text-2xl">🗑️</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Delete "{String(node.data.label)}"?
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This will also remove all connected edges. This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-r border-gray-100 dark:border-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
