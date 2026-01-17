import React from 'react';
import { X, FolderOpen, FileText, CheckCircle2, ArrowRight, FileJson, Network } from 'lucide-react';

interface ExportInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: 'workbench' | 'flow';
}

export const ExportInstructionsModal = ({ isOpen, onClose, type = 'workbench' }: ExportInstructionsModalProps) => {
    if (!isOpen) return null;

    const isWorkbench = type === 'workbench';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 ring-1 ring-black/5">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {isWorkbench ? 'Exportación Completada' : 'Flujo Exportado'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isWorkbench
                                    ? 'Tu proyecto ha sido descargado exitosamente.'
                                    : 'Tu archivo de flujo ha sido generado y descargado.'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                {isWorkbench ? <FolderOpen className="w-5 h-5" /> : <FileJson className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                    {isWorkbench ? 'Carpeta /workflow' : 'Archivo JSON'}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {isWorkbench
                                        ? <>El archivo .zip contiene una carpeta llamada <code className="font-mono bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">workflow</code>. Descomprímela en la raíz de tu proyecto.</>
                                        : 'Este archivo contiene la definición completa de nodos, conexiones y configuraciones de tu diagrama actual.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                {isWorkbench ? 'Contenido del Paquete' : 'Detalles del Archivo'}
                            </h3>
                            <ul className="space-y-3">
                                {isWorkbench ? (
                                    <>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span>Archivos Markdown (.md) individuales</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span>Un archivo por agente (LLM Agent)</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span>Metadata y System Prompts incluidos</span>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <Network className="w-4 h-4 text-gray-400" />
                                            <span>Estructura completa del grafo</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span>Configuraciones de nodos persistidas</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span>Compatible con importación directa</span>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm shadow-lg shadow-gray-900/20 dark:shadow-white/20"
                        >
                            <span>Entendido</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
