'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import FlowDiagram from '@/components/flow/FlowDiagram';
import { Node, Edge } from '@xyflow/react';

interface FlowPageProps {
    params: {
        id: string;
    };
}

export default function FlowPage({ params }: FlowPageProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [flowName, setFlowName] = useState('');
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    useEffect(() => {
        fetchFlow();
    }, [params.id]);

    const fetchFlow = async () => {
        try {
            // Fetch flow metadata
            const flowResponse = await fetch(`/api/flows/${params.id}`);
            const flowData = await flowResponse.json();
            setFlowName(flowData.flow.name);

            // Fetch flow data (nodes and edges)
            const dataResponse = await fetch(`/api/flows/${params.id}/data`);
            const data = await dataResponse.json();
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
        } catch (error) {
            console.error('Error fetching flow:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (nodes: Node[], edges: Edge[]) => {
        try {
            await fetch(`/api/flows/${params.id}/data`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges }),
            });
        } catch (error) {
            console.error('Error saving flow:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {flowName}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Editor de diagrama de flujo
                    </p>
                </div>
            </div>

            {/* Flow Diagram */}
            <FlowDiagram
                flowId={params.id}
                initialNodes={nodes}
                initialEdges={edges}
                onSave={handleSave}
            />
        </div>
    );
}
