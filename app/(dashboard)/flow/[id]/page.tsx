'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Node, Edge } from '@xyflow/react';
import { Loader2, Save } from 'lucide-react';
import FlowMigrationPackage from '@/components/flow-migration-package';

export default function FlowPage() {
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialNodes, setInitialNodes] = useState<Node[]>([]);
    const [initialEdges, setInitialEdges] = useState<Edge[]>([]);

    useEffect(() => {
        if (id) {
            fetchFlowData();
        }
    }, [id]);

    const fetchFlowData = async () => {
        try {
            const response = await fetch(`/api/flows/${id}/data`);
            if (response.ok) {
                const data = await response.json();
                setInitialNodes(data.nodes || []);
                setInitialEdges(data.edges || []);
            }
        } catch (error) {
            console.error('Error loading flow:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = useCallback(async (nodes: Node[], edges: Edge[]) => {
        if (!id) return;
        setSaving(true);
        try {
            await fetch(`/api/flows/${id}/data`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges }),
            });
        } catch (error) {
            console.error('Error saving flow:', error);
        } finally {
            setTimeout(() => setSaving(false), 500); // Min visibility for feedback
        }
    }, [id]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-black/20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            <FlowMigrationPackage
                initialNodes={initialNodes}
                initialEdges={initialEdges}
                onSave={handleSave}
            />

            {/* Saving Indicator */}
            {saving && (
                <div className="absolute top-4 right-4 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Saving...</span>
                </div>
            )}
        </div>
    );
}
