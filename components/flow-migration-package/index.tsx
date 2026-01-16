'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
    Controls,
    ReactFlow,
    Node,
    Edge,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    addEdge,
    BackgroundVariant,
    Handle,
    Position,
    NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Maximize2, Minimize2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { useModelData } from './hooks/useModelData';
import { analyzeArchitecture } from './logic/topology-analysis';
import { PatternLabel } from './components/PatternLabel';
import { NodeDetailSidebar } from './components/NodeDetailSidepanel';
import { AnimatedBackground } from './components/AnimatedBackground';
import { MCPExportModal } from './components/MCPExportModal';
import { LLMNode, MCPNode, ClientNode, ErrorNode } from './nodes/CustomNodes';

// Interfaces for component props if needed to be controlled from outside
interface FlowPackageProps {
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onSave?: (nodes: Node[], edges: Edge[]) => void;
}

const nodeTypes = {
    llmNode: LLMNode,
    mcpNode: MCPNode,
    clientNode: ClientNode,
    errorNode: ErrorNode,
};

// Default Data (Copied from original for standalone capability)
const defaultNodes: Node[] = [
    {
        id: 'user', type: 'clientNode', position: { x: 400, y: 0 },
        data: { label: 'Developer', shortName: 'User', entityType: 'Client Interface' }
    },
    {
        id: 'agent-analyze', type: 'llmNode', position: { x: 100, y: 200 },
        data: { label: 'Analyze Changes', shortName: 'Analyze', entityType: 'LLM Agent', provider: 'Gemini', modelId: 'gemini-1.5-pro' }
    }
];

export default function FlowMigrationPackage({ initialNodes: propNodes, initialEdges: propEdges, onSave }: FlowPackageProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(propNodes || defaultNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges || []);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { models, breakpoints, loading } = useModelData();
    const detectedPatterns = useMemo(() => analyzeArchitecture(nodes, edges), [nodes, edges]);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-Save Effect
    useEffect(() => {
        if (!onSave) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout (debounce 1s)
        saveTimeoutRef.current = setTimeout(() => {
            onSave(nodes, edges);
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [nodes, edges, onSave]);

    // Helper to determine edge style from model price
    const getEdgeStyle = useCallback((modelId: string | undefined): any => {
        if (!modelId || !breakpoints || models.length === 0) return { strokeWidth: 2, className: '' };

        const model = models.find((m: any) => m.id === modelId);
        if (!model) return { strokeWidth: 2, className: '' };

        const price = parseFloat(model.pricing.prompt);

        if (price < breakpoints.low) {
            return { strokeWidth: 1, className: 'edge-light' };
        }
        if (price > breakpoints.high) {
            return { strokeWidth: 5, className: 'edge-heavy' };
        }

        return { strokeWidth: 2.5, className: '' };
    }, [models, breakpoints]);

    // Helper to resolve node type from metadata
    const resolveNodeType = useCallback((node: Node | undefined) => {
        if (!node) return 'unknown';
        const entityType = node.data.entityType as string;
        if (entityType === 'LLM Agent') return 'llmNode';
        if (entityType === 'MCP Server' || entityType === 'Database' || entityType === 'Storage') return 'mcpNode';
        if (entityType === 'Client Interface') return 'clientNode';
        if (entityType === 'System Error') return 'errorNode';
        return node.type;
    }, []);

    // Validation Helper
    const validateConnection = useCallback((sourceNode: Node, targetNode: Node) => {
        const sourceType = resolveNodeType(sourceNode);
        const targetType = resolveNodeType(targetNode);

        let style: React.CSSProperties = { stroke: '#3b82f6', strokeWidth: 2 };
        let animated = true;
        let label = undefined;
        let labelStyle = undefined;
        let labelShowBg = false;
        let className = '';
        let markerEnd: any = undefined;

        // Apply Data Throughput Visuals (Model Price)
        if (sourceType === 'llmNode') {
            const dynamicStyle = getEdgeStyle(sourceNode.data.modelId as string);
            style.strokeWidth = dynamicStyle.strokeWidth;
            className = dynamicStyle.className;
        }

        // Validation Rules
        const isClientToMCP = sourceType === 'clientNode' && targetType === 'mcpNode';
        const isMCPToClient = sourceType === 'mcpNode' && targetType === 'clientNode';
        const isMCPToMCP = sourceType === 'mcpNode' && targetType === 'mcpNode';
        const isClientToClient = sourceType === 'clientNode' && targetType === 'clientNode';

        const isErrorNode = sourceType === 'errorNode' || targetType === 'errorNode';
        if (isErrorNode) {
            style = { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '0' };
            animated = false;
            label = 'Protocol Error';
            labelStyle = { fill: '#dc2626', fontWeight: 700, fontSize: 10 };
            labelShowBg = true;
            markerEnd = 'url(#error-x)';
            className = '';
        }
        else if (isClientToMCP || isMCPToClient || isMCPToMCP || isClientToClient) {
            style = { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '0' };
            animated = false;
            label = 'Protocol Error: Agente Requerido';
            labelStyle = { fill: '#dc2626', fontWeight: 700, fontSize: 10 };
            labelShowBg = true;
            markerEnd = 'url(#error-x)';
            className = '';
        } else if (sourceType === 'mcpNode' || targetType === 'mcpNode') {
            if (sourceType === 'llmNode') {
                const dynamicStyle = getEdgeStyle(sourceNode.data.modelId as string);
                style = {
                    stroke: '#22c55e',
                    strokeWidth: dynamicStyle.strokeWidth
                };
                className = dynamicStyle.className;
            } else {
                style = { stroke: '#22c55e', strokeWidth: 2 };
                className = '';
            }
        }

        return { style, animated, label, labelStyle, labelShowBg, className, markerEnd };
    }, [resolveNodeType, getEdgeStyle]);

    // Smart Connection Validation (for new connections)
    const onConnect = useCallback(
        (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const targetNode = nodes.find((n) => n.id === params.target);

            if (!sourceNode || !targetNode) return;

            const validationProps = validateConnection(sourceNode, targetNode);
            setEdges((eds) => addEdge({ ...params, ...validationProps }, eds));
        },
        [setEdges, nodes, validateConnection]
    );

    // Re-validate all edges when nodes change
    const prevNodesRef = React.useRef<string>('');
    useEffect(() => {
        const currentNodesSignature = JSON.stringify(nodes.map(n => ({
            id: n.id,
            type: n.type,
            entityType: n.data.entityType,
            modelId: n.data.modelId
        })));

        if (prevNodesRef.current === currentNodesSignature) {
            return;
        }

        prevNodesRef.current = currentNodesSignature;

        setEdges((currentEdges) =>
            currentEdges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);

                if (!sourceNode || !targetNode) return edge;

                const validationProps = validateConnection(sourceNode, targetNode);

                return {
                    ...edge,
                    ...validationProps
                };
            })
        );
    }, [nodes, validateConnection, setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

    // State for Add Entity dropdown - REMOVED (Moved to Sidebar)


    // Export Flow Handler
    // Refs for state access inside event listeners without re-binding
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);

    // Keep refs in sync
    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
    }, [nodes, edges]);

    // MCP Export Handler
    const [isMCPExportOpen, setIsMCPExportOpen] = useState(false);
    const [mcpExportContent, setMcpExportContent] = useState('');

    useEffect(() => {
        const handleExport = () => {
            // ... existing export flow logic ...
            const flowData = { nodes: nodesRef.current, edges: edgesRef.current };
            const jsonString = JSON.stringify(flowData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `flow-export-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        const handleExportZip = async () => {
            // ... existing zip logic ...
            const zip = new JSZip();
            const workflowFolder = zip.folder("workflow");

            if (!workflowFolder) {
                console.error("Failed to create workflow folder in zip");
                return;
            }

            const agentNodes = nodesRef.current.filter(n =>
                n.data.entityType === 'LLM Agent'
            );

            if (agentNodes.length === 0) {
                alert("No hay agentes (LLM Agent) para exportar.");
                return;
            }

            // Generate Markdown for each agent
            agentNodes.forEach(node => {
                const label = (node.data.label as string) || node.id;
                const safeFilename = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const systemPrompt = node.data.systemPrompt || '';
                const modelId = node.data.modelId || 'unknown';
                const provider = node.data.provider || 'unknown';

                // Analyze Connections
                const incomingEdges = edgesRef.current.filter(e => e.target === node.id);
                const outgoingEdges = edgesRef.current.filter(e => e.source === node.id);

                const connectedClients = incomingEdges
                    .map(e => nodesRef.current.find(n => n.id === e.source))
                    .filter(n => n?.data.entityType === 'Client Interface')
                    .map(n => n?.data.label || 'Client');

                const incomingAgents = incomingEdges
                    .map(e => nodesRef.current.find(n => n.id === e.source))
                    .filter(n => n?.data.entityType === 'LLM Agent')
                    .map(n => n?.data.label || 'Unknown Agent');

                const connectedMCPs = outgoingEdges
                    .map(e => nodesRef.current.find(n => n.id === e.target))
                    .filter(n => n?.data.entityType === 'MCP Server')
                    .map(n => n?.data.label || 'Unknown MCP');

                // Build Context String
                let contextString = `This agent is designed to run on the **${modelId}** model.\n\n`;

                contextString += `### Context & Connections\n`;
                if (connectedClients.length > 0) {
                    contextString += `- **Receives input from:** Client Interface (${connectedClients.join(', ')}).\n`;
                }
                if (incomingAgents.length > 0) {
                    contextString += `- **Receives input from Agents:** ${incomingAgents.join(', ')}.\n`;
                }
                if (connectedMCPs.length > 0) {
                    contextString += `- **Connected MCP Servers:** ${connectedMCPs.join(', ')}.\n`;
                    contextString += `\n**IMPORTANT INSTRUCTION:** You have access to the following MCP Servers: ${connectedMCPs.join(', ')}. You should attempt to use their tools when necessary to fulfill the request. IF an MCP tool call fails or the server is unreachable, you MUST STOP the process and ask the user how to proceed. Do not hallucinate a response if the tool fails.\n`;
                } else {
                    contextString += `- **No MCP Servers connected.**\n`;
                }

                const markdownContent = `---
title: ${label}
type: agent
model: ${modelId}
provider: ${provider}
---

# Context & Instructions

${contextString}

# System Prompt

${systemPrompt}
`;
                workflowFolder.file(`${safeFilename}.md`, markdownContent);
            });

            // Generate and download zip
            try {
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, "project-workflow.zip");
                // Dispatch event to show success popup
                window.dispatchEvent(new CustomEvent('export-zip-success'));
            } catch (error) {
                console.error("Failed to generate zip:", error);
                alert("Error al generar el archivo ZIP. Revisa la consola.");
            }
        };

        const handleExportMCP = () => {
            const mcpNodes = nodesRef.current.filter(n =>
                n.data.entityType === 'MCP Server' ||
                n.data.entityType === 'Database'
            );

            let combinedServers: Record<string, any> = {};

            mcpNodes.forEach(node => {
                if (node.data.mcpConfig && typeof node.data.mcpConfig === 'string') {
                    try {
                        const config = JSON.parse(node.data.mcpConfig);
                        // Config is expected to be { "serverName": { "command": ... } }
                        // Merge top-level keys
                        Object.assign(combinedServers, config);
                    } catch (e) {
                        console.error(`Failed to parse MCP config for node ${node.id}`, e);
                    }
                }
            });

            const finalConfig = {
                mcpServers: combinedServers
            };

            setMcpExportContent(JSON.stringify(finalConfig, null, 2));
            setIsMCPExportOpen(true);
        };

        const handleImport = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { nodes: newNodes, edges: newEdges } = customEvent.detail;

            if (newNodes && newEdges) {
                setNodes(newNodes);
                setEdges(newEdges);
            }
        };

        const handleImportMCPConfig = (event: Event) => {
            const customEvent = event as CustomEvent;
            const config = customEvent.detail;

            if (!config || !config.mcpServers) {
                alert("Archivo de configuración inválido. Debe contener la clave 'mcpServers'.");
                return;
            }

            const newNodes: Node[] = [];
            let xOffset = 50;
            let yOffset = 50;

            Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
                // Construct the node data
                // We wrap it in a structure that matches what the Export expects: { "serverName": { ... } }
                const individualConfig = { [name]: serverConfig };

                const nodeData = {
                    ...getDefaultDataForEntity('MCP Server'),
                    label: name,
                    shortName: name,
                    mcpConfig: JSON.stringify(individualConfig, null, 2)
                };

                const newNode: Node = {
                    id: `mcp-${name}-${Date.now()}`,
                    type: 'mcpNode',
                    position: { x: 500 + xOffset, y: 300 + yOffset },
                    data: nodeData
                };

                newNodes.push(newNode);

                // Simple grid layout logic
                yOffset += 120;
                if (yOffset > 400) {
                    yOffset = 50;
                    xOffset += 250;
                }
            });

            setNodes((prev) => [...prev, ...newNodes]);

            // Dispatch success event for UI feedback if needed, using generic alert for now
            // alert(`✅ Se importaron ${newNodes.length} servidores MCP correctamente.`);
            window.dispatchEvent(new CustomEvent('notification', {
                detail: {
                    message: `Se importaron ${newNodes.length} servidores MCP`,
                    type: 'success'
                }
            }));
        };

        window.addEventListener('export-flow', handleExport);
        window.addEventListener('export-workbench-zip', handleExportZip);
        window.addEventListener('request-mcp-export', handleExportMCP);
        window.addEventListener('import-flow', handleImport);
        window.addEventListener('import-mcp-config', handleImportMCPConfig);

        return () => {
            window.removeEventListener('export-flow', handleExport);
            window.removeEventListener('export-workbench-zip', handleExportZip);
            window.removeEventListener('request-mcp-export', handleExportMCP);
            window.removeEventListener('import-flow', handleImport);
            window.removeEventListener('import-mcp-config', handleImportMCPConfig);
        };
    }, [setNodes, setEdges]); // Stable dependencies only



    // Helper functions for creating new nodes
    const getDefaultDataForEntity = (entityType: string): any => {
        const baseData = {
            label: `New ${entityType}`,
            shortName: entityType.split(' ')[0],
            entityType,
        };

        switch (entityType) {
            case 'LLM Agent':
                return {
                    ...baseData,
                    provider: 'OpenAI',
                    modelId: 'gpt-4',
                    cost: 0.03,
                    systemPrompt: 'You are a helpful assistant.',
                    taskComplexity: 'simple',
                    baseTokens: 500,
                    mcpFactor: 1,
                    userHasFreeTier: false,
                };
            case 'MCP Server':
                return {
                    ...baseData,
                    tools: ['read_file', 'write_file'],
                    resources: 'filesystem',
                };
            case 'Client Interface':
                return {
                    ...baseData,
                    transport: 'stdio',
                    sessionId: `session-${Date.now()}`,
                    env: 'USER=developer\nSESSION_ID=dev-01',
                };
            case 'Database':
                return {
                    ...baseData,
                    tools: ['query', 'insert', 'update'],
                    resources: 'postgresql://localhost:5432',
                };
            case 'Storage':
                return {
                    ...baseData,
                    tools: ['upload', 'download', 'delete'],
                    resources: 's3://bucket-name',
                };
            default:
                return baseData;
        }
    };

    const getNodeTypeFromEntity = (entityType: string): string => {
        switch (entityType) {
            case 'LLM Agent':
                return 'llmNode';
            case 'MCP Server':
            case 'Database':
            case 'Storage':
                return 'mcpNode';
            case 'Client Interface':
                return 'clientNode';
            default:
                return 'llmNode';
        }
    };

    const addNode = useCallback((entityType: string) => {
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: getNodeTypeFromEntity(entityType),
            position: { x: 400, y: 300 },
            data: getDefaultDataForEntity(entityType)
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes]);




    // Custom Event Listener for adding nodes from Sidebar
    useEffect(() => {
        const handleCreateNode = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail && customEvent.detail.entityType) {
                addNode(customEvent.detail.entityType);
            }
        };

        window.addEventListener('create-node', handleCreateNode);

        return () => {
            window.removeEventListener('create-node', handleCreateNode);
        };
    }, [addNode]);

    return (
        <>

            <style jsx global>{`
                /* Connection Feedback Styles */
                
                /* Source is Client -> Agents Glow */
                body.source-is-client .react-flow__node-llmNode {
                    animation: pulse-green 1.5s infinite;
                    box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
                }
                body.source-is-client .react-flow__node-mcpNode {
                    opacity: 0.5;
                    filter: grayscale(1);
                }

                /* Source is Agent -> Agents & MCPs Glow */
                body.source-is-agent .react-flow__node-llmNode,
                body.source-is-agent .react-flow__node-mcpNode,
                body.source-is-agent .react-flow__node-clientNode { /* Agents can technically reply to client */
                    animation: pulse-blue 1.5s infinite;
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
                }

                /* Source is MCP -> Not Allowed (mostly) */
                body.source-is-mcp .react-flow__pane {
                    cursor: not-allowed !important;
                }
                body.source-is-mcp .react-flow__handle {
                    pointer-events: none;
                }

                @keyframes pulse-blue {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }

                /* Edge Animation Speeds & Styles */
                .edge-heavy .react-flow__edge-path {
                    animation-duration: 3s !important; /* Slow calculation */
                    filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.6));
                    stroke-linecap: round;
                }
                
                .edge-light .react-flow__edge-path {
                    animation-duration: 0.5s !important; /* Low latency */
                    stroke-dasharray: 4;
                    filter: drop-shadow(0px 0px 2px rgba(34, 197, 94, 0.3));
                }

                /* Disable ALL animations on red error edges */
                .react-flow__edge-path[stroke="#dc2626"],
                .react-flow__edge-path[stroke="rgb(220, 38, 38)"] {
                    animation: none !important;
                    stroke-dasharray: 0 !important;
                }

                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                .react-flow__edge-path {
                    stroke-dasharray: 10;
                    animation: flow-animation var(--speed, 1.5s) linear infinite;
                }

                @keyframes flow-animation {
                    from { stroke-dashoffset: 20; }
                    to { stroke-dashoffset: 0; }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>

            {/* Custom Markers Definition */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
                <defs>
                    <marker
                        id="error-x"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M2,2 L8,8 M8,2 L2,8" stroke="#dc2626" strokeWidth="2" fill="none" />
                        <circle cx="5" cy="5" r="4.5" stroke="#dc2626" strokeWidth="1" fill="none" />
                    </marker>
                </defs>
            </svg>


            <div className={`flex flex-row bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-300
            ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : 'w-full h-full'}
        `}>
                <div className="flex-1 relative h-full min-w-0 bg-white/30 dark:bg-black/20 backdrop-blur-md overflow-hidden">
                    {/* Floating Geometrics Background */}
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-indigo-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob" />
                    <AnimatedBackground />


                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="absolute top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md z-50"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    {/* Add Entity Floating Button - REMOVED */}


                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background variant={BackgroundVariant.Dots} />
                        <Controls />
                        {detectedPatterns.map((p, idx) => (
                            <PatternLabel key={idx} pattern={p} />
                        ))}
                    </ReactFlow>
                </div>

                <NodeDetailSidebar
                    node={selectedNode}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    onClose={() => setSelectedNodeId(null)}
                    models={models}
                />
            </div>

            <MCPExportModal
                isOpen={isMCPExportOpen}
                onClose={() => setIsMCPExportOpen(false)}
                config={mcpExportContent}
            />
        </>
    );
}
