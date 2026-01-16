'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, Calendar, Loader2, Key, Zap, ArrowRight } from 'lucide-react';

interface Flow {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
                        Mis Diagramas
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                        Gestiona y organiza tus flujos de trabajo
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    <div className="bg-white/20 dark:bg-black/10 rounded-full p-1">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="pr-1">Nuevo Diagrama</span>
                </button>
            </div>

            {/* Content Grid */}
            {flows.length === 0 ? (
                // Empty State
                <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 p-12 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        No hay diagramas todavía
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                        Comienza creando tu primer diagrama de flujo para visualizar tus ideas y procesos.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold rounded-xl transition-colors"
                    >
                        Crear mi primer diagrama
                    </button>
                </div>
            ) : (
                // Grid of Flows
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card (Quick Access) */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="group relative flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-blue-400/50 bg-transparent hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 rounded-full flex items-center justify-center mb-3 transition-colors">
                            <Plus className="w-7 h-7 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                        <span className="font-semibold text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Crear Nuevo
                        </span>
                    </button>

                    {/* Flow Cards */}
                    {flows.map((flow, index) => (
                        <div
                            key={flow.id}
                            onClick={() => router.push(`/flow/${flow.id}`)}
                            className="group relative h-64 flex flex-col justify-between bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Decorative Gradient Blob */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />

                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteFlow(flow.id);
                                        }}
                                        className="p-2 -mr-2 -mt-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {flow.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                    {flow.description || "Sin descripción"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-700/50 mt-auto">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-medium text-gray-400">
                                    Actualizado {new Date(flow.updated_at).toLocaleDateString('es-ES', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Keys Configuration Section - iOS Style Redesign */}
            <div className="mt-16 mb-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                <div className="group relative bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 md:p-10 border border-gray-100 dark:border-white/5 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">

                    {/* Subtle Background Glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-500/5 dark:to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">

                        {/* Content */}
                        <div className="space-y-6 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 backdrop-blur-md">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    Free Tier Friendly
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl tracking-tight font-semibold text-gray-900 dark:text-white">
                                    Trae tus propias llaves.
                                </h2>
                                <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                                    Conecta tus cuentas de Google AI Studio, OpenAI o Anthropic.
                                    <span className="text-gray-400 dark:text-gray-500"> Tus llaves permanecen seguras en tu dispositivo.</span>
                                </p>
                            </div>

                            {/* Provider Badges */}
                            <div className="flex flex-wrap gap-4 pt-1">
                                {[
                                    { name: 'Gemini', color: 'bg-indigo-500' },
                                    { name: 'GPT-4', color: 'bg-emerald-500' },
                                    { name: 'Claude', color: 'bg-orange-500' }
                                ].map((provider) => (
                                    <div key={provider.name} className="flex items-center gap-2 pr-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        <div className={`w-1.5 h-1.5 rounded-full ${provider.color}`} />
                                        {provider.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0 pt-2 lg:pt-0 w-full lg:w-auto">
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))}
                                className="group/btn relative w-full lg:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl font-medium text-[17px] shadow-sm transition-all duration-300 active:scale-[0.98]"
                            >
                                <span className="relative z-10">Configurar API Keys</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/20 dark:bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <div className="relative bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-gray-800">
                        <div className="p-8 pb-0">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
                                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Nuevo Diagrama
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Dale un nombre y una descripción a tu nuevo flujo de trabajo.
                            </p>
                        </div>

                        <div className="p-8 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                    Nombre del Proyecto
                                </label>
                                <input
                                    type="text"
                                    value={newFlowName}
                                    onChange={(e) => setNewFlowName(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-gray-900 dark:text-white placeholder-gray-400 transition-all font-medium text-lg"
                                    placeholder="Ej. Flujo de Marketing"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                    Descripción <span className="text-gray-400 font-normal">(Opcional)</span>
                                </label>
                                <textarea
                                    value={newFlowDescription}
                                    onChange={(e) => setNewFlowDescription(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-gray-900 dark:text-white placeholder-gray-400 transition-all resize-none"
                                    placeholder="¿De qué trata este diagrama?"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="p-8 pt-0 flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createFlow}
                                disabled={creating || !newFlowName.trim()}
                                className="flex-1 px-6 py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {creating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span>Crear Proyecto</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
