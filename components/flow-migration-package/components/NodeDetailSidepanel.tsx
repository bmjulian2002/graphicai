import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Node, Edge } from '@xyflow/react';
import {
    Terminal, Zap, X, Brain, Plug, Monitor, Database, Box, AlertTriangle,
    Pencil, Cpu, Check, ArrowRight, ChevronRight, ChevronDown, Trash2,
    Play, Loader2, Plus, Smartphone, FileCode, Server, Sparkles, Maximize2, Copy, LayoutGrid
} from 'lucide-react';
import { MCPConfigModal } from './MCPConfigModal';
import { ModelData } from '../types';
import { useApiKeys } from '@/hooks/useApiKeys';
import { generateAIResponse, Provider } from '@/app/actions/generate';

interface NodeDetailSidebarProps {
    node: Node | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    onClose: () => void;
    models: ModelData[];
}

const AVAILABLE_BUCKETS = [
    's3://production-assets',
    's3://user-uploads',
    'gcs://backups',
    'azure://logs',
    's3://cold-storage'
];

// --- Extracted Components ---

interface UpdateNodeDataFn {
    (key: string, value: any): void;
}

const EntityTypeDropdown = ({
    node,
    setNodes,
    updateNodeData
}: {
    node: Node;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    updateNodeData: UpdateNodeDataFn;
}) => {
    const types = ['LLM Agent', 'MCP Server', 'Client Interface', 'Database', 'Storage'];
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2.5 px-1">
                Entity Type
            </h3>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-[0.99]"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg">
                        <Database className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{node.data.entityType as string}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-black/5">
                    <div className="p-1.5 space-y-0.5">
                        {types.map((type) => (
                            <button
                                key={type}
                                onClick={() => handleEntityTypeChange(type)}
                                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between
                                ${type === node.data.entityType
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <span>{type}</span>
                                {type === node.data.entityType && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ModelDropdown = ({
    node,
    updateNodeData,
    models,
    keys
}: {
    node: Node;
    updateNodeData: UpdateNodeDataFn;
    models: ModelData[];
    keys: { openaiKey: string; anthropicKey: string; geminiKey: string };
}) => {
    const { openaiKey, anthropicKey, geminiKey } = keys;
    const currentModel = (node.data.modelId as string) || '';
    const [isOpen, setIsOpen] = useState(false);
    const [filterVerified, setFilterVerified] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('flow_model_verified_only') === 'true';
        }
        return false;
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleVerified = () => {
        const newValue = !filterVerified;
        setFilterVerified(newValue);
        localStorage.setItem('flow_model_verified_only', String(newValue));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredModels = useMemo(() => {
        if (!filterVerified) return models;
        return models.filter(m => {
            const id = m.id.toLowerCase();
            const provider = m.provider?.toLowerCase() || id.split('/')[0];

            if (provider.includes('openai') || id.includes('gpt')) return !!openaiKey;
            if (provider.includes('anthropic') || id.includes('claude')) return !!anthropicKey;
            if (provider.includes('google') || provider.includes('gemini')) return !!geminiKey;
            return false;
        });
    }, [models, filterVerified, openaiKey, anthropicKey, geminiKey]);

    const selectedModelData = models.find(m => m.id === currentModel);
    const displayLabel = selectedModelData
        ? (selectedModelData.name || selectedModelData.id.split('/').pop())
        : 'Select a Model';

    const findCheaperAlternative = useMemo(() => {
        if (!selectedModelData || !selectedModelData.pricing) return null;
        const currentCost = parseFloat(selectedModelData.pricing.prompt) || 0;
        if (currentCost < 5) return null;
        const provider = selectedModelData.id.split('/')[0];
        const alternatives = filteredModels.filter(m => {
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
    }, [selectedModelData, filteredModels]);

    const suggestion = findCheaperAlternative;

    const groupedModels = useMemo(() => {
        const groups: Record<string, any[]> = {};
        filteredModels.slice(0, 100).forEach((m: any) => {
            const provider = m.id.split('/')[0] || 'other';
            if (!groups[provider]) groups[provider] = [];
            groups[provider].push(m);
        });
        return groups;
    }, [filteredModels]);

    return (
        <div className="mb-6 relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-2.5 px-1">
                <label className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                    AI Model
                </label>

                <div className="flex items-center gap-3">
                    {!isOpen && suggestion && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                            <Zap className="w-3 h-3 fill-current" />
                            Smart Pick
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium transition-colors ${filterVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            Verified Only
                        </span>
                        <button
                            onClick={toggleVerified}
                            className={`
                                relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                ${filterVerified ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}
                            `}
                        >
                            <span
                                aria-hidden="true"
                                className={`
                                    pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                    ${filterVerified ? 'translate-x-3' : 'translate-x-0'}
                                `}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-md border rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-[0.99]
                    ${isOpen
                            ? 'border-blue-500/50 ring-2 ring-blue-500/10'
                            : 'border-gray-200/50 dark:border-gray-700/50'}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0">
                            <Cpu className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white truncate">{displayLabel}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 max-h-[320px] overflow-y-auto 
                        bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
                        border border-gray-100 dark:border-gray-800
                        rounded-xl shadow-2xl shadow-black/5 origin-top animate-in fade-in zoom-in-[0.98] duration-200
                        z-[100] ring-1 ring-black/5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700
                    ">
                        {suggestion && (
                            <div
                                onClick={() => {
                                    updateNodeData('modelId', suggestion.id);
                                    updateNodeData('cost', parseFloat(suggestion.pricing.prompt));
                                    updateNodeData('provider', suggestion.id.split('/')[0]);
                                    setIsOpen(false);
                                }}
                                className="sticky top-0 z-20 m-2 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-500/20 cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                        <Zap className="w-3.5 h-3.5 fill-current" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Recommended</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">Save 50%+</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {suggestion.name || suggestion.id.split('/').pop()}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-emerald-500 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        )}

                        {Object.entries(groupedModels).map(([provider, providerModels]) => (
                            <div key={provider} className="pb-1">
                                <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm border-y border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    {provider}
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                    {providerModels.map((m: any) => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                updateNodeData('modelId', m.id);
                                                updateNodeData('cost', parseFloat(m.pricing.prompt));
                                                updateNodeData('provider', provider);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all flex items-center justify-between
                                            ${currentModel === m.id
                                                    ? 'bg-blue-500 text-white shadow-sm font-medium'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                        >
                                            <span className="truncate">{m.name || m.id.split('/').pop()}</span>
                                            {currentModel === m.id && <Check className="w-4 h-4 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {Object.keys(groupedModels).length === 0 && (
                            <div className="p-4 text-center text-xs text-gray-400">
                                No models found with active API keys.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ComplexityControl = ({ node, updateNodeData }: { node: Node; updateNodeData: UpdateNodeDataFn }) => {
    const complexityMap = { 'simple': 0, 'medium': 1, 'complex': 2 };
    const reverseMap = ['simple', 'medium', 'complex'];
    const currentComplexity = (node.data.taskComplexity as string) || 'simple';
    const sliderValue = complexityMap[currentComplexity as keyof typeof complexityMap] || 0;
    const isFree = (node.data.userHasFreeTier as boolean) || false;

    return (
        <div className="mb-8 p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-6 shadow-sm">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <label className="text-[13px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5" />
                        Task Complexity
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/10">
                        {['1x', '3x', '10x'][sliderValue]} Multiplier
                    </span>
                </div>

                <div className="relative h-10 flex items-center">
                    {/* Custom Slider Track */}
                    <div className="absolute left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300 ease-out"
                            style={{ width: `${(sliderValue / 2) * 100}%` }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="absolute left-0 right-0 flex justify-between px-0.5">
                        {[0, 1, 2].map((step) => (
                            <div
                                key={step}
                                className={`w-3 h-3 rounded-full border-2 transition-colors duration-300 z-10
                                ${step <= sliderValue
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'}`}
                            />
                        ))}
                    </div>

                    {/* Interactive Input */}
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={sliderValue}
                        onChange={(e) => updateNodeData('taskComplexity', reverseMap[parseInt(e.target.value)])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                </div>

                <div className="flex justify-between mt-1 px-1">
                    {['Simple', 'Medium', 'Complex'].map((label, idx) => (
                        <span
                            key={label}
                            onClick={() => updateNodeData('taskComplexity', reverseMap[idx])}
                            className={`text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 
                            ${sliderValue === idx ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700/50" />

            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[13px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Billing Mode
                    </label>
                </div>
                <div className="p-1 bg-gray-100/80 dark:bg-gray-900/50 rounded-xl flex relative group/toggle">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-lg transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${isFree ? 'left-[calc(50%+2px)] translate-x-0' : 'left-1'}`}
                    />
                    <button
                        onClick={() => updateNodeData('userHasFreeTier', false)}
                        className={`flex-1 relative z-10 py-2 text-xs font-semibold text-center rounded-lg transition-colors duration-200
                        ${!isFree ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => updateNodeData('userHasFreeTier', true)}
                        className={`flex-1 relative z-10 py-2 text-xs font-semibold text-center rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5
                        ${isFree ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        <span>Free Tier</span>
                        {isFree && <Zap className="w-3 h-3 fill-current animate-pulse" />}
                    </button>
                </div>
                <p className="mt-2 text-[10px] text-center text-gray-400 font-medium">
                    {isFree ? 'Zero cost estimation applied to this node' : 'Standard market rates applied'}
                </p>
            </div>
        </div>
    );
};


export const NodeDetailSidebar = ({
    node,
    setNodes,
    setEdges,
    onClose,
    models
}: NodeDetailSidebarProps) => {
    // API Keys & Execution State
    const { geminiKey, openaiKey, anthropicKey } = useApiKeys();
    const [selectedBucket, setSelectedBucket] = useState(AVAILABLE_BUCKETS[0]);
    const [userPrompt, setUserPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationOutput, setGenerationOutput] = useState<string | null>(null);
    const [expandedField, setExpandedField] = useState<'user' | 'system' | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const getApiKey = (provider: string) => {
        const p = provider?.toLowerCase() || '';
        if (p.includes('gemini') || p.includes('google')) return geminiKey;
        if (p.includes('openai') || p.includes('gpt')) return openaiKey;
        if (p.includes('anthropic') || p.includes('claude')) return anthropicKey;
        return '';
    };

    // Config Modal State
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const handleRunAgent = async () => {
        if (!node) return;
        setIsGenerating(true);
        setGenerationOutput(null);

        try {
            const provider = (node.data.provider as string)?.toLowerCase();
            const apiKey = getApiKey(provider);
            const modelId = node.data.modelId as string;
            const systemPrompt = node.data.systemPrompt as string || '';

            if ((node.data.entityType === 'Client Interface')) return; // No AI for Client Interface

            if (!apiKey) {
                setGenerationOutput('Error: API Key not found. Please configure it in Settings.');
                setIsGenerating(false);
                return;
            }

            let apiProvider: Provider = 'gemini';
            if (provider.includes('openai')) apiProvider = 'openai';
            if (provider.includes('anthropic')) apiProvider = 'anthropic';

            const response = await generateAIResponse({
                provider: apiProvider,
                apiKey,
                modelId,
                systemPrompt,
                userPrompt: userPrompt || 'Hello!',
            });

            if (response.error) {
                setGenerationOutput(`Error: ${response.error}`);
            } else {
                setGenerationOutput(response.content);
            }
        } catch (error: any) {
            setGenerationOutput(`System Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGeneratePrompt = async () => {
        if (!node) return;
        if (!userPrompt) {
            setGenerationOutput('Error: Please enter a description in the User Prompt field first.');
            return;
        }

        setIsGenerating(true);
        setGenerationOutput(null);

        try {
            const provider = (node.data.provider as string)?.toLowerCase();
            const apiKey = getApiKey(provider);
            const modelId = node.data.modelId as string;

            if (!apiKey) {
                setGenerationOutput('Error: API Key not found. Please configure it in Settings.');
                setIsGenerating(false);
                return;
            }

            let apiProvider: Provider = 'gemini';
            if (provider.includes('openai')) apiProvider = 'openai';
            if (provider.includes('anthropic')) apiProvider = 'anthropic';

            const response = await generateAIResponse({
                provider: apiProvider,
                apiKey,
                modelId,
                systemPrompt: 'You are an expert Prompt Engineer. Your goal is to write a highly effective, comprehensive, and professional System Prompt for an AI Agent based on the user\'s description. The system prompt should define the persona, tone, rules, and constraints clearly. Output ONLY the system prompt, no markdown fences or preambles.',
                userPrompt: `Description of the desired agent: "${userPrompt}"`,
            });

            if (response.error) {
                setGenerationOutput(`Error: ${response.error}`);
            } else {
                setGenerationOutput('✨ System Prompt Generated and Applied!');
                updateNodeData('systemPrompt', response.content);
            }
        } catch (error: any) {
            setGenerationOutput(`System Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    const deleteNode = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        setNodes((nds) => nds.filter(n => n.id !== node.id));
        setEdges((eds) => eds.filter(e => e.source !== node.id && e.target !== node.id));
        setShowDeleteConfirm(false);
        onClose();
    };


    const DetailItem = ({ label, value, mono = false, icon: Icon }: any) => (
        <div className="mb-5">
            <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2.5 px-1 flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
            </h3>
            <div className={`
                w-full bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm
                border border-gray-100 dark:border-gray-700/30
                rounded-xl px-4 py-3.5
                text-gray-900 dark:text-gray-100
                shadow-sm
                ${mono ? 'font-mono text-xs' : 'text-sm font-medium'}
            `}>
                {value}
            </div>
        </div>
    );

    const renderDetails = () => {
        const entityType = node.data.entityType as string;

        if (entityType === 'LLM Agent') {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1">
                    <EntityTypeDropdown node={node} setNodes={setNodes} updateNodeData={updateNodeData} />
                    <ModelDropdown node={node} updateNodeData={updateNodeData} models={models} keys={{ openaiKey, anthropicKey, geminiKey }} />
                    <DetailItem label="Provider" value={node.data.provider} />

                    <div className="h-2" />

                    <ComplexityControl node={node} updateNodeData={updateNodeData} />

                    <div className="h-6" />

                    <div className="relative group/translator mb-6">
                        {/* Expanded Modal via Portal */}
                        {expandedField && typeof document !== 'undefined' && createPortal(
                            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setExpandedField(null)}>
                                <div className="w-full max-w-5xl h-[85vh] bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
                                    {/* Editor Header */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#252526]">
                                        <div className="flex items-center gap-4">
                                            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                                                {expandedField === 'user' ? <Pencil className="w-4 h-4 text-blue-400" /> : <Terminal className="w-4 h-4 text-emerald-400" />}
                                                {expandedField === 'user' ? 'Agent Description Editor' : 'System Prompt Editor'}
                                            </h3>
                                            <span className="text-xs font-mono text-gray-500 bg-black/20 px-2 py-1 rounded">
                                                {expandedField === 'user' ? 'MARKDOWN' : 'SYSTEM PROMPT'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const textToCopy = expandedField === 'user' ? userPrompt : String(node.data.systemPrompt || '');
                                                    navigator.clipboard.writeText(textToCopy);
                                                    setIsCopied(true);
                                                    setTimeout(() => setIsCopied(false), 2000);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 transition-colors border border-white/5"
                                            >
                                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                {isCopied ? 'Copied' : 'Copy'}
                                            </button>
                                            <div className="w-px h-4 bg-white/10 mx-1" />
                                            <button
                                                onClick={() => setExpandedField(null)}
                                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                title="Close (Esc)"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Editor Area */}
                                    <div className="flex-1 relative flex">
                                        {/* Actual Textarea */}
                                        <textarea
                                            value={expandedField === 'user' ? userPrompt : String(node.data.systemPrompt || '')}
                                            onChange={(e) => {
                                                if (expandedField === 'user') {
                                                    setUserPrompt(e.target.value);
                                                    updateNodeData('userPrompt', e.target.value);
                                                } else {
                                                    updateNodeData('systemPrompt', e.target.value);
                                                }
                                            }}
                                            className="flex-1 bg-[#1e1e1e] text-gray-200 p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-0 w-full h-full scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
                                            placeholder="Start typing..."
                                            autoFocus
                                            spellCheck={false}
                                        />
                                    </div>

                                    {/* Editor Footer */}
                                    <div className="px-6 py-2 border-t border-white/5 bg-[#252526] flex items-center justify-between text-[11px] text-gray-500 font-mono">
                                        <div>Ln 1, Col 1</div>
                                        <div className="flex items-center gap-4">
                                            <span>UTF-8</span>
                                            <span>{expandedField === 'user' ? 'Markdown' : 'Plain Text'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}

                        <div className="bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-sm overflow-hidden ring-1 ring-gray-900/5 transition-all">

                            {/* Input Region */}
                            <div className="p-4 pb-12 bg-gray-50/50 dark:bg-gray-800/30">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Pencil className="w-3 h-3" />
                                        Agent Description
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 font-medium">Input</span>
                                        <button onClick={() => setExpandedField('user')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                            <Maximize2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={userPrompt}
                                    onChange={(e) => {
                                        setUserPrompt(e.target.value);
                                        updateNodeData('userPrompt', e.target.value);
                                    }}
                                    className="w-full text-sm text-gray-900 dark:text-gray-100 leading-relaxed bg-transparent !border-0 !ring-0 !outline-none !shadow-none focus:ring-0 focus:outline-none focus:border-0 p-0 resize-none min-h-[90px] placeholder:text-gray-400/70 scrollbar-thin scrollbar-thumb-gray-200/50 dark:scrollbar-thumb-gray-700/50 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600"
                                    placeholder="Describe your agent's persona, role, and constraints..."
                                />
                            </div>

                            {/* Divider & Action Button */}
                            <div className="relative z-10 -mt-5 mb-1 px-4">
                                <button
                                    onClick={handleGeneratePrompt}
                                    disabled={isGenerating || !userPrompt}
                                    className="w-full relative group flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-60 disabled:shadow-none"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className={`p-1.5 rounded-lg ${isGenerating ? 'bg-blue-50 text-blue-600' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'} shadow-sm`}>
                                        {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-current" />}
                                    </div>
                                    <span className={`text-xs font-semibold ${isGenerating ? 'text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {isGenerating ? 'Translating...' : 'Generate Prompt'}
                                    </span>
                                </button>
                            </div>

                            {/* Output Region */}
                            <div className="p-4 pt-2 bg-white/50 dark:bg-gray-900/30">
                                <div className="flex items-center justify-between mb-2 mt-2">
                                    <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3 h-3" />
                                        System Prompt
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 font-medium">Output</span>
                                        <button onClick={() => setExpandedField('system')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                            <Maximize2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={String(node.data.systemPrompt || '')}
                                    onChange={(e) => updateNodeData('systemPrompt', e.target.value)}
                                    className="w-full text-sm text-gray-900 dark:text-gray-100 leading-relaxed bg-transparent !border-0 !ring-0 !outline-none !shadow-none focus:ring-0 focus:outline-none focus:border-0 resize-none min-h-[150px] scrollbar-thin scrollbar-thumb-gray-200/50 dark:scrollbar-thumb-gray-700/50 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600 placeholder:text-gray-400/50 font-mono text-[13px]"
                                    placeholder="The generated system prompt will appear here..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-4" /> {/* Added spacing */}
                    <DetailItem label="Estimated Cost / 1M" value={(() => {
                        const rawCost = node.data.cost as string | number;
                        let costNum = typeof rawCost === 'string' ? parseFloat(rawCost) : rawCost;
                        if (isNaN(costNum)) return 'Unknown';
                        if (costNum < 0.01 && costNum > 0) costNum = costNum * 1_000_000;
                        return `$${costNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
                    })()} mono={true} />




                </div>
            );
        }

        if (entityType === 'Storage') {
            const currentResources: string[] = typeof (node.data as any).resources === 'string'
                ? ((node.data as any).resources as string).split(',').filter(Boolean)
                : (node.data as any).resources || [];

            const addResource = () => {
                if (!currentResources.includes(selectedBucket)) {
                    const newResources = [...currentResources, selectedBucket];
                    updateNodeData('resources', newResources.join(','));
                }
            };

            const removeResource = (resourceToRemove: string) => {
                const newResources = currentResources.filter(r => r !== resourceToRemove);
                updateNodeData('resources', newResources.join(','));
            };

            return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1">
                    <EntityTypeDropdown node={node} setNodes={setNodes} updateNodeData={updateNodeData} />

                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Storage Configuration</h3>

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Active Buckets</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Box className="w-3 h-3" />
                                {currentResources.length}
                            </span>
                        </div>

                        {/* Resource List */}
                        <div className="space-y-2 mb-4">
                            {currentResources.length === 0 ? (
                                <div className="text-xs text-center py-3 text-gray-400 italic">
                                    No buckets mounted
                                </div>
                            ) : (
                                currentResources.map((resource, idx) => (
                                    <div key={idx} className="group flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-2 truncate">
                                            <Database className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="truncate">{resource}</span>
                                        </div>
                                        <button
                                            onClick={() => removeResource(resource)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Resource */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={selectedBucket}
                                    onChange={(e) => setSelectedBucket(e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-3 pr-8 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {AVAILABLE_BUCKETS.map(bucket => (
                                        <option key={bucket} value={bucket} disabled={currentResources.includes(bucket)}>
                                            {bucket}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={addResource}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition-colors shadow-sm active:scale-95 flex items-center justify-center"
                                disabled={currentResources.includes(selectedBucket)}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (entityType === 'MCP Server' || entityType === 'Database') {
            // Extract Server Name from Config
            let serverName = 'Server Configuration';
            let packageName = '';
            try {
                const configStr = (node.data as any).mcpConfig;
                if (configStr) {
                    const parsed = JSON.parse(configStr);
                    serverName = Object.keys(parsed)[0];
                    // Try to get package name for subtitle
                    const args = parsed[serverName]?.args || [];
                    const pkg = args.find((a: string) => !a.startsWith('-'))?.split('@')[0];
                    if (pkg) packageName = pkg;
                }
            } catch (e) { /* ignore parse error */ }

            return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1">
                    <EntityTypeDropdown node={node} setNodes={setNodes} updateNodeData={updateNodeData} />

                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                            {entityType === 'Database' ? 'Database Config' : 'Active Server'}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px]" title={serverName}>
                                    {serverName}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />
                                    Active
                                </span>
                            </div>
                            <button
                                onClick={() => setIsConfigModalOpen(true)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                title="Edit Configuration"
                            >
                                <FileCode className="w-3.5 h-3.5" />
                            </button>
                        </div>

                    </div>

                    <MCPConfigModal
                        isOpen={isConfigModalOpen}
                        onClose={() => setIsConfigModalOpen(false)}
                        config={(node.data as any).mcpConfig || ''}
                        onSave={(newConfig) => updateNodeData('mcpConfig', newConfig)}
                    />
                </div>
            );
        }

        if (entityType === 'Client Interface') {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1">
                    <EntityTypeDropdown node={node} setNodes={setNodes} updateNodeData={updateNodeData} />

                    <div className="mb-8">
                        <div className="flex items-center justify-between px-1 mb-3">
                            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Interface Type</h3>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                Select one
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'cli', label: 'Terminal', icon: Terminal, desc: 'SSH / Shell', transport: 'SSH' },
                                { id: 'web', label: 'Web App', icon: Monitor, desc: 'HTTPS / Browser', transport: 'HTTPS' },
                                { id: 'mobile', label: 'Mobile', icon: Smartphone, desc: 'iOS / Android', transport: 'API' },
                                { id: 'api', label: 'API Client', icon: Plug, desc: 'REST / gRPC', transport: 'REST' }
                            ].map((option) => {
                                const isActive = node.data.interfaceType === option.id || (!node.data.interfaceType && option.id === 'cli');
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            updateNodeData('interfaceType', option.id);
                                            updateNodeData('transport', option.transport);
                                            updateNodeData('shortName', option.label.split(' ')[0]);
                                        }}
                                        className={`
                                            relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-300 group
                                            ${isActive
                                                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-[0_0_0_1px_rgba(59,130,246,0.1)] dark:shadow-none'
                                                : 'bg-white/80 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm hover:-translate-y-0.5'
                                            }
                                        `}
                                    >
                                        {isActive && (
                                            <div className="absolute top-2 right-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                            </div>
                                        )}

                                        <div className={`
                                            mb-2 p-2.5 rounded-xl transition-all duration-300
                                            ${isActive
                                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-100'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 scale-95 group-hover:scale-100'
                                            }
                                        `}>
                                            <option.icon className="w-4 h-4" />
                                        </div>

                                        <span className={`text-xs font-semibold mb-0.5 transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                                            {option.label}
                                        </span>
                                        <span className={`text-[9px] transition-colors ${isActive ? 'text-blue-600/80 dark:text-blue-400/80 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {option.desc}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between px-1 mb-3">
                            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Project Memory</h3>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                Absolute Context
                            </span>
                        </div>

                        <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                            <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800 rounded-2xl p-1 transition-all group-focus-within:border-blue-500/50 group-focus-within:bg-white dark:group-focus-within:bg-gray-900 shadow-sm">
                                <textarea
                                    value={String(node.data.sharedContext || '')}
                                    onChange={(e) => updateNodeData('sharedContext', e.target.value)}
                                    // Prevent drag events from propagating to node
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-full bg-transparent border-0 text-xs text-gray-600 dark:text-gray-300 placeholder:text-gray-400 leading-relaxed px-4 py-3 min-h-[140px] resize-none focus:outline-none focus:ring-0 font-medium tracking-wide selection:bg-blue-100 dark:selection:bg-blue-900/30 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
                                    placeholder="Define absolute rules, coding standards, or context here. This memory is injected into every connected agent..."
                                    spellCheck={false}
                                />
                                <div className="px-4 pb-3 pt-1 flex justify-end border-t border-gray-100/50 dark:border-gray-800/50 mt-1">
                                    <p className="text-[9px] font-medium text-gray-400 group-focus-within:text-blue-500 transition-colors pt-2">
                                        Injected to connected agents
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (entityType === 'System Error') {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1">
                    <EntityTypeDropdown node={node} setNodes={setNodes} updateNodeData={updateNodeData} />

                    <div className="p-5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl mb-6">
                        <div className="flex items-center gap-3 mb-3 text-red-700 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-bold text-sm">Protocol Violation</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed mb-3">
                            {(node.data.message as string) || 'Direct MCP connections are not allowed'}
                        </p>
                        <div className="text-xs font-mono bg-red-100/50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg">
                            Code: MCP_DIRECT_CONNECTION
                        </div>
                    </div>

                    <div className="px-5 py-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                        <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">Suggested Fix</h4>
                        <ul className="list-disc list-inside text-sm text-orange-800 dark:text-orange-300 space-y-1">
                            <li>Add an LLM Agent between Client and MCP Server</li>
                            <li>Route through Orchestrator</li>
                        </ul>
                    </div>
                </div>
            );
        }

        if (entityType === 'Annotation') {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1">
                    <EntityTypeDropdown node={node} setNodes={setNodes} updateNodeData={updateNodeData} />

                    <div className="mb-6">
                        <div className="flex items-center justify-between px-1 mb-3">
                            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Content</h3>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                Markdown supported
                            </span>
                        </div>

                        {/* Redesigned Content Area - Matches Header Input Style */}
                        <div className="group flex flex-col gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-1 py-1 border border-transparent focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-black/20 focus-within:shadow-sm transition-all duration-200">
                            <textarea
                                value={String(node.data.comment || '')}
                                onChange={(e) => updateNodeData('comment', e.target.value)}
                                className="w-full bg-transparent border-0 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 leading-relaxed px-3 py-2 min-h-[300px] resize-none focus:outline-none focus:ring-0 font-medium selection:bg-blue-100 dark:selection:bg-blue-900/30 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-300"
                                placeholder="Write your notes, comments, or documentation here..."
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    // --- Detail Panel Render ---
    return (
        <>
            <div
                className="md:hidden fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="fixed md:static md:w-[450px] md:h-full md:border-l md:border-gray-200 dark:md:border-gray-800 md:shrink-0 md:rounded-none md:shadow-none bottom-0 left-0 right-0 h-[85vh] rounded-t-[32px] w-full bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] z-[60] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/10 animate-in slide-in-from-bottom-full md:slide-in-from-right duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">

                {/* Header */}
                <div className="md:hidden w-full flex items-center justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-gray-300/50 dark:bg-gray-600/50"></div>
                </div>

                {/* iOS-like Sticky Header */}
                <div className="sticky top-0 z-10 px-5 py-4 border-b border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-1">
                        {/* Node Icon */}
                        <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0 ring-4 ring-white dark:ring-gray-800">
                            {node.data.entityType === 'LLM Agent' && <Brain className="w-6 h-6" />}
                            {node.data.entityType === 'MCP Server' && <Server className="w-6 h-6" />}
                            {node.data.entityType === 'Client Interface' && <Monitor className="w-6 h-6" />}
                            {node.data.entityType === 'Database' && <Database className="w-6 h-6" />}
                            {node.data.entityType === 'Storage' && <Box className="w-6 h-6" />}
                            {node.data.entityType === 'System Error' && <AlertTriangle className="w-6 h-6" />}
                            {node.data.entityType === 'Annotation' && <LayoutGrid className="w-6 h-6" />}
                            {/* Fallback if needed, though strictly typed usually */}
                            {!['LLM Agent', 'MCP Server', 'Client Interface', 'Database', 'Storage', 'System Error', 'Annotation'].includes(node.data.entityType as string) && <Box className="w-6 h-6" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    {/* Node Label Input with Always Visible Pencil */}
                                    <div className="group flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-transparent focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-black/20 focus-within:shadow-sm transition-all duration-200">
                                        <input
                                            type="text"
                                            value={(node.data as any).label}
                                            onChange={(e) => updateNodeData('label', e.target.value)}
                                            className="w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                                            placeholder="Node Name"
                                        />
                                        <Pencil className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Close Action */}
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all duration-200"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pl-[64px]"> {/* Align with text, offset by icon width (48px) + gap (16px) */}
                        <p className="text-[11px] uppercase tracking-wide font-semibold text-blue-600 dark:text-blue-400 opacity-80">
                            {String(node.data.entityType || 'Entity Configuration')}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar scroll-smooth">
                    {renderDetails()}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-3">
                    <button
                        onClick={deleteNode}
                        className="w-full h-12 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800/30 active:scale-[0.98] shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Entity</span>
                    </button>
                    <div className="flex justify-center">
                        <span className="text-[10px] font-mono text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                            ID: {node.id.split('-').slice(-1)[0]}
                        </span>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                            onClick={() => setShowDeleteConfirm(false)}
                        />

                        <div className="relative bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl rounded-[24px] shadow-2xl max-w-xs w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                            <div className="pt-8 px-6 pb-6 text-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                    Delete this node?
                                </h3>
                                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                    This action cannot be undone and will remove all connected edges.
                                </p>
                            </div>

                            <div className="flex border-t border-gray-200/50 dark:border-gray-700/50 divide-x divide-gray-200/50 dark:divide-gray-700/50">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3.5 text-[15px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3.5 text-[15px] font-bold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
