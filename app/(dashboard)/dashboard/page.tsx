'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, Calendar, Loader2 } from 'lucide-react';

interface Flow {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowDescription, setNewFlowDescription] = useState('');

    useEffect(() => {
        fetchFlows();
    }, []);

    const fetchFlows = async () => {
        try {
            const response = await fetch('/api/flows');
            const data = await response.json();
            setFlows(data.flows || []);
        } catch (error) {
            console.error('Error fetching flows:', error);
        } finally {
            setLoading(false);
        }
    };

    const createFlow = async () => {
        if (!newFlowName.trim()) return;

        setCreating(true);
        try {
            const response = await fetch('/api/flows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFlowName,
                    description: newFlowDescription,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                router.push(`/flow/${data.flow.id}`);
            }
        } catch (error) {
            console.error('Error creating flow:', error);
        } finally {
            setCreating(false);
        }
    };

    const deleteFlow = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este flujo?')) return;

        try {
            await fetch(`/api/flows/${id}`, { method: 'DELETE' });
            setFlows(flows.filter((f) => f.id !== id));
        } catch (error) {
            console.error('Error deleting flow:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Mis Diagramas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestiona tus diagramas de flujo de React Flow
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Diagrama</span>
                </button>
            </div>

            {/* Flows Grid */}
            {flows.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No tienes diagramas aún
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Crea tu primer diagrama para comenzar
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Crear Diagrama</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flows.map((flow) => (
                        <div
                            key={flow.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-200 cursor-pointer group"
                            onClick={() => router.push(`/flow/${flow.id}`)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteFlow(flow.id);
                                    }}
                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {flow.name}
                            </h3>
                            {flow.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                    {flow.description}
                                </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {new Date(flow.updatedAt).toLocaleDateString('es-ES')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Nuevo Diagrama
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={newFlowName}
                                    onChange={(e) => setNewFlowName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                    placeholder="Mi diagrama de flujo"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    value={newFlowDescription}
                                    onChange={(e) => setNewFlowDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all resize-none"
                                    placeholder="Descripción del diagrama..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createFlow}
                                disabled={creating || !newFlowName.trim()}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        <span>Crear</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
